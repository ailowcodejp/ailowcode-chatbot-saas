# Cloudflare Workers + Next.jsのミドルウェア問題

## 結論

Cloudflare Workers + Next.js で今回見るべき論点は、次の2つです。

1. **middleware / proxy は Edge Runtime 前提で書く**
   - Node.js API を使わない
   - `fs`, `net`, `tls`, `crypto` Node module, Prisma Client 直叩きなどを避ける
   - `NextRequest`, `NextResponse`, Web API ベースで書く

2. **ページや Route Handler の動的レンダリングは `runtime = "edge"` ではなく、Next.js の dynamic / cache 設定で制御する**
   - `@opennextjs/cloudflare` では、現行ドキュメント上 `export const runtime = "edge"` は削除するよう案内されています
   - Cloudflare Workers 上で動くからといって、Next.js 側の各 Page / Route Handler を Edge Runtime 指定にするのは別問題です

---

## 重要な一次情報

### 1. Cloudflare Workers + OpenNext の基本設定

Cloudflare 公式では、Next.js を Workers に載せる場合、`@opennextjs/cloudflare` を使い、`nodejs_compat` と `compatibility_date` を設定する必要があるとしています。Cloudflare 公式 docs では、`nodejs_compat` を有効化し、`compatibility_date` を `2024-09-23` 以降にする必要があると明記されています。([Cloudflare Docs][1])

```jsonc
{
	"main": ".open-next/worker.js",
	"name": "my-app",
	"compatibility_date": "2024-12-30",
	"compatibility_flags": ["nodejs_compat"],
	"assets": {
		"directory": ".open-next/assets",
		"binding": "ASSETS",
	},
}
```

加えて、OpenNext 側は `wrangler` を直接叩くのではなく、原則 `opennextjs-cloudflare` CLI を使うべきとしています。([opennext.js.org][2])

---

## 2. `export const runtime = "edge"` は基本的に削除

ここが今回の一番重要な点です。

OpenNext Cloudflare の現行 Get Started では、既存 Next.js アプリを Workers に移行する際、**ソース内に `export const runtime = "edge"` があれば削除する**と書かれています。理由は、`@opennextjs/cloudflare` では Edge Runtime がまだサポートされていないためです。([opennext.js.org][3])

つまり、Workers にデプロイするからといって、以下を安易に書かない方がよいです。

```ts
export const runtime = "edge";
```

特に `app/**/page.tsx` や `app/**/route.ts` に書いている場合は、Cloudflare Workers 対応ではむしろ事故要因になります。

---

## 3. middleware は Edge Runtime 制約で書く

Next.js の middleware は、リクエスト完了前に実行され、rewrite / redirect / header 操作 / response 返却などに使われます。([Next.js][4])

ただし、Next.js の Edge Runtime は Node.js Runtime より使える API が少なく、すべての Node.js API をサポートしません。Next.js 公式は、Edge Runtime では一部パッケージが期待通り動かない可能性があり、ISR もサポートしないと説明しています。([Next.js][5])

そのため middleware では次を避けるべきです。

```ts
// NG: middleware で避ける
import fs from "node:fs";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
```

代わりに Web API ベースで書きます。

```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	if (pathname.startsWith("/admin")) {
		const session = request.cookies.get("session")?.value;

		if (!session) {
			const loginUrl = new URL("/login", request.url);
			return NextResponse.redirect(loginUrl);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*"],
};
```

Node.js API を使って Edge Runtime エラーが出る場合、Next.js 公式は「Node.js module を使わない、または Web Crypto API などに置き換える」と案内しています。([Next.js][6])

---

## 4. 動的レンダリングは `dynamic` / `revalidate` / `fetchCache` で制御する

Cloudflare Workers 対応で「動的レンダリングしたい」場合、`runtime = "edge"` ではなく、Next.js の Route Segment Config を使うのが本筋です。

Next.js の Route Segment Config では、`page.tsx`, `layout.tsx`, `route.ts` から `dynamic`, `runtime`, `preferredRegion`, `maxDuration` などを export して挙動を制御できます。([Next.js][7])

動的レンダリングを強制するなら、基本はこれです。

```ts
// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // ユーザーごと・リクエストごとに変わる処理
  return <div>Dashboard</div>;
}
```

Next.js 公式では、`dynamic = "force-dynamic"` は各リクエスト時にレンダリングされ、すべての `fetch()` を実質 `no-store` / `revalidate: 0` 相当にする設定だと説明されています。([Next.js][8])

---

## 5. fetch 単位で動的にする場合

