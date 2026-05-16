import { NextResponse } from "next/server";

import { getServerEnv } from "@/config/env.server";

export const runtime = "edge";

function getAllowedPriceIds() {
	return getServerEnv()
		.STRIPE_ALLOWED_PRICE_IDS.split(",")
		.map((priceId) => priceId.trim())
		.filter(Boolean);
}

export function GET() {
	const priceIds = getAllowedPriceIds();

	return NextResponse.json({
		plans: priceIds.map((priceId, index) => ({
			id: priceId,
			name: index === 0 ? "Pro" : `Pro ${index + 1}`,
			description: "AIチャットの月次クレジットを追加するサブスクプラン",
		})),
	});
}
