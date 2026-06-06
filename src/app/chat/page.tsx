import Link from "next/link";

import { routes } from "@/config/routes";
import { ChatForm } from "@/features/chat/components/chat-form";

function PlusIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-4"
			aria-hidden="true"
		>
			<path d="M12 5v14" />
			<path d="M5 12h14" />
		</svg>
	);
}

export const dynamic = "force-dynamic";

export default function ChatPage() {
	return (
		<>
			<header className="border-b border-[#eaecf0] px-4 py-5 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<div className="flex items-center gap-2 text-sm font-medium text-[#667085]">
							<span>Dashboard</span>
							<span className="text-[#d0d5dd]">/</span>
							<span className="rounded-md bg-[#f2f4f7] px-2 py-1 text-[#344054]">
								AI Chat
							</span>
						</div>
						<h1 className="mt-4 text-3xl leading-[38px] font-semibold text-[#101828]">
							AI チャット
						</h1>
						<p className="mt-1 text-base text-[#667085]">
							LLM Gateway と接続して、教材作成やSaaS運用の相談を進められます。
						</p>
					</div>
					<div className="flex items-center gap-3">
						<Link
							href={routes.billing}
							className="inline-flex h-10 items-center justify-center rounded-lg border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#344054] shadow-sm hover:bg-[#f9fafb]"
						>
							課金管理
						</Link>
						<Link
							href={routes.chat}
							className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#7f56d9] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#6941c6]"
						>
							<PlusIcon />
							新規チャット
						</Link>
					</div>
				</div>
			</header>

			<section className="flex min-h-0 flex-1 bg-[#f9fafb] p-4 sm:p-6 lg:p-8">
				<ChatForm />
			</section>
		</>
	);
}
