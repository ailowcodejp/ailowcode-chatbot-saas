import Link from "next/link";

import { BillingPanel } from "@/features/billing/components/billing-panel";

export const dynamic = "force-dynamic";

export default function BillingPage() {
	return (
		<main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6">
			<div className="mx-auto max-w-5xl">
				<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm font-medium text-zinc-500">
							ailowcode-chatbot-saas
						</p>
						<h1 className="mt-2 text-3xl font-semibold">課金管理</h1>
					</div>
					<Link
						href="/chat"
						className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium"
					>
						チャットへ戻る
					</Link>
				</div>
				<BillingPanel />
			</div>
		</main>
	);
}
