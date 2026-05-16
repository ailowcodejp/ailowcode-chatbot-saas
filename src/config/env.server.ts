import "server-only";

import { getClientEnv } from "./env.client";

type ServerEnv = ReturnType<typeof getClientEnv> & {
	SUPABASE_SERVICE_ROLE_KEY: string;
	LLM_GATEWAY_API_KEY: string;
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
	};
}
