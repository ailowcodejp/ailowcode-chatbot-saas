"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

type ChatCompletionResponse = {
	sessionId: string;
	message: string;
	assistantMessageId: string;
	userMessageId: string;
};

function createLocalId() {
	return crypto.randomUUID();
}

function getErrorMessage(error: unknown): string {
	if (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof error.code === "string"
	) {
		switch (error.code) {
			case "insufficient_credits":
				return "クレジットが不足しています。プランを確認してください。";
			case "credit_error":
				return "クレジットの消費中にエラーが発生しました。再度お試しください。";
			case "llm_gateway_error":
				return "AIサービスとの通信に失敗しました。しばらく経ってから再度お試しください。";
			case "empty_llm_response":
				return "AIからの返信が空でした。もう一度お試しください。";
			case "internal_error":
				return "サーバー内部でエラーが発生しました。環境変数やSupabaseの状態を確認してください。";
			case "failed_to_save_user_message":
			case "failed_to_save_assistant_message":
			case "failed_to_create_chat_session":
			case "failed_to_load_chat_history":
				return "メッセージの保存中にエラーが発生しました。再度お試しください。";
			case "chat_session_not_found":
				return "チャットセッションが見つかりませんでした。ページをリロードしてください。";
		}
	}

	if (error instanceof Error) {
		if (error.message.includes("insufficient_credits")) {
			return "クレジットが不足しています。プランを確認してください。";
		}

		if (error.message.includes("not_authenticated")) {
			return "ログイン後にチャットを利用できます。";
		}

		if (
			error.message.includes("Failed to fetch") ||
			error.message.includes("NetworkError")
		) {
			return "サーバーに接続できません。Supabase が起動しているか確認してください。";
		}
	}

	return "AIからの返信を取得できませんでした。時間をおいて再度お試しください。";
}

async function getFunctionErrorCode(error: unknown): Promise<string | null> {
	if (
		typeof error !== "object" ||
		error === null ||
		!("context" in error) ||
		!(error.context instanceof Response)
	) {
		return null;
	}

	try {
		const body = (await error.context.clone().json()) as { error?: unknown };
		return typeof body.error === "string" ? body.error : null;
	} catch {
		return null;
	}
}

export function ChatForm() {
	const [input, setInput] = useState("");
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const message = input.trim();
		if (!message || isSubmitting) {
			return;
		}

		setErrorMessage(null);
		setInput("");
		setIsSubmitting(true);

		const optimisticUserMessage: ChatMessage = {
			id: createLocalId(),
			role: "user",
			content: message,
		};

		setMessages((current) => [...current, optimisticUserMessage]);

		try {
			const supabase = createClient();
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!session) {
				throw new Error("not_authenticated");
			}

			const { data, error } =
				await supabase.functions.invoke<ChatCompletionResponse>(
					"chat-completion",
					{
						body: {
							message,
							sessionId,
						},
					},
				);

			if (error) {
				throw {
					code: await getFunctionErrorCode(error),
					cause: error,
				};
			}

			if (!data) {
				throw new Error("empty_function_response");
			}

			setSessionId(data.sessionId);
			setMessages((current) => [
				...current.map((item) =>
					item.id === optimisticUserMessage.id
						? { ...item, id: data.userMessageId }
						: item,
				),
				{
					id: data.assistantMessageId,
					role: "assistant",
					content: data.message,
				},
			]);
		} catch (error) {
			setErrorMessage(getErrorMessage(error));
			setMessages((current) =>
				current.filter((item) => item.id !== optimisticUserMessage.id),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-[640px] w-full flex-col overflow-hidden rounded-xl border border-[#eaecf0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
			<div className="flex items-start justify-between gap-4 border-b border-[#eaecf0] px-5 py-4 sm:px-6">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-lg leading-7 font-semibold text-[#101828]">
							新しいチャット
						</h2>
						<span className="rounded-full border border-[#d0d5dd] bg-[#f2f4f7] px-2 py-0.5 text-xs font-medium text-[#344054]">
							{messages.length} messages
						</span>
					</div>
					<p className="mt-1 text-sm text-[#667085]">
						質問を入力すると、AI が回答を生成してチャット履歴に保存します。
					</p>
				</div>
				<div className="rounded-full border border-[#abefc6] bg-[#ecfdf3] px-2.5 py-1 text-xs font-medium text-[#027a48]">
					接続中
				</div>
			</div>

			<div className="flex-1 space-y-5 overflow-y-auto bg-white px-5 py-6 sm:px-6">
				{messages.length === 0 ? (
					<div className="flex h-full min-h-[360px] items-center justify-center">
						<div className="max-w-md text-center">
							<div className="mx-auto flex size-12 items-center justify-center rounded-full border border-[#d6bbfb] bg-[#f4ebff] text-base font-semibold text-[#7f56d9]">
								AI
							</div>
							<h3 className="mt-4 text-base font-semibold text-[#101828]">
								チャットを開始
							</h3>
							<p className="mt-2 text-sm leading-6 text-[#667085]">
								教材作成、要件整理、実装方針の相談などを入力してください。
							</p>
						</div>
					</div>
				) : (
					messages.map((message) => (
						<div
							key={message.id}
							className={`flex ${
								message.role === "user" ? "justify-end" : "justify-start"
							}`}
						>
							<div
								className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap shadow-sm ${
									message.role === "user"
										? "bg-[#7f56d9] text-white"
										: "border border-[#eaecf0] bg-[#f9fafb] text-[#344054]"
								}`}
							>
								{message.content}
							</div>
						</div>
					))
				)}
				{isSubmitting ? (
					<div className="flex justify-start">
						<div className="rounded-xl border border-[#eaecf0] bg-[#f9fafb] px-4 py-3 text-sm text-[#667085] shadow-sm">
							返信を生成しています...
						</div>
					</div>
				) : null}
			</div>

			<div className="border-t border-[#eaecf0] bg-white p-4 sm:p-5">
				{errorMessage ? (
					<p className="mb-3 rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]">
						{errorMessage}
					</p>
				) : null}
				<form
					className="flex flex-col gap-3 sm:flex-row"
					onSubmit={handleSubmit}
				>
					<textarea
						value={input}
						onChange={(event) => setInput(event.target.value)}
						placeholder="AIに質問する"
						className="min-h-12 flex-1 resize-none rounded-lg border border-[#d0d5dd] bg-white px-3.5 py-3 text-sm text-[#101828] outline-none placeholder:text-[#667085] focus:border-[#7f56d9] focus:ring-4 focus:ring-[#f4ebff]"
						maxLength={4000}
						disabled={isSubmitting}
					/>
					<button
						type="submit"
						disabled={!input.trim() || isSubmitting}
						className="h-12 rounded-lg bg-[#7f56d9] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#6941c6] disabled:cursor-not-allowed disabled:bg-[#d0d5dd]"
					>
						送信
					</button>
				</form>
			</div>
		</div>
	);
}
