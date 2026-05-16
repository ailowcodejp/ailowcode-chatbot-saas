# Supabase SSR クライアントセットアップガイド

本プロジェクト（ailowcode-chatbot-saas）における Supabase SSR クライアントのセットアップ手順を解説します。

---

## 対象

- Next.js 16（App Router）+ React 19
- Supabase（PostgreSQL, SSR Auth）
- Cloudflare Workers デプロイ（OpenNext.js）

---

## 前提

本プロジェクトでは以下のパッケージが既にインストールされています。

| パッケージ              | バージョン |
| ----------------------- | ---------- |
| `@supabase/supabase-js` | ^2.105.4   |
| `@supabase/ssr`         | ^0.10.3    |

再インストールは不要です。依存関係が不足している場合は以下を実行してください。

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

---

## 環境変数

### 必要な環境変数一覧

| 変数名                                 | 必須 | 用途                                                     |
| -------------------------------------- | ---- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | ✅   | Supabase プロジェクトの URL                              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅   | クライアントサイド用 publishable キー                    |
| `SUPABASE_SERVICE_ROLE_KEY`            | ✅   | サーバーサイド用 service role キー（管理者クライアント） |

### 設定場所

- **ローカル開発**: `.env.local` に記述
- **Cloudflare Workers**: Cloudflare Dashboard の Environment Variables に登録
- **CI/CD**: GitHub Actions Secrets に登録

### 環境変数バリデーション

本プロジェクトでは環境変数のバリデーションを専用の設定モジュールで行っています。

| ファイル                   | 役割                                                             |
| -------------------------- | ---------------------------------------------------------------- |
| `src/config/env.client.ts` | クライアント公開変数（`NEXT_PUBLIC_*`）のバリデーション          |
| `src/config/env.server.ts` | サーバー変数（`SUPABASE_SERVICE_ROLE_KEY` など）のバリデーション |

不足している変数があるとアプリケーション起動時にエラーが発生します。

### Supabase API キーについて（重要）

Supabase は API キーの仕様を変更しており、**新しい publishable キー（`sb_publishable_xxx`）と secret キー（`sb_secret_xxx`）の使用を推奨**しています。従来の `anon` / `service_role` キーは 2026 年末まで利用可能ですが、新規プロジェクトでは新しいキー形式を使用してください。

キーの取得先:

1. Supabase Dashboard > **Connect** ダイアログ
2. Supabase Dashboard > **Settings > API Keys** セクション

---

## クライアントの種類と使い分け

本プロジェクトでは **3種類** の Supabase クライアントを用途に応じて使い分けます。

| クライアント   | ファイル                     | 実行環境                                                      | 用途                                         |
| -------------- | ---------------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Browser Client | `src/lib/supabase/client.ts` | ブラウザ（Client Components）                                 | リアルタイム購読、クライアント側のデータ取得 |
| Server Client  | `src/lib/supabase/server.ts` | サーバー（Server Components, Server Actions, Route Handlers） | SSR でのデータ取得、認証セッション管理       |
| Admin Client   | `src/lib/supabase/admin.ts`  | サーバー専用                                                  | 管理者操作、サービスロール権限が必要な処理   |

### Browser Client

`"use client"` ディレクティブが必要なコンポーネント内で使用します。

```path/ailowcode-chatbot-saas/src/lib/supabase/client.ts#L1-14
"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/config/env.client";
import type { Database } from "@/types/database.types";

export function createClient() {
	const env = getClientEnv();

	return createBrowserClient<Database>(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	);
}
```

### Server Client

Server Components / Server Actions / Route Handlers 内で使用します。

`@supabase/ssr` の `createServerClient` を使用し、Next.js の `cookies()` API を介してクッキーベースの認証セッションを管理します。

```path/ailowcode-chatbot-saas/src/lib/supabase/server.ts#L1-32
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getClientEnv } from "@/config/env.client";
import type { Database } from "@/types/database.types";

export async function createClient() {
	const env = getClientEnv();
	const cookieStore = await cookies();

	return createServerClient<Database>(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options);
						}
					} catch {
						// Server Components cannot mutate cookies after rendering starts.
					}
				},
			},
		},
	);
}
```

> **`setAll` の `try/catch` について**: Server Components はレンダリング開始後にクッキーを変更できません。`try/catch` はそのエラーを握りつぶし、代わりに Middleware でのトークンリフレッシュに委ねるための安全策です。

