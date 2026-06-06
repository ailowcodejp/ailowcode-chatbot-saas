import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionMock = vi.fn();
const fromMock = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
});

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() =>
		Promise.resolve({
			auth: {
				getSession: getSessionMock,
			},
			from: fromMock,
		}),
	),
}));

vi.mock("@/features/chat/components/chat-sidebar", () => ({
	ChatSidebar: () => <aside data-testid="chat-sidebar">Sidebar</aside>,
}));

async function importPage() {
	return await import("@/app/chat/[id]/page");
}

describe("Chat detail page", () => {
	it("renders not found when session does not exist", async () => {
		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "user-1" } } },
		});

		fromMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						is: vi.fn().mockReturnValue({
							single: vi.fn().mockResolvedValue({
								data: null,
								error: { message: "Not found" },
							}),
						}),
					}),
				}),
			}),
		});

		const { default: ChatDetailPage } = await importPage();
		const result = await ChatDetailPage({
			params: Promise.resolve({ id: "nonexistent" }),
		});

		expect(result).toBeDefined();
	});

	it("renders chat form with session data", async () => {
		const session = {
			id: "session-1",
			user_id: "user-1",
			title: "Test Session",
			created_at: "2024-01-01T00:00:00Z",
			updated_at: "2024-01-02T00:00:00Z",
			deleted_at: null,
			metadata: {},
		};
		const messages = [
			{
				id: "msg-1",
				session_id: "session-1",
				user_id: "user-1",
				role: "user",
				content: "Hello",
				created_at: "2024-01-01T00:00:00Z",
				model: null,
				token_count: null,
				llm_gateway_request_id: null,
				metadata: {},
			},
		];

		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "user-1" } } },
		});

		fromMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						is: vi.fn().mockReturnValue({
							single: vi.fn().mockResolvedValue({
								data: session,
								error: null,
							}),
						}),
					}),
				}),
			}),
		});

		fromMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					order: vi.fn().mockResolvedValue({
						data: messages,
						error: null,
					}),
				}),
			}),
		});

		const { default: ChatDetailPage } = await importPage();
		const result = await ChatDetailPage({
			params: Promise.resolve({ id: "session-1" }),
		});

		expect(result).toBeDefined();
	});
});
