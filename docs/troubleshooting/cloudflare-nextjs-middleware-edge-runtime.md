# Cloudflare Workers + Next.js ミドルウェア実装ガイド

## 概要

本プロジェクトでは Next.js 16 + `@opennextjs/cloudflare` + Supabase SSR Auth を前提としています。
この構成で認証・保護ルートを実装する際、middleware の書き方とページの動的レンダリング設定に落とし穴があります。

このドキュメントは、実装・テスト・ビルドの各段階で発生した問題とその解決策を記録したものです。

---

## 1. 前提知識：2つの runtime を区別する

| 対象                    | 考慮すべき runtime | ポイント                      |
| ----------------------- | ------------------ | ----------------------------- |
| `middleware.ts`         | Edge Runtime       | Node.js API を使えない        |
| `page.tsx` / `route.ts` | Node.js Runtime    | `runtime = "edge"` は書かない |

**Cloudflare Workers にデプロイするからといって、ページ側を Edge Runtime にする必要はありません。**
`@opennextjs/cloudflare` では `runtime = "edge"` をサポートしていないため、むしろビルドエラーの原因になります。

---

## 2. middleware の実装

### 2.1 実際のコード

```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/chat", "/billing"];

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
	matcher: ["/chat/:path*", "/billing/:path*"],
};
```

### 2.2 設計意図

- **Cookie の存在確認のみ行う** — Supabase SSR は `sb-access-token` という名前の cookie を発行します。middleware では存在確認だけで、トークンの検証（DB アクセスや JWT 検証）は行いません。
- **redirect には `URL` コンストラクタを使う** — `request.url` を基にして正しいオリジンを維持します。
- **`NextRequest`, `NextResponse` のみ使用** — Node.js モジュールを一切使いません。

### 2.3 middleware でやること・やらないこと

| ✅ やること              | ❌ やらないこと                |
| ------------------------ | ------------------------------ |
| Cookie の有無確認        | DB クエリ・Prisma 実行         |
| リダイレクト・rewrite    | Supabase service role での検証 |
| pathname ベースの分岐    | 外部 API への多段リクエスト    |
| セキュリティヘッダー付与 | ファイルシステム操作           |

---

## 3. 保護対象ページの設定

保護対象ページは `dynamic = "force-dynamic"` を export して動的レンダリングを強制します。

```tsx
// app/chat/page.tsx
export const dynamic = "force-dynamic";

export default function ChatPage() {
	return <main>{/* ... */}</main>;
}
```

### なぜ `runtime = "edge"` ではないのか

`@opennextjs/cloudflare` の現行バージョンでは `runtime = "edge"` はサポートされていません。
ページを Edge Runtime に指定するとビルド時にエラーが出る、または Cloudflare Workers 上で予期しない動作をする可能性があります。

代わりに `dynamic = "force-dynamic"` を使うことで、Node.js Runtime のままリクエストごとにレンダリングされ、認証状態に応じた動的なレスポンスが得られます。

---

## 4. テスト

### 4.1 middleware のテスト

Vitest + `next/server` の `NextRequest` を使ってテストします。

```ts
// tests/middleware/middleware.test.ts
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../middleware";

describe("middleware", () => {
	it("allows public routes", () => {
		const request = new NextRequest(new URL("http://localhost:3000/"));
		const response = middleware(request);
		expect(response.status).toBe(200);
	});

	it("redirects unauthenticated users from protected routes", () => {
		const request = new NextRequest(new URL("http://localhost:3000/chat"));
		const response = middleware(request);
		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe(
			"http://localhost:3000/login?redirectTo=%2Fchat",
		);
	});

	it("allows authenticated users to protected routes", () => {
		const request = new NextRequest(new URL("http://localhost:3000/chat"), {
			headers: {
				cookie: "sb-access-token=valid-token",
			},
		});
		const response = middleware(request);
		expect(response.status).toBe(200);
	});
});
```

### 4.2 パスエイリアスの注意点

middleware.ts はプロジェクトルートに配置されるため、`@/middleware` というエイリアスでは解決できません。
テストからは相対パスでインポートしてください。

