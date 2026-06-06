import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
const getSessionMock = vi.fn();
const invokeMock = vi.fn();

const createClientMock = vi.fn(() => ({
	auth: {
		getSession: getSessionMock,
	},
	functions: {
		invoke: invokeMock,
	},
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/supabase/client", () => ({
	createClient: createClientMock,
}));

beforeEach(() => {
	pushMock.mockClear();
	getSessionMock.mockClear();
	invokeMock.mockClear();
	createClientMock.mockClear();
});

describe("ChatForm", () => {
	it("renders empty state for new chat", async () => {
		const { ChatForm } = await import("@/features/chat/components/chat-form");
		render(<ChatForm />);

		expect(screen.getByText("新しいチャット")).toBeInTheDocument();
		expect(screen.getByText("チャットを開始")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("AIに質問する")).toBeInTheDocument();
	});

	it("renders with initial messages and custom title", async () => {
		const { ChatForm } = await import("@/features/chat/components/chat-form");
		render(
			<ChatForm
				sessionId="session-1"
				title="Test Chat"
				initialMessages={[
					{ id: "msg-1", role: "user", content: "Hello" },
					{ id: "msg-2", role: "assistant", content: "Hi!" },
				]}
			/>,
		);

		expect(screen.getByText("Test Chat")).toBeInTheDocument();
		expect(screen.getByText("Hello")).toBeInTheDocument();
		expect(screen.getByText("Hi!")).toBeInTheDocument();
	});

	it("redirects to /chat/{sessionId} after new chat submission", async () => {
		const user = userEvent.setup();
		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "user-1" } } },
		});
		invokeMock.mockResolvedValueOnce({
			data: {
				sessionId: "new-session-1",
				message: "Response",
				assistantMessageId: "msg-2",
				userMessageId: "msg-1",
			},
			error: null,
		});

		const { ChatForm } = await import("@/features/chat/components/chat-form");
		render(<ChatForm />);

		const textarea = screen.getByPlaceholderText("AIに質問する");
		await user.type(textarea, "Hello AI");
		await user.click(screen.getByRole("button", { name: "送信" }));

		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith("/chat/new-session-1");
		});
	});

	it("appends messages for existing chat", async () => {
		const user = userEvent.setup();
		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "user-1" } } },
		});
		invokeMock.mockResolvedValueOnce({
			data: {
				sessionId: "session-1",
				message: "Assistant reply",
				assistantMessageId: "msg-new",
				userMessageId: "msg-user",
			},
			error: null,
		});

		const { ChatForm } = await import("@/features/chat/components/chat-form");
		render(
			<ChatForm
				sessionId="session-1"
				initialMessages={[{ id: "msg-1", role: "user", content: "Previous" }]}
			/>,
		);

		const textarea = screen.getByPlaceholderText("AIに質問する");
		await user.type(textarea, "New message");
		await user.click(screen.getByRole("button", { name: "送信" }));

		await waitFor(() => {
			expect(screen.getByText("New message")).toBeInTheDocument();
			expect(screen.getByText("Assistant reply")).toBeInTheDocument();
		});

		expect(pushMock).not.toHaveBeenCalled();
	});

	it("displays error message on submission failure", async () => {
		const user = userEvent.setup();
		getSessionMock.mockResolvedValueOnce({
			data: { session: { user: { id: "user-1" } } },
		});
		invokeMock.mockResolvedValueOnce({
			data: null,
			error: {
				context: new Response(
					JSON.stringify({ error: "insufficient_credits" }),
				),
			},
		});

		const { ChatForm } = await import("@/features/chat/components/chat-form");
		render(<ChatForm sessionId="session-1" />);

		const textarea = screen.getByPlaceholderText("AIに質問する");
		await user.type(textarea, "Test");
		await user.click(screen.getByRole("button", { name: "送信" }));

		await waitFor(() => {
			expect(
				screen.getByText(
					"クレジットが不足しています。プランを確認してください。",
				),
			).toBeInTheDocument();
		});
	});

	it("shows not authenticated error when no session", async () => {
		const user = userEvent.setup();
		getSessionMock.mockResolvedValueOnce({
			data: { session: null },
		});

		const { ChatForm } = await import("@/features/chat/components/chat-form");
		render(<ChatForm sessionId="session-1" />);

		const textarea = screen.getByPlaceholderText("AIに質問する");
		await user.type(textarea, "Test");
		await user.click(screen.getByRole("button", { name: "送信" }));

		await waitFor(() => {
			expect(
				screen.getByText("ログイン後にチャットを利用できます。"),
			).toBeInTheDocument();
		});
	});

	it("does not submit when input is empty", async () => {
		const user = userEvent.setup();
		const { ChatForm } = await import("@/features/chat/components/chat-form");
		render(<ChatForm sessionId="session-1" />);

		const button = screen.getByRole("button", { name: "送信" });
		expect(button).toBeDisabled();

		await user.click(button);
		expect(invokeMock).not.toHaveBeenCalled();
	});
});
