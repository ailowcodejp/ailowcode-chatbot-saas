/// <reference lib="deno.ns" />

import {
	corsHeaders,
	jsonResponse,
	methodNotAllowed,
	validateAllowedRedirectUrl,
} from "../_shared/http.ts";
import { createAdminClient, createUserClient } from "../_shared/supabase.ts";
import {
	assertAllowedPriceId,
	stripeRequest,
	type StripeCheckoutSession,
} from "../_shared/stripe.ts";

type CheckoutRequest = {
	priceId?: unknown;
	successUrl?: unknown;
	cancelUrl?: unknown;
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

		const body = (await request.json()) as CheckoutRequest;
		const priceId = typeof body.priceId === "string" ? body.priceId.trim() : "";

		if (!priceId) {
			return jsonResponse({ error: "price_id_required" }, 400);
		}

		assertAllowedPriceId(priceId);

		const successUrl = validateAllowedRedirectUrl(
			body.successUrl,
			"/billing?checkout=success",
		);
		const cancelUrl = validateAllowedRedirectUrl(
			body.cancelUrl,
			"/billing?checkout=cancelled",
		);

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

		const params = new URLSearchParams();
		params.set("mode", "subscription");
		params.set("line_items[0][price]", priceId);
		params.set("line_items[0][quantity]", "1");
		params.set("success_url", successUrl);
		params.set("cancel_url", cancelUrl);
		params.set("client_reference_id", user.id);
		params.set("metadata[supabase_user_id]", user.id);
		params.set("subscription_data[metadata][supabase_user_id]", user.id);
		params.set("subscription_data[metadata][price_id]", priceId);
		params.set("allow_promotion_codes", "true");

		if (billingCustomer?.stripe_customer_id) {
			params.set("customer", billingCustomer.stripe_customer_id);
		} else if (user.email) {
			params.set("customer_email", user.email);
		}

		const session = await stripeRequest<StripeCheckoutSession>(
			"checkout/sessions",
			params,
		);

		if (!session.url) {
			return jsonResponse({ error: "checkout_session_url_missing" }, 502);
		}

		return jsonResponse({
			id: session.id,
			url: session.url,
		});
	} catch (error) {
		console.error("create-billing-checkout-session error", error);

		if (error instanceof Error && error.message === "price_id_not_allowed") {
			return jsonResponse({ error: "price_id_not_allowed" }, 400);
		}

		if (
			error instanceof Error &&
			error.message === "redirect_origin_not_allowed"
		) {
			return jsonResponse({ error: "redirect_origin_not_allowed" }, 400);
		}

		return jsonResponse({ error: "internal_error" }, 500);
	}
});