ページ全体ではなく、特定の fetch だけキャッシュさせたくない場合は、`cache: "no-store"` を使います。

```ts
export default async function Page() {
  const res = await fetch("https://api.example.com/me", {
    cache: "no-store",
  });

  const data = await res.json();

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

また、旧キャッシュモデルでは `revalidate = 0` により、Request-time API や uncached fetch がなくても常に動的レンダリングにできます。ただし、Next.js 公式は `revalidate` の値は `runtime = "edge"` では利用できないと明記しています。([Next.js][8])

```ts
// app/account/page.tsx
export const revalidate = 0;

export default async function AccountPage() {
  return <div>Account</div>;
}
```

Cloudflare Workers + OpenNext 前提なら、まずは次のどちらかが無難です。

```ts
export const dynamic = "force-dynamic";
```

または

```ts
export const fetchCache = "force-no-store";
```

---

## 6. 推奨設計

### middleware でやること

middleware は軽量な処理に限定します。

- 認証 cookie の有無確認
- ログインページへの redirect
- locale / tenant / pathname の rewrite
- セキュリティヘッダー付与
- bot / preview / maintenance 判定

### middleware でやらない方がいいこと

- DB クエリ
- Prisma / Drizzle の直接実行
- Supabase service role を使った重い検証
- 外部 API への多段リクエスト
- 画像処理
- ファイルシステム操作
- Node.js 専用ライブラリ依存

特にスクール教材としては、middleware は「軽いゲートキーパー」に限定した方が安全です。

---

## 7. Next.js + Supabase + Cloudflare Workers の実用パターン

### middleware

```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/admin", "/settings"];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isProtected = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);

	if (!isProtected) {
		return NextResponse.next();
	}

	const accessToken = request.cookies.get("sb-access-token")?.value;

	if (!accessToken) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("redirectTo", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/admin/:path*", "/settings/:path*"],
};
```

### 動的ページ

```ts
// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
    </main>
  );
}
```

### Route Handler

```ts
// app/api/profile/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	return NextResponse.json({
		ok: true,
	});
}
```

---

## 参考文献リスト

| 用途                                              | 参照先                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Cloudflare Workers に Next.js を載せる公式手順    | Cloudflare Workers Next.js guide ([Cloudflare Docs][1])              |
| OpenNext Cloudflare の移行手順                    | OpenNext Cloudflare Get Started ([opennext.js.org][3])               |
| `runtime = "edge"` を削除すべき理由               | OpenNext Cloudflare Get Started ([opennext.js.org][3])               |
| Edge Runtime の制約                               | Next.js Edge Runtime docs ([Next.js][5])                             |
| Node.js module を Edge Runtime で使った時のエラー | Next.js error docs ([Next.js][6])                                    |
| 動的レンダリング・キャッシュ制御                  | Next.js Caching and Revalidating docs ([Next.js][8])                 |
| middleware の役割                                 | Next.js Middleware docs ([Next.js][4])                               |
| Workers の Node.js compatibility                  | Cloudflare Workers Node.js compatibility docs ([Cloudflare Docs][9]) |

## まとめ

Cloudflare Workers 対応では、次の整理が一番安全です。

```ts
// middleware.ts
// Edge Runtime 制約で軽く書く
```

```ts
// app/**/page.tsx or route.ts
export const dynamic = "force-dynamic";
// runtime = "edge" は原則書かない
```

つまり、**middleware は Edge Runtime 的に書くが、ページや Route Handler を `runtime = "edge"` にしない**、という切り分けです。OpenNext Cloudflare の現在の推奨にもこの方針が合います。

[1]: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ "Next.js · Cloudflare Workers docs"
[2]: https://opennext.js.org/cloudflare/cli "CLI - OpenNext"
[3]: https://opennext.js.org/cloudflare/get-started "Get Started - OpenNext"
[4]: https://nextjs.org/docs/15/pages/api-reference/file-conventions/middleware "File-system conventions: Middleware | Next.js"
[5]: https://nextjs.org/docs/app/api-reference/edge "API Reference: Edge Runtime | Next.js"
[6]: https://nextjs.org/docs/messages/node-module-in-edge-runtime "Using Node.js Modules in Edge Runtime | Next.js"
[7]: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config "File-system conventions: Route Segment Config | Next.js"
[8]: https://nextjs.org/docs/app/guides/caching-without-cache-components "Guides: Caching (Previous Model) | Next.js"
[9]: https://developers.cloudflare.com/workers/runtime-apis/nodejs/ "Node.js compatibility · Cloudflare Workers docs"
