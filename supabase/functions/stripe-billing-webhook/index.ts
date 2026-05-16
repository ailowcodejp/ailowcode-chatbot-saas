/// <reference lib="deno.ns" />

import {
	corsHeaders,
	getRequiredEnv,
	jsonResponse,
	methodNotAllowed,
} from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import {
	epochToIso,
	getSubscriptionPriceId,
	inferPlanFromPriceId,
	type StripeCheckoutSession,
	type StripeEvent,
	type StripeInvoice,
	type StripeSubscription,
	verifyStripeWebhookSignature,
} from "../_shared/stripe.ts";

type RpcClient = {
	rpc: (
		functionName: string,
		args: Record<string, unknown>,
	) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

function normalizeSubscriptionStatus(status: string) {
	const allowed = new Set([
		"incomplete",
		"incomplete_expired",
		"trialing",
		"active",
		"past_due",
		"canceled",
		"unpaid",
		"paused",
	]);

	return allowed.has(status) ? status : "incomplete";
}

async function findUserIdByCustomer(
	adminClient: unknown,
	customerId: string | null | undefined,
) {
	if (!customerId) {
		return null;
	}

	const { data, error } = await (adminClient as RpcClient).rpc(
		"get_user_id_by_stripe_customer",
		{
			p_stripe_customer_id: customerId,
		},
	);

	if (error) {
		throw new Error(error.message);
	}

	return typeof data === "string" ? data : null;
}

async function upsertSubscription(
	adminClient: unknown,
	userId: string,
	subscription: StripeSubscription,
) {
	const priceId = getSubscriptionPriceId(subscription);
	const { error } = await (adminClient as RpcClient).rpc(
		"upsert_billing_subscription_from_stripe",
		{
			p_user_id: userId,
			p_stripe_customer_id: subscription.customer,
			p_stripe_subscription_id: subscription.id,
			p_stripe_price_id: priceId,
			p_plan: inferPlanFromPriceId(priceId),
			p_status: normalizeSubscriptionStatus(subscription.status),
			p_current_period_start: epochToIso(subscription.current_period_start),
			p_current_period_end: epochToIso(subscription.current_period_end),
			p_cancel_at_period_end: subscription.cancel_at_period_end ?? false,
			p_canceled_at: epochToIso(subscription.canceled_at),
			p_trial_start: epochToIso(subscription.trial_start),
			p_trial_end: epochToIso(subscription.trial_end),
			p_metadata: subscription.metadata ?? {},
		},
	);

	if (error) {
		throw new Error(error.message);
	}
}

async function recordEvent(
	adminClient: unknown,
	event: StripeEvent,
	status: "received" | "processed" | "failed" | "skipped",
	errorMessage: string | null = null,
) {
	const { data, error } = await (adminClient as RpcClient).rpc(
		"record_billing_webhook_event",
		{
			p_stripe_event_id: event.id,
			p_event_type: event.type,
			p_payload: event,
			p_status: status,
			p_error_message: errorMessage,
		},
	);

	if (error) {
		throw new Error(error.message);
	}

	return data as { already_processed?: boolean } | null;
}

async function markProcessed(adminClient: unknown, eventId: string) {
	const { error } = await (adminClient as RpcClient).rpc(
		"mark_billing_webhook_event_processed",
		{
			p_stripe_event_id: eventId,
		},
	);

	if (error) {
		throw new Error(error.message);
	}
}

async function handleCheckoutCompleted(
	adminClient: unknown,
	session: StripeCheckoutSession,
) {
	const userId =
		session.client_reference_id ?? session.metadata?.supabase_user_id ?? null;
	const customerId = session.customer;

	if (!userId || !customerId) {
		throw new Error("checkout_session_missing_user_or_customer");
	}

	const { error } = await (adminClient as RpcClient).rpc(
		"upsert_billing_customer",
		{
			p_user_id: userId,
			p_stripe_customer_id: customerId,
			p_email: session.customer_details?.email ?? null,
			p_name: session.customer_details?.name ?? null,
			p_metadata: session.metadata ?? {},
		},
	);

	if (error) {
		throw new Error(error.message);
	}
}

async function handleSubscriptionEvent(
	adminClient: unknown,
	subscription: StripeSubscription,
) {
	const userId =
		subscription.metadata?.supabase_user_id ??
		(await findUserIdByCustomer(adminClient, subscription.customer));

	if (!userId) {
		throw new Error("subscription_user_not_found");
	}

	await upsertSubscription(adminClient, userId, subscription);
}

async function handleInvoicePaymentSucceeded(
	adminClient: unknown,
	invoice: StripeInvoice,
) {
	const userId = await findUserIdByCustomer(adminClient, invoice.customer);

	if (!userId) {
		throw new Error("invoice_user_not_found");
	}

	const periodEnd = invoice.lines?.data?.[0]?.period?.end;
	const idempotencyKey = `stripe_invoice:${invoice.id}:monthly_grant`;
	const { error } = await (adminClient as RpcClient).rpc(
		"grant_monthly_credits",
		{
			p_user_id: userId,
			p_amount: 100,
			p_idempotency_key: idempotencyKey,
			p_description: "Monthly subscription credits",
			p_metadata: {
				stripe_invoice_id: invoice.id,
				stripe_subscription_id: invoice.subscription,
				period_end: periodEnd ? epochToIso(periodEnd) : null,
			},
		},
	);

	if (error) {
		throw new Error(error.message);
	}
}

Deno.serve(async (request: Request) => {
	if (request.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	if (request.method !== "POST") {
		return methodNotAllowed();
	}

	const payload = await request.text();

	try {
		await verifyStripeWebhookSignature(
			payload,
			request.headers.get("stripe-signature"),
			getRequiredEnv("STRIPE_WEBHOOK_SECRET"),
		);
	} catch (error) {
		return jsonResponse(
			{ error: error instanceof Error ? error.message : "invalid_signature" },
			400,
		);
	}

	const event = JSON.parse(payload) as StripeEvent;
	const adminClient = createAdminClient();

	try {
		const record = await recordEvent(adminClient, event, "received");
		if (record?.already_processed) {
			return jsonResponse({ received: true, status: "already_processed" });
		}

		switch (event.type) {
			case "checkout.session.completed":
				await handleCheckoutCompleted(
					adminClient,
					event.data.object as StripeCheckoutSession,
				);
				break;
			case "customer.subscription.created":
			case "customer.subscription.updated":
			case "customer.subscription.deleted":
				await handleSubscriptionEvent(
					adminClient,
					event.data.object as StripeSubscription,
				);
				break;
			case "invoice.payment_succeeded":
				await handleInvoicePaymentSucceeded(
					adminClient,
					event.data.object as StripeInvoice,
				);
				break;
			default:
				await recordEvent(adminClient, event, "skipped");
				return jsonResponse({ received: true, status: "skipped" });
		}

		await markProcessed(adminClient, event.id);
		return jsonResponse({ received: true, status: "processed" });
	} catch (error) {
		console.error("stripe-billing-webhook processing error", error);
		await recordEvent(
			adminClient,
			event,
			"failed",
			error instanceof Error ? error.message : "unknown_error",
		);
		return jsonResponse({ error: "webhook_processing_failed" }, 500);
	}
});
