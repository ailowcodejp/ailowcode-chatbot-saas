/// <reference lib="deno.ns" />

import {
	corsHeaders,
	jsonResponse,
	methodNotAllowed,
	validateAllowedRedirectUrl,
} from "../_shared/http.ts";
import { createAdminClient, createUserClient } from "../_shared/supabase.ts";
import { stripeRequest } from "../_shared/stripe.ts";

type PortalRequest = {
	returnUrl?: unknown;
};

type StripePortalSession = {
	id: string;
	url?: string | null;
};

Deno.serve(async (request: Request) => {
	if (request.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	if (request.method !== "POST") {
		return methodNotAllowed();
	}

	try {
		const authorization = request.headers.get("Authorization");
		if (!authorization) {
			return jsonResponse({ error: "not_authenticated" }, 401);
		}

		const body = (await request.json()) as PortalRequest;
		const returnUrl = validateAllowedRedirectUrl(body.returnUrl, "/billing");
		const userClient = createUserClient(authorization);
		const {
			data: { user },
			error: userError,
		} = await userClient.auth.getUser();

		if (userError || !user) {
			return jsonResponse({ error: "not_authenticated" }, 401);
		}

		const adminClient = createAdminClient();
		const { data: billingCustomer, error: customerError } = await adminClient
			.from("billing_customers")
			.select("stripe_customer_id")
			.eq("user_id", user.id)
			.maybeSingle();

		if (customerError) {
			console.error("Failed to load billing customer", customerError);
			return jsonResponse({ error: "billing_customer_lookup_failed" }, 500);
		}

		if (!billingCustomer?.stripe_customer_id) {
			return jsonResponse({ error: "billing_customer_not_found" }, 404);
		}

		const params = new URLSearchParams();
		params.set("customer", billingCustomer.stripe_customer_id);
		params.set("return_url", returnUrl);

		const session = await stripeRequest<StripePortalSession>(
			"billing_portal/sessions",
			params,
		);

		if (!session.url) {
			return jsonResponse({ error: "portal_session_url_missing" }, 502);
		}

		return jsonResponse({
			id: session.id,
			url: session.url,
		});
	} catch (error) {
		console.error("create-billing-portal-session error", error);

		if (
			error instanceof Error &&
			error.message === "redirect_origin_not_allowed"
		) {
			return jsonResponse({ error: "redirect_origin_not_allowed" }, 400);
		}

		return jsonResponse({ error: "internal_error" }, 500);
	}
});
