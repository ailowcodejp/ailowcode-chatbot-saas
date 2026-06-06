import { NextResponse } from "next/server";

import { getServerEnv } from "@/config/env.server";

export const runtime = "edge";

function getAllowedPriceIds(value: string) {
	return value
		.split(",")
		.map((priceId) => priceId.trim())
		.filter(Boolean);
}

function getPlanName(
	priceId: string,
	index: number,
	planPriceIds: { monthly?: string; yearly?: string },
) {
	if (planPriceIds.monthly === priceId) {
		return "Pro Monthly";
	}

	if (planPriceIds.yearly === priceId) {
		return "Pro Yearly";
	}

	return index === 0 ? "Pro" : `Pro ${index + 1}`;
}

export function GET() {
	const env = getServerEnv();
	const priceIds = getAllowedPriceIds(env.STRIPE_ALLOWED_PRICE_IDS);

	return NextResponse.json({
		plans: priceIds.map((priceId, index) => ({
			id: priceId,
			name: getPlanName(priceId, index, {
				monthly: env.STRIPE_PRO_MONTHLY_PRICE_ID,
				yearly: env.STRIPE_PRO_YEARLY_PRICE_ID,
			}),
			description: "AIチャットの月次クレジットを追加するサブスクプラン",
		})),
	});
}
