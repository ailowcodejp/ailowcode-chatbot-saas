import { ChatForm } from "@/features/chat/components/chat-form";

export default function ChatPage() {
	return (
		<main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6">
			<div className="mx-auto max-w-4xl">
				<div className="mb-6">
					<p className="text-sm font-medium text-zinc-500">
						ailowcode-chatbot-saas
					</p>
					<h1 className="mt-2 text-3xl font-semibold">LLM Gateway チャット</h1>
				</div>
				<ChatForm />
			</div>
		</main>
	);
}
