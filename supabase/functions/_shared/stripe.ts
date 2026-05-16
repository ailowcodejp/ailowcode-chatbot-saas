import { getEnvList, getRequiredEnv } from "./http.ts";

export type StripeCheckoutSession = {
	id: string;
	url?: string | null;
	customer?: string | null;
	subscription?: string | null;
	client_reference_id?: string | null;
	customer_details?: {
		email?: string | null;
		name?: string | null;
	};
	metadata?: Record<string, string>;
};

export type StripeSubscription = {
	id: string;
	customer: string;
	status: string;
	cancel_at_period_end?: boolean;
	current_period_start?: number | null;
	current_period_end?: number | null;
	canceled_at?: number | null;
	trial_start?: number | null;
	trial_end?: number | null;
	metadata?: Record<string, string>;
	items?: {
		data?: Array<{
			price?: {
				id?: string;
			};
		}>;
	};
};

export type StripeInvoice = {
	id: string;
	customer?: string | null;
	subscription?: string | null;
	lines?: {
		data?: Array<{
			period?: {
				start?: number;
				end?: number;
			};
			price?: {
				id?: string;
			};
		}>;
	};
};

export type StripeEvent<T = unknown> = {
	id: string;
	type: string;
	data: {
		object: T;
	};
};

export async function stripeRequest<T>(
	path: string,
	params: URLSearchParams,
): Promise<T> {
	const response = await fetch(`https://api.stripe.com/v1/${path}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${getRequiredEnv("STRIPE_SECRET_KEY")}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params,
	});

	const body = (await response.json()) as T & {
		error?: {
			message?: string;
			type?: string;
		};
	};

	if (!response.ok) {
		throw new Error(body.error?.message ?? "stripe_api_error");
	}

	return body;
}

export function assertAllowedPriceId(priceId: string): void {
	if (!getEnvList("STRIPE_ALLOWED_PRICE_IDS").includes(priceId)) {
		throw new Error("price_id_not_allowed");
	}
}

export function inferPlanFromPriceId(priceId: string | null | undefined) {
	if (!priceId) {
		return "free";
	}

	const monthlyPriceId = Deno.env.get("STRIPE_PRO_MONTHLY_PRICE_ID");
	const yearlyPriceId = Deno.env.get("STRIPE_PRO_YEARLY_PRICE_ID");

	if (yearlyPriceId && priceId === yearlyPriceId) {
		return "pro_yearly";
	}

	if (monthlyPriceId && priceId === monthlyPriceId) {
		return "pro_monthly";
	}

	return /year|annual/i.test(priceId) ? "pro_yearly" : "pro_monthly";
}

export function epochToIso(value: number | null | undefined): string | null {
	return typeof value === "number"
		? new Date(value * 1000).toISOString()
		: null;
}

export function getSubscriptionPriceId(subscription: StripeSubscription) {
	return subscription.items?.data?.[0]?.price?.id ?? null;
}

export async function verifyStripeWebhookSignature(
	payload: string,
	signatureHeader: string | null,
	secret: string,
): Promise<void> {
	if (!signatureHeader) {
		throw new Error("Missing stripe-signature header");
	}

	const parts = Object.fromEntries(
		signatureHeader.split(",").map((part) => {
			const [key, value] = part.split("=", 2);
			return [key, value];
		}),
	);
	const timestamp = parts.t;
	const expected = parts.v1;

	if (!timestamp || !expected) {
		throw new Error("Invalid stripe-signature header");
	}

	const signedPayload = `${timestamp}.${payload}`;
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(signedPayload),
	);
	const computed = Array.from(new Uint8Array(signature))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");

	if (computed !== expected) {
		throw new Error("Stripe webhook signature verification failed");
	}
}
