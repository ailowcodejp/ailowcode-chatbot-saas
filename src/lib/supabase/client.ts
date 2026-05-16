"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/config/env.client";
import type { Database } from "@/types/database.types";

export function createClient() {
	const env = getClientEnv();

	return createBrowserClient<Database>(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	);
}
