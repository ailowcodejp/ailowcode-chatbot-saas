import type { ReactNode } from "react";

import { ChatSidebar } from "@/features/chat/components/chat-sidebar";

export const dynamic = "force-dynamic";

export default function ChatLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<div className="min-h-screen bg-white text-[#101828]">
			<div className="flex min-h-screen">
				<ChatSidebar />
				<main className="flex min-w-0 flex-1 flex-col bg-white">
					{children}
				</main>
			</div>
		</div>
	);
}
