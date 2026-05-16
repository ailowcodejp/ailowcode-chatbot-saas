export const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type, stripe-signature",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200): Response {
	return Response.json(body, {
		status,
		headers: corsHeaders,
	});
}

export function methodNotAllowed(): Response {
	return jsonResponse({ error: "method_not_allowed" }, 405);
}

export function getRequiredEnv(name: string): string {
	const value = Deno.env.get(name);

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

export function getEnvList(name: string): string[] {
	return (Deno.env.get(name) ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
}

export function validateAllowedRedirectUrl(
	value: unknown,
	fallbackPath: string,
): string {
	const siteUrl =
		Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";
	const allowedOrigins = new Set([
		new URL(siteUrl).origin,
		...getEnvList("ALLOWED_REDIRECT_ORIGINS"),
	]);

	const candidate =
		typeof value === "string" && value.trim()
			? value.trim()
			: new URL(fallbackPath, siteUrl).toString();
	const parsed = new URL(candidate, siteUrl);

	if (!allowedOrigins.has(parsed.origin)) {
		throw new Error("redirect_origin_not_allowed");
	}

	return parsed.toString();
}
