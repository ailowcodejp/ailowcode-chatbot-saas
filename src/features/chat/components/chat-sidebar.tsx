"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { getChatSessions } from "@/features/chat/actions";
import type { ChatSession } from "@/features/chat/actions";

function Icon({
	children,
	className,
}: Readonly<{
	children: React.ReactNode;
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

function PlusIcon({ className }: Readonly<{ className?: string }>) {
	return (
		<Icon className={className}>
			<path d="M12 5v14" />
			<path d="M5 12h14" />
		</Icon>
	);
}

function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMinutes = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMinutes < 1) return "たった今";
	if (diffMinutes < 60) return `${diffMinutes}分前`;
	if (diffHours < 24) return `${diffHours}時間前`;
	if (diffDays === 1) return "昨日";
	if (diffDays < 7) return `${diffDays}日前`;

	return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

export function ChatSidebar() {
	const [sessions, setSessions] = useState<ChatSession[]>([]);
	const pathname = usePathname();

	useEffect(() => {
		let cancelled = false;

		async function fetchSessions() {
			const data = await getChatSessions();
			if (!cancelled) {
				setSessions(data);
			}
		}

		fetchSessions();

		return () => {
			cancelled = true;
		};
	}, []);

	const currentSessionId = pathname.startsWith("/chat/")
		? pathname.replace("/chat/", "")
		: null;

	return (
		<aside className="hidden w-[320px] shrink-0 border-r border-[#eaecf0] bg-white px-5 py-6 lg:flex lg:flex-col">
			<div className="flex items-center gap-3">
				<div className="flex size-9 items-center justify-center rounded-lg border border-[#d6bbfb] bg-[#f4ebff] text-sm font-semibold text-[#7f56d9] shadow-sm">
					AI
				</div>
				<div>
					<p className="text-base font-semibold text-[#101828]">AI LowCode</p>
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
						<p className="text-xs font-semibold text-[#667085]">チャット履歴</p>
						<Link
							href="/chat"
							className="inline-flex size-8 items-center justify-center rounded-lg border border-[#d0d5dd] bg-white text-[#344054] shadow-sm hover:bg-[#f9fafb]"
							aria-label="新しいチャット"
						>
							<PlusIcon className="size-4" />
						</Link>
					</div>
					<div className="space-y-1">
						{sessions.length === 0 ? (
							<p className="px-3 py-2 text-sm text-[#667085]">
								履歴がありません
							</p>
						) : (
							sessions.map((session) => {
								const isActive = session.id === currentSessionId;
								return (
									<Link
										key={session.id}
										href={`/chat/${session.id}`}
										className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
											isActive
												? "bg-[#f2f4f7] text-[#101828]"
												: "text-[#344054] hover:bg-[#f9fafb]"
										}`}
									>
										<MessageIcon
											className={`mt-0.5 size-5 shrink-0 ${
												isActive ? "text-[#7f56d9]" : "text-[#667085]"
											}`}
										/>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-semibold">
												{session.title}
											</span>
											<span className="mt-0.5 block text-xs font-medium text-[#667085]">
												{formatRelativeTime(session.updated_at)}
											</span>
										</span>
									</Link>
								);
							})
						)}
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
				<LogoutButton />
			</div>

			<div className="mt-5 flex items-center gap-3 border-t border-[#eaecf0] pt-5">
				<div className="flex size-10 items-center justify-center rounded-full bg-[#f2f4f7] text-sm font-semibold text-[#667085]">
					AL
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-[#344054]">
						学習者アカウント
					</p>
					<p className="truncate text-sm text-[#667085]">student@example.com</p>
				</div>
			</div>
		</aside>
	);
}
