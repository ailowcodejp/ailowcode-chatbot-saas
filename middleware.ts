import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedRoutes = ["/chat", "/billing"];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isProtected = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);

	if (!isProtected) {
		return NextResponse.next();
	}

	const accessToken = request.cookies.get("sb-access-token")?.value;

	if (!accessToken) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("redirectTo", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/chat/:path*", "/billing/:path*"],
};