```ts
// ✅ 正しい
import { middleware } from "../../middleware";

// ❌ エラーになる
import { middleware } from "@/middleware";
```

`vitest.config.ts` の `resolve.alias` で `@` を `src` に向けている場合、ルートの `middleware.ts` は含まれないため相対パスが必要です。

---

## 5. ログイン・サインアップの実装パターン

### 5.1 Server Actions

```ts
// src/features/auth/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/features/auth/validations";

export async function login(formData: FormData) {
	const data = Object.fromEntries(formData);
	const parsed = loginSchema.safeParse(data);

	if (!parsed.success) {
		return { error: "メールアドレスまたはパスワードの形式が正しくありません" };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email: parsed.data.email,
		password: parsed.data.password,
	});

	if (error) {
		return { error: error.message };
	}

	revalidatePath("/", "layout");
	redirect("/");
}
```

### 5.2 クライアントフォーム

```tsx
// src/features/auth/components/login-form.tsx
"use client";

import { useState } from "react";
import { login } from "@/features/auth/actions";

export function LoginForm() {
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(formData: FormData) {
		setError(null);
		const result = await login(formData);
		if (result?.error) {
			setError(result.error);
		}
	}

	return <form action={handleSubmit}>{/* ... */}</form>;
}
```

### 5.3 ページ

```tsx
// src/app/login/page.tsx
import { LoginForm } from "@/features/auth/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
	return (
		<main>
			<LoginForm />
		</main>
	);
}
```

---

## 6. 発生した問題と解決策

### 問題1: `@/middleware` の解決失敗

**現象**: `vitest run` で `Failed to resolve import "@/middleware"` エラー

**原因**: `middleware.ts` は `src/` 外のルートに配置されているため、`@` エイリアスが解決できない

**解決**: テストから相対パス `../../middleware` でインポート

### 問題2: ESLint の `consistent-type-imports` エラー

**現象**: `import { NextRequest } from "next/server"` で `NextRequest are only used as type` エラー

**原因**: `NextRequest` は型としてのみ使用されるが、value import になっている

**解決**: `pnpm run lint:fix` で自動修正。Vitest のテストファイルでは `NextRequest` が値としても使われるため、通常は value import で問題ありませんが、middleware.ts では型のみの参照になるケースで警告が出ることがあります。

### 問題3: `runtime = "edge"` によるビルド警告

**現象**: `⚠ Using edge runtime on a page currently disables static generation for that page`

**原因**: 既存コードや他のページで `runtime = "edge"` が残っていた

**解決**: ページ・Route Handler から `export const runtime = "edge"` を削除し、`dynamic = "force-dynamic"` に置き換え

---

## 7. チェックリスト

middleware・認証機能を実装・変更する際は、以下を確認してください。

- [ ] `middleware.ts` で Node.js API（`fs`, `crypto`, `net` など）を使っていない
- [ ] `middleware.ts` で DB クエリや Prisma を直接実行していない
- [ ] 保護対象ページが `export const dynamic = "force-dynamic"` を持っている
- [ ] ページ・Route Handler に `export const runtime = "edge"` がない
- [ ] `pnpm run lint` が通る
- [ ] `pnpm run test` が通る
- [ ] `pnpm run build` が通る
- [ ] `pnpm exec opennextjs-cloudflare build` が通る

---

## 参考文献

| 用途                                  | 参照先               |
| ------------------------------------- | -------------------- |
| Cloudflare Workers + Next.js 公式手順 | [Cloudflare Docs][1] |
| OpenNext Cloudflare 移行ガイド        | [opennext.js.org][2] |
| `runtime = "edge"` 削除の理由         | [opennext.js.org][3] |
| Edge Runtime 制約                     | [Next.js][4]         |
| middleware の役割                     | [Next.js][5]         |
| Route Segment Config                  | [Next.js][6]         |

[1]: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
[2]: https://opennext.js.org/cloudflare/get-started
[3]: https://opennext.js.org/cloudflare/get-started
[4]: https://nextjs.org/docs/app/api-reference/edge
[5]: https://nextjs.org/docs/15/pages/api-reference/file-conventions/middleware
[6]: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
