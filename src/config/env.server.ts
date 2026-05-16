import "server-only";

import { getClientEnv } from "./env.client";

type ServerEnv = ReturnType<typeof getClientEnv> & {
	SUPABASE_SERVICE_ROLE_KEY: string;
	LLM_GATEWAY_API_KEY: string;
	STRIPE_SECRET_KEY: string;
	STRIPE_WEBHOOK_SECRET: string;
	STRIPE_ALLOWED_PRICE_IDS: string;
	ALLOWED_REDIRECT_ORIGINS?: string;
};

function requireServerEnv(name: keyof ServerEnv): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

export function getServerEnv(): ServerEnv {
	return {
		...getClientEnv(),
		SUPABASE_SERVICE_ROLE_KEY: requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
		LLM_GATEWAY_API_KEY: requireServerEnv("LLM_GATEWAY_API_KEY"),
		STRIPE_SECRET_KEY: requireServerEnv("STRIPE_SECRET_KEY"),
		STRIPE_WEBHOOK_SECRET: requireServerEnv("STRIPE_WEBHOOK_SECRET"),
		STRIPE_ALLOWED_PRICE_IDS: requireServerEnv("STRIPE_ALLOWED_PRICE_IDS"),
		ALLOWED_REDIRECT_ORIGINS: process.env.ALLOWED_REDIRECT_ORIGINS,
	};
}
