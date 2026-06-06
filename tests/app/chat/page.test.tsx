import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionMock = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
});

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() =>
		Promise.resolve({
			auth: {
				getSession: getSessionMock,
			},
		}),
	),
}));

vi.mock("@/features/chat/components/chat-sidebar", () => ({
	ChatSidebar: () => <aside data-testid="chat-sidebar">Sidebar</aside>,
}));

describe("Chat page", () => {
	it("renders new chat form", async () => {
		const { default: ChatPage } = await import("@/app/chat/page");
		const result = await ChatPage();

		expect(result).toBeDefined();
	});
});
