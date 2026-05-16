import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "../../middleware";

describe("middleware", () => {
	it("allows public routes", () => {
		const request = new NextRequest(new URL("http://localhost:3000/"));
		const response = middleware(request);
		expect(response.status).toBe(200);
	});

	it("redirects unauthenticated users from protected routes", () => {
		const request = new NextRequest(new URL("http://localhost:3000/chat"));
		const response = middleware(request);
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe(
			"http://localhost:3000/login?redirectTo=%2Fchat",
		);
	});

	it("allows authenticated users to protected routes", () => {
		const request = new NextRequest(new URL("http://localhost:3000/chat"), {
			headers: {
				cookie: "sb-access-token=valid-token",
			},
		});
		const response = middleware(request);
		expect(response.status).toBe(200);
	});
});
