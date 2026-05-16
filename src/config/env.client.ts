type ClientEnv = {
	NEXT_PUBLIC_SITE_URL?: string;
	NEXT_PUBLIC_SUPABASE_URL: string;
	NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
};

function requireEnv(name: keyof ClientEnv): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

export function getClientEnv(): ClientEnv {
	return {
		NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
		NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
		NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requireEnv(
			"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
		),
	};
}
