import Link from "next/link";

export default function Home() {
	return (
		<main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-16">
			<section className="w-full max-w-3xl">
				<p className="text-sm font-medium uppercase">ailowcode-chatbot-saas</p>
				<h1 className="mt-4 text-4xl font-semibold">AIチャットボットSaaS</h1>
				<p className="text-foreground/70 mt-6 max-w-2xl text-base leading-7">
					Cloudflare Workers、Next.js、Supabase を前提にした初期構成です。
					機能実装は標準フォルダ構成に沿って追加します。
				</p>
				<Link
					href="/login"
					className="mt-8 inline-flex h-11 items-center rounded-md bg-[#7f56d9] px-5 text-sm font-semibold text-white hover:bg-[#6941c6]"
				>
					ログイン
				</Link>
				<Link
					href="/signup"
					className="mt-8 ml-3 inline-flex h-11 items-center rounded-md border border-[#d0d5dd] px-5 text-sm font-semibold text-[#344054]"
				>
					サインアップ
				</Link>
				<Link
					href="/chat"
					className="mt-8 ml-3 inline-flex h-11 items-center rounded-md border border-zinc-300 px-5 text-sm font-medium"
				>
					チャットを開く
				</Link>
			</section>
		</main>
	);
}
