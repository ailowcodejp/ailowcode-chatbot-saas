import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn();
const getSessionMock = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
});

vi.mock("next/navigation", () => ({
	redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() =>
		Promise.resolve({
			auth: {
				getSession: getSessionMock,
			},
		}),
	),
}));

describe("Home page", () => {
	it("redirects to chat when session exists", async () => {
		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "123" } } },
		});

		const { default: Home } = await import("@/app/page");
		await Home();

		expect(redirectMock).toHaveBeenCalledWith("/chat");
	});

	it("renders home view when no session", async () => {
		getSessionMock.mockResolvedValueOnce({
			data: { session: null },
		});

		const { default: Home } = await import("@/app/page");
		const result = await Home();

		expect(redirectMock).not.toHaveBeenCalled();
		expect(result).toBeDefined();
	});
});
