import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

import { getRequiredEnv } from "./http.ts";

type SupabaseClientOptions = Parameters<typeof createClient>[2];

export function getSupabasePublishableKey(): string {
	const singleKey =
		Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
		Deno.env.get("SUPABASE_ANON_KEY");

	if (singleKey) {
		return singleKey;
	}

	const keyedJson = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
	if (keyedJson) {
		const keys = JSON.parse(keyedJson) as Record<string, string>;
		if (keys.default) {
			return keys.default;
		}
	}

	throw new Error("Missing Supabase publishable key");
}

export function getSupabaseSecretKey(): string {
	const singleKey =
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
		Deno.env.get("SUPABASE_SECRET_KEY");

	if (singleKey) {
		return singleKey;
	}

	const keyedJson = Deno.env.get("SUPABASE_SECRET_KEYS");
	if (keyedJson) {
		const keys = JSON.parse(keyedJson) as Record<string, string>;
		if (keys.default) {
			return keys.default;
		}
	}

	throw new Error("Missing Supabase service role key");
}

export function createUserClient(authorization: string) {
	return createClient(
		getRequiredEnv("SUPABASE_URL"),
		getSupabasePublishableKey(),
		{
			global: {
				headers: { Authorization: authorization },
			},
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		} satisfies SupabaseClientOptions,
	);
}

export function createAdminClient() {
	return createClient(getRequiredEnv("SUPABASE_URL"), getSupabaseSecretKey(), {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	} satisfies SupabaseClientOptions);
}