### Admin Client（サービスロール）

管理者専用の処理（ユーザー管理、データパージ、バッチ処理など）で使用します。`SUPABASE_SERVICE_ROLE_KEY` を使用し、**RLS をバイパス**します。クライアントサイドでは絶対に使用しないでください。

```path/ailowcode-chatbot-saas/src/lib/supabase/admin.ts#L1-22
import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/config/env.server";
import type { Database } from "@/types/database.types";

export function createAdminClient() {
	const env = getServerEnv();

	return createClient<Database>(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.SUPABASE_SERVICE_ROLE_KEY,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		},
	);
}
```

---

## Middleware（Proxy）のセットアップ

Server Components はクッキーの書き込みができないため、認証トークンのリフレッシュは **Middleware** で行う必要があります。

現時点では本プロジェクトに Middleware は未実装です。以下を参考に実装してください。

### `src/middleware.ts`

```path/ailowcode-chatbot-saas/src/middleware.ts#L1-38
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					supabaseResponse = NextResponse.next({ request });
					for (const { name, value, options } of cookiesToSet) {
						supabaseResponse.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	// トークンのリフレッシュ（JWT 検証をトリガー）
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// 認証が必要なルートの保護（例）
	// if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
	//   const url = request.nextUrl.clone();
	//   url.pathname = "/login";
	//   return NextResponse.redirect(url);
	// }

	return supabaseResponse;
}

export const config = {
	matcher: [
		/*
		 * 以下のパスを除くすべてのリクエストに Middleware を適用:
		 * - _next/static（静的ファイル）
		 * - _next/image（画像最適化）
		 * - favicon.ico
		 * - 画像ファイル（svg, png, jpg, jpeg, gif, webp）
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
```

### Middleware 実装時の注意点

- **`supabase.auth.getUser()` を使用する**: `getSession()` は JWT を再検証しないため信頼できません。必ず `getUser()` を使ってトークンを検証してください。
- **クッキーの設定順序**: `request.cookies.set` でリクエストを更新してから、`supabaseResponse.cookies.set` でレスポンスに反映します。これにより Server Components とブラウザの両方に新しいトークンが渡ります。
- **matcher の調整**: Supabase を使用しないルート（静的ファイルなど）は matcher から除外し、不要な Middleware 実行を避けてください。

---

## Cloudflare Workers デプロイ時の考慮事項

本プロジェクトは Cloudflare Workers にデプロイされます（OpenNext.js + Wrangler）。

### 注意点

1. **ISR / CDN キャッシュと認証セッション**
   - Workers 環境で ISR を使用する場合、キャッシュされたレスポンスに別ユーザーの `Set-Cookie` が含まれるリスクがあります。
   - 認証情報を含むページは `cache-control: private` または `no-store` を設定してください。

2. **環境変数の管理**
   - `.dev.vars.example` を参考に、Cloudflare Dashboard で環境変数を設定してください。
   - `NEXT_PUBLIC_*` 変数はビルド時に埋め込まれるため、Workers の環境変数として設定します。

3. **Workers の制約**
   - Node.js API（`fs`、`path` など）は Workers では利用できません。
   - `server-only` パッケージのインポートはビルド時に解決されるため問題ありません。

---

## 使用例

### Server Component での使用

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const { data: profile } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", user?.id)
		.single();

	return <pre>{JSON.stringify(profile, null, 2)}</pre>;
}
```

### Server Action での使用

```ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("Unauthorized");
	}

	const { error } = await supabase
		.from("profiles")
		.update({ name: formData.get("name") })
		.eq("id", user.id);

	if (error) throw error;
}
```

### Client Component での使用（リアルタイム購読）

```tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function RealtimeMessages({ roomId }: { roomId: string }) {
	const supabase = createClient();

	useEffect(() => {
		const channel = supabase
			.channel(`room:${roomId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "messages",
					filter: `room_id=eq.${roomId}`,
				},
				(payload) => {
					console.log("New message:", payload.new);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [roomId]);

	return null;
}
```

---

## 参考リンク

- [Supabase SSR 公式ドキュメント](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Auth サーバーサイドレンダリングガイド（詳細）](https://supabase.com/docs/guides/auth/server-side/overview)
- [本プロジェクトの Supabase ソフトデリート設計ガイド](./soft-delete-design-guide.md)
- [本プロジェクトの環境構築ガイドライン](../setup/environment-setup-guide.md)
