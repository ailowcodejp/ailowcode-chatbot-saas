import Link from "next/link";
import type { ReactNode } from "react";

import { signOut } from "@/features/auth/actions";
import { ChatForm } from "@/features/chat/components/chat-form";

const chatHistories = [
	{ title: "教材のLP構成案", time: "2分前", active: true },
	{ title: "Supabase RLSの確認", time: "昨日", active: false },
	{ title: "Stripe決済導線の文案", time: "5月14日", active: false },
	{ title: "Cloudflareデプロイ手順", time: "5月12日", active: false },
];

function Icon({
	children,
	className,
}: Readonly<{
	children: ReactNode;
	className?: string;
}>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			{children}
		</svg>
	);
}

function MessageIcon({ className }: Readonly<{ className?: string }>) {
	return (
		<Icon className={className}>
			<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
		</Icon>
	);
}

function SearchIcon({ className }: Readonly<{ className?: string }>) {
	return (
		<Icon className={className}>
			<circle cx="11" cy="11" r="7" />
			<path d="m20 20-3.5-3.5" />
		</Icon>
	);
}

function SettingsIcon({ className }: Readonly<{ className?: string }>) {
	return (
		<Icon className={className}>
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.39 1.09V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.09-.39H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .39-1.09V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.38.36.72.6 1 .3.25.68.39 1.09.39H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" />
		</Icon>
	);
}

function LogoutIcon({ className }: Readonly<{ className?: string }>) {
	return (
		<Icon className={className}>
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
			<path d="M16 17l5-5-5-5" />
			<path d="M21 12H9" />
		</Icon>
	);
}

function PlusIcon({ className }: Readonly<{ className?: string }>) {
	return (
		<Icon className={className}>
			<path d="M12 5v14" />
			<path d="M5 12h14" />
		</Icon>
	);
}

export default function ChatPage() {
	return (
		<div className="min-h-screen bg-white text-[#101828]">
			<div className="flex min-h-screen">
				<aside className="hidden w-[320px] shrink-0 border-r border-[#eaecf0] bg-white px-5 py-6 lg:flex lg:flex-col">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-lg border border-[#d6bbfb] bg-[#f4ebff] text-sm font-semibold text-[#7f56d9] shadow-sm">
							AI
						</div>
						<div>
							<p className="text-base font-semibold text-[#101828]">
								AI LowCode
							</p>
							<p className="text-xs font-medium text-[#667085]">Chatbot SaaS</p>
						</div>
					</div>

					<label className="relative mt-6 block">
						<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[#667085]" />
						<input
							type="search"
							placeholder="チャットを検索"
							className="h-11 w-full rounded-lg border border-[#d0d5dd] bg-white pr-3 pl-10 text-sm text-[#101828] outline-none placeholder:text-[#667085] focus:border-[#7f56d9] focus:ring-4 focus:ring-[#f4ebff]"
						/>
					</label>

					<nav className="mt-6 flex-1 space-y-7">
						<section>
							<div className="mb-3 flex items-center justify-between">
								<p className="text-xs font-semibold text-[#667085]">
									チャット履歴
								</p>
								<button
									type="button"
									className="inline-flex size-8 items-center justify-center rounded-lg border border-[#d0d5dd] bg-white text-[#344054] shadow-sm hover:bg-[#f9fafb]"
									aria-label="新しいチャット"
								>
									<PlusIcon className="size-4" />
								</button>
							</div>
							<div className="space-y-1">
								{chatHistories.map((history) => (
									<button
										key={history.title}
										type="button"
										className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
											history.active
												? "bg-[#f2f4f7] text-[#101828]"
												: "text-[#344054] hover:bg-[#f9fafb]"
										}`}
									>
										<MessageIcon
											className={`mt-0.5 size-5 shrink-0 ${
												history.active ? "text-[#7f56d9]" : "text-[#667085]"
											}`}
										/>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-semibold">
												{history.title}
											</span>
											<span className="mt-0.5 block text-xs font-medium text-[#667085]">
												{history.time}
											</span>
										</span>
									</button>
								))}
							</div>
						</section>
					</nav>

					<div className="space-y-1 border-t border-[#eaecf0] pt-5">
						<Link
							href="/billing"
							className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#344054] hover:bg-[#f9fafb]"
						>
							<SettingsIcon className="size-5 text-[#667085]" />
							設定
						</Link>
						<form action={signOut}>
							<button
								type="submit"
								className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#344054] hover:bg-[#f9fafb]"
							>
								<LogoutIcon className="size-5 text-[#667085]" />
								ログアウト
							</button>
						</form>
					</div>

					<div className="mt-5 flex items-center gap-3 border-t border-[#eaecf0] pt-5">
						<div className="flex size-10 items-center justify-center rounded-full bg-[#f2f4f7] text-sm font-semibold text-[#667085]">
							AL
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold text-[#344054]">
								学習者アカウント
							</p>
							<p className="truncate text-sm text-[#667085]">
								student@example.com
							</p>
						</div>
					</div>
				</aside>

				<main className="flex min-w-0 flex-1 flex-col bg-white">
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
									LLM Gateway
									と接続して、教材作成やSaaS運用の相談を進められます。
								</p>
							</div>
							<div className="flex items-center gap-3">
								<Link
									href="/billing"
									className="inline-flex h-10 items-center justify-center rounded-lg border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#344054] shadow-sm hover:bg-[#f9fafb]"
								>
									課金管理
								</Link>
								<button
									type="button"
									className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#7f56d9] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#6941c6]"
								>
									<PlusIcon className="size-4" />
									新規チャット
								</button>
							</div>
						</div>
					</header>

					<section className="flex min-h-0 flex-1 bg-[#f9fafb] p-4 sm:p-6 lg:p-8">
						<ChatForm />
					</section>
				</main>
			</div>
		</div>
	);
}
