import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database.types";

const protectedPaths = ["/chat", "/billing"];

export async function proxy(request: NextRequest) {
	let response = NextResponse.next({
		request,
	});

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabasePublishableKey =
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

	if (!supabaseUrl || !supabasePublishableKey) {
		return response;
	}

	const supabase = createServerClient<Database>(
		supabaseUrl,
		supabasePublishableKey,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}

					response = NextResponse.next({
						request,
					});

					for (const { name, value, options } of cookiesToSet) {
						response.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const isProtectedPath = protectedPaths.some((path) =>
		request.nextUrl.pathname.startsWith(path),
	);

	if (!user && isProtectedPath) {
		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = "/login";
		redirectUrl.searchParams.set("next", request.nextUrl.pathname);
		return NextResponse.redirect(redirectUrl);
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
