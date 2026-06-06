import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const getChatSessionsMock = vi.fn();
const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
	usePathname: () => usePathnameMock(),
}));

vi.mock("@/features/chat/actions", () => ({
	getChatSessions: () => getChatSessionsMock(),
}));

vi.mock("@/features/auth/components/logout-button", () => ({
	LogoutButton: () => <button type="submit">ログアウト</button>,
}));

beforeEach(() => {
	getChatSessionsMock.mockClear();
	usePathnameMock.mockReturnValue("/chat");
});

describe("ChatSidebar", () => {
	it("renders sidebar with logo and search", async () => {
		getChatSessionsMock.mockResolvedValueOnce([]);

		const { ChatSidebar } =
			await import("@/features/chat/components/chat-sidebar");
		render(<ChatSidebar />);

		expect(await screen.findByText("AI LowCode")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("チャットを検索")).toBeInTheDocument();
		expect(screen.getByText("チャット履歴")).toBeInTheDocument();
	});

	it("renders empty state when no sessions", async () => {
		getChatSessionsMock.mockResolvedValueOnce([]);

		const { ChatSidebar } =
			await import("@/features/chat/components/chat-sidebar");
		render(<ChatSidebar />);

		await waitFor(() => {
			expect(screen.getByText("履歴がありません")).toBeInTheDocument();
		});
	});

	it("renders chat sessions as links", async () => {
		const sessions = [
			{
				id: "session-1",
				user_id: "user-1",
				title: "Test Session 1",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
				deleted_at: null,
				metadata: {},
			},
			{
				id: "session-2",
				user_id: "user-1",
				title: "Test Session 2",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: new Date(Date.now() - 86400000).toISOString(),
				deleted_at: null,
				metadata: {},
			},
		];

		getChatSessionsMock.mockResolvedValueOnce(sessions);

		const { ChatSidebar } =
			await import("@/features/chat/components/chat-sidebar");
		render(<ChatSidebar />);

		await waitFor(() => {
			expect(screen.getByText("Test Session 1")).toBeInTheDocument();
			expect(screen.getByText("Test Session 2")).toBeInTheDocument();
		});

		const link1 = screen.getByText("Test Session 1").closest("a");
		expect(link1).toHaveAttribute("href", "/chat/session-1");
	});

	it("marks active session based on pathname", async () => {
		usePathnameMock.mockReturnValue("/chat/session-1");

		const sessions = [
			{
				id: "session-1",
				user_id: "user-1",
				title: "Active Session",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: new Date().toISOString(),
				deleted_at: null,
				metadata: {},
			},
			{
				id: "session-2",
				user_id: "user-1",
				title: "Inactive Session",
				created_at: "2024-01-01T00:00:00Z",
				updated_at: new Date().toISOString(),
				deleted_at: null,
				metadata: {},
			},
		];

		getChatSessionsMock.mockResolvedValueOnce(sessions);

		const { ChatSidebar } =
			await import("@/features/chat/components/chat-sidebar");
		render(<ChatSidebar />);

		await waitFor(() => {
			expect(screen.getByText("Active Session")).toBeInTheDocument();
		});

		const activeLink = screen
			.getByText("Active Session")
			.closest("a") as HTMLElement;
		expect(activeLink.className).toContain("bg-[#f2f4f7]");

		const inactiveLink = screen
			.getByText("Inactive Session")
			.closest("a") as HTMLElement;
		expect(inactiveLink.className).not.toContain("bg-[#f2f4f7]");
	});

	it("renders new chat button linking to /chat", async () => {
		getChatSessionsMock.mockResolvedValueOnce([]);

		const { ChatSidebar } =
			await import("@/features/chat/components/chat-sidebar");
		render(<ChatSidebar />);

		const newChatButton = await screen.findByRole("link", {
			name: "新しいチャット",
		});
		expect(newChatButton).toHaveAttribute("href", "/chat");
	});
});
