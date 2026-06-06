import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionMock = vi.fn();
const fromMock = vi.fn();
const selectMock = vi.fn();
const eqMock = vi.fn();
const isMock = vi.fn();
const orderMock = vi.fn();

const createClientMock = vi.fn(() =>
	Promise.resolve({
		auth: {
			getSession: getSessionMock,
		},
		from: fromMock,
	}),
);

beforeEach(() => {
	vi.clearAllMocks();
	fromMock.mockReturnValue({
		select: selectMock,
	});
	selectMock.mockReturnValue({
		eq: eqMock,
	});
	eqMock.mockReturnValue({
		eq: eqMock,
		is: isMock,
		order: orderMock,
	});
	isMock.mockReturnValue({
		order: orderMock,
	});
	orderMock.mockReturnValue({
		data: [],
		error: null,
	});
});

vi.mock("@/lib/supabase/server", () => ({
	createClient: createClientMock,
}));

async function importActions() {
	const { getChatSessions, getChatSessionWithMessages } =
		await import("@/features/chat/actions");
	return { getChatSessions, getChatSessionWithMessages };
}

describe("getChatSessions", () => {
	it("returns empty array when not authenticated", async () => {
		getSessionMock.mockResolvedValueOnce({ data: { session: null } });

		const { getChatSessions } = await importActions();
		const result = await getChatSessions();

		expect(result).toEqual([]);
		expect(fromMock).not.toHaveBeenCalled();
	});

	it("returns chat sessions ordered by updated_at desc", async () => {
		const sessions = [
			{
				id: "session-1",
				user_id: "user-1",
				title: "Test Session 1",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-02T00:00:00Z",
				deleted_at: null,
				metadata: {},
			},
			{
				id: "session-2",
				user_id: "user-1",
				title: "Test Session 2",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-03T00:00:00Z",
				deleted_at: null,
				metadata: {},
			},
		];

		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "user-1" } } },
		});

		fromMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					is: vi.fn().mockReturnValue({
						order: vi.fn().mockReturnValue({
							data: sessions,
							error: null,
						}),
					}),
				}),
			}),
		});

		const { getChatSessions } = await importActions();
		const result = await getChatSessions();

		expect(result).toEqual(sessions);
	});

	it("returns empty array on database error", async () => {
		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "user-1" } } },
		});

		fromMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					is: vi.fn().mockReturnValue({
						order: vi.fn().mockReturnValue({
							data: null,
							error: { message: "Database error" },
						}),
					}),
				}),
			}),
		});

		const { getChatSessions } = await importActions();
		const result = await getChatSessions();

		expect(result).toEqual([]);
	});
});

describe("getChatSessionWithMessages", () => {
	it("returns null when not authenticated", async () => {
		getSessionMock.mockResolvedValueOnce({ data: { session: null } });

		const { getChatSessionWithMessages } = await importActions();
		const result = await getChatSessionWithMessages("session-1");

		expect(result).toBeNull();
	});

	it("returns null when session not found or unauthorized", async () => {
		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "user-1" } } },
		});

		fromMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						is: vi.fn().mockReturnValue({
							single: vi.fn().mockReturnValue({
								data: null,
								error: { message: "Not found" },
							}),
						}),
					}),
				}),
			}),
		});

		const { getChatSessionWithMessages } = await importActions();
		const result = await getChatSessionWithMessages("session-1");

		expect(result).toBeNull();
	});

	it("returns session and messages when found", async () => {
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
			{
				id: "msg-2",
				session_id: "session-1",
				user_id: "user-1",
				role: "assistant",
				content: "Hi there!",
				created_at: "2024-01-01T00:01:00Z",
				model: null,
				token_count: null,
				llm_gateway_request_id: null,
				metadata: {},
			},
		];

		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "user-1" } } },
		});

		const singleMockFn = vi
			.fn()
			.mockReturnValueOnce({ data: session, error: null });
		const orderMessagesMock = vi.fn().mockReturnValue({
			data: messages,
			error: null,
		});

		fromMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						is: vi.fn().mockReturnValue({
							single: singleMockFn,
						}),
					}),
				}),
			}),
		});

		fromMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					order: orderMessagesMock,
				}),
			}),
		});

		const { getChatSessionWithMessages } = await importActions();
		const result = await getChatSessionWithMessages("session-1");

		expect(result).toEqual({ session, messages });
	});

	it("returns session with empty messages on messages error", async () => {
		const session = {
			id: "session-1",
			user_id: "user-1",
			title: "Test Session",
			created_at: "2024-01-01T00:00:00Z",
			updated_at: "2024-01-02T00:00:00Z",
			deleted_at: null,
			metadata: {},
		};

		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "user-1" } } },
		});

		fromMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						is: vi.fn().mockReturnValue({
							single: vi.fn().mockReturnValue({
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
					order: vi.fn().mockReturnValue({
						data: null,
						error: { message: "Messages error" },
					}),
				}),
			}),
		});

		const { getChatSessionWithMessages } = await importActions();
		const result = await getChatSessionWithMessages("session-1");

		expect(result).toEqual({ session, messages: [] });
	});
});
