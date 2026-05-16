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
		error.code === "insufficient_credits"
	) {
		return "クレジットが不足しています。プランを確認してください。";
	}

	if (error instanceof Error) {
		if (error.message.includes("insufficient_credits")) {
			return "クレジットが不足しています。プランを確認してください。";
		}

		if (error.message.includes("not_authenticated")) {
			return "ログイン後にチャットを利用できます。";
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
		<div className="flex min-h-[620px] flex-col border border-zinc-200 bg-white">
			<div className="border-b border-zinc-200 px-5 py-4">
				<h2 className="text-base font-semibold text-zinc-950">AI チャット</h2>
				<p className="mt-1 text-sm text-zinc-500">
					LLM Gateway 経由で返信を生成し、Supabase に履歴を保存します。
				</p>
			</div>

			<div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
				{messages.length === 0 ? (
					<div className="flex h-full items-center justify-center text-center text-sm text-zinc-500">
						メッセージを入力すると会話が開始されます。
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
								className={`max-w-[82%] rounded-md px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
									message.role === "user"
										? "bg-zinc-950 text-white"
										: "bg-zinc-100 text-zinc-950"
								}`}
							>
								{message.content}
							</div>
						</div>
					))
				)}
				{isSubmitting ? (
					<div className="text-sm text-zinc-500">返信を生成しています...</div>
				) : null}
			</div>

			<div className="border-t border-zinc-200 p-4">
				{errorMessage ? (
					<p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
						{errorMessage}
					</p>
				) : null}
				<form className="flex gap-3" onSubmit={handleSubmit}>
					<textarea
						value={input}
						onChange={(event) => setInput(event.target.value)}
						placeholder="AIに質問する"
						className="min-h-12 flex-1 resize-none rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-zinc-950"
						maxLength={4000}
						disabled={isSubmitting}
					/>
					<button
						type="submit"
						disabled={!input.trim() || isSubmitting}
						className="h-12 rounded-md bg-zinc-950 px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
					>
						送信
					</button>
				</form>
			</div>
		</div>
	);
}
