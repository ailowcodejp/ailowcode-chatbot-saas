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
			</section>
		</main>
	);
}
