# Next.js 2026 フォルダ構成ガイド

## 目的

本マニュアルは、Next.js App Router を使ったプロジェクトで、保守しやすく、拡張しやすく、チーム開発に耐えるフォルダ構成を定義するためのものです。

特に、以下の構成を前提にします。

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Cloudflare Workers
- OpenNext Cloudflare adapter
- Wrangler
- Supabase
- GitHub

`pnpm create cloudflare@latest . --framework=next` で作成される構成を出発点にし、Cloudflare Workers にそのまま載せやすく、将来的にSaaSとして拡張できる構成を目指します。

---

## まず守ること

新規プロジェクトでは、最初に以下を揃えます。

1. App Router は `src/app/` に置く
2. 業務機能は `src/features/` に置く
3. 共通UIだけを `src/components/` に置く
4. Supabase client は `src/lib/supabase/client.ts`、`server.ts`、`admin.ts` に分ける
5. `service_role` は `admin.ts` に閉じ込める
6. サーバー専用モジュールには `server-only` を入れる
7. Cloudflare binding は `src/lib/cloudflare/` 経由で扱う
8. 環境変数は `src/config/env.client.ts` / `env.server.ts` に集約する
9. DB変更は `supabase/migrations/` に残す
10. `pnpm run preview` で Workers runtime 上の確認を行う

小規模なWebサイトでは、`features/` や `supabase/` は必要になった時点で作成して構いません。ログイン、課金、マルチテナント、Webhook、DB変更を扱うSaaSでは、この標準構成を最初から採用します。

---

## 1. 基本方針

### 1.1 フォルダ構成の原則

Next.jsプロジェクトでは、以下の原則を守ります。

1. `app/` はルーティング中心にする
2. `components/` は共通UIに限定する
3. `features/` に業務機能をまとめる
4. `lib/` には汎用処理・外部クライアントを置く
5. Supabaseクライアントは `client / server / admin` に分離する
6. Route Handlers と Server Actions を混同しない
7. `service_role` は絶対にクライアント側に出さない
8. Server Actions でも認証・認可・入力検証を必ず行う
9. マルチテナントSaaSでは `organization_id` を設計の中心に置く
10. サーバー専用コードには `server-only` を使う
11. Cloudflare Workers の設定はルート直下の `wrangler.jsonc` と `open-next.config.ts` に集約する
12. Cloudflare binding へのアクセスは専用モジュールに閉じ込める
13. 本番相当の確認は `pnpm run preview` で `workerd` 上の挙動を確認する
14. グローバルCSSは Next.js 標準の `src/app/globals.css` に置く

重要なのは、技術別分類だけでなく、**機能単位の分類**を取り入れることです。

Cloudflare Workers 向けの Next.js では、アプリケーションコードだけでなく、ルート直下のデプロイ設定ファイルも構成の一部として扱います。`src/` の中だけを整理しても、`wrangler.jsonc`、`open-next.config.ts`、`cloudflare-env.d.ts`、`public/_headers` の責務が曖昧だと、プレビュー・デプロイ・キャッシュ・binding の運用で迷いやすくなります。

---

## 2. 推奨フォルダ構成

標準構成は以下です。

```text
.
├── public/
│   ├── _headers
│   ├── favicon.svg
│   └── images/
├── tests/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── api/
│   │       └── webhooks/
│   │           └── stripe/
│   │               └── route.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   └── layout/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── organizations/
│   │   ├── billing/
│   │   └── dashboard/
│   │
│   ├── hooks/
│   ├── lib/
│   │   ├── cloudflare/
│   │   │   └── context.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts
│   │   ├── utils.ts
│   │   ├── logger.ts
│   │   └── errors.ts
│   │
│   ├── config/
│   │   ├── app.ts
│   │   ├── env.client.ts
│   │   ├── env.server.ts
│   │   └── routes.ts
│   │
│   ├── types/
│   │   ├── database.types.ts
│   │   ├── app.ts
│   │   └── common.ts
│   │
│   └── proxy.ts  # 必要な場合のみ
│
├── cloudflare-env.d.ts
├── open-next.config.ts
├── wrangler.jsonc
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
├── .dev.vars.example
└── .env.example
```

> [!warning]
> Next.js 16 では `middleware.ts` は非推奨になり、`proxy` への移行が推奨されています。新規プロジェクトでは `middleware.ts` を作成せず、必要に応じて `proxy` を使用してください。

> [!note]
> Cloudflare Pages ではなく Cloudflare Workers を標準にします。フルスタック Next.js、Route Handlers、Server Actions、SSR、ISR を使う前提では、Workers + OpenNext adapter の構成を標準にした方が、実行環境とデプロイ手順が明確になります。

### 2.1 Cloudflare向けにルート直下へ置くもの

`pnpm create cloudflare@latest . --framework=next` で生成されるファイルは、単なる付属物ではなくデプロイ境界そのものです。

| ファイル              | 役割                                                                      |
| --------------------- | ------------------------------------------------------------------------- |
| `wrangler.jsonc`      | Worker名、entrypoint、compatibility date、assets、binding を定義する      |
| `open-next.config.ts` | OpenNext Cloudflare adapter のキャッシュ・変換設定を定義する              |
| `cloudflare-env.d.ts` | `wrangler types` で生成する Cloudflare binding の型定義                   |
| `public/_headers`     | Workers Static Assets で配信される静的ファイルのHTTPヘッダーを定義する    |
| `.dev.vars.example`   | `preview` 用の `NEXTJS_ENV=development` サンプル。秘密値は入れない        |
| `.env.example`        | `next dev` とビルド時に使う環境変数サンプル。秘密値は入れない             |
| `next.config.ts`      | Next.js設定。Cloudflare開発補助の `initOpenNextCloudflareForDev()` も扱う |
| `postcss.config.mjs`  | Tailwind CSS v4 / PostCSS の設定                                          |
| `pnpm-lock.yaml`      | Workers Builds / CI で同じ依存関係を再現するために管理する                |
| `pnpm-workspace.yaml` | 単一アプリでも pnpm workspace 前提を明示する場合に管理する                |

生成物のうち、以下はコミットしません。

```text
.open-next/
.wrangler/
.next/
.dev.vars
.dev.vars.*
.env
.env.*
```

ただし、サンプルとして共有する `.dev.vars.example` と `.env.example` はコミット対象にします。`.gitignore` では、これらを除外対象から外します。

---

## 3. `src/app/`

`app/` は Next.js App Router のルーティングを管理する場所です。

主に以下を置きます。

- `page.tsx`
- `layout.tsx`
- `loading.tsx`
- `error.tsx`
- `not-found.tsx`
- `route.ts`
- `globals.css`

例：

```text
src/app/
├── layout.tsx
├── page.tsx
├── globals.css
├── dashboard/
│   └── page.tsx
├── settings/
│   └── page.tsx
└── api/
    └── webhooks/
        └── stripe/
            └── route.ts
```

### 3.1 ルール

`app/` には、できるだけページ構成に関係するものだけを置きます。

OK：

- `page.tsx`
- `layout.tsx`
- `loading.tsx`
- `error.tsx`
- `route.ts`
- `globals.css`
- ページ固有の簡単なコンポーネント

NG：

- 大量の業務ロジック
- Supabaseの複雑な処理
- 汎用コンポーネント
- アプリ全体で使うhooks
- `service_role` を使う処理
- Cloudflare binding を直接読む複雑な処理

---

## 4. `src/app/api/`

`app/api/` は Route Handlers を置く場所です。

Route Handler は HTTP API エンドポイントです。

例：

```text
src/app/api/webhooks/stripe/route.ts
src/app/api/cron/daily-report/route.ts
src/app/api/health/route.ts
```

### 4.1 使う場面

Route Handler は、主に以下で使います。

- StripeなどのWebhook受信
- 外部サービスから叩かれるAPI
- Cron Job
- BFFとしてのAPI
- クライアントに直接見せたくないサーバー処理
- ファイルアップロードの署名URL発行
- 外部APIのプロキシ
- Cloudflare Queue / R2 / KV / D1 などのbindingを使う処理

### 4.2 注意点

App Routerでは、トップレベルに `api/` フォルダを作るのではなく、`src/app/api/**/route.ts` に置きます。

NG：

```text
api/users.ts
api/webhooks/stripe.ts
```

OK：

```text
src/app/api/users/route.ts
src/app/api/webhooks/stripe/route.ts
```

Cloudflare Workers で動かすRoute Handlerは、Node.jsサーバーではなくWorkers runtime上で動きます。`fs`、長時間実行、常駐プロセス、Node.js専用のネイティブ依存に寄せた実装は避け、`pnpm run preview` で本番に近い `workerd` runtime 上の挙動を確認します。

---

## 5. Route Handlers と Server Actions の違い

Route Handlers と Server Actions は混同しないでください。

### 5.1 Route Handlers

Route Handler は HTTP エンドポイントです。

```ts
export async function GET() {
	return Response.json({ ok: true });
}
```

主な用途：

- 外部からHTTPで呼ばれる
- Webhook
- Cron
- APIレスポンスを返す
- `GET / POST / PUT / DELETE` などを扱う

置き場所：

```text
src/app/api/**/route.ts
```

### 5.2 Server Actions

Server Actions は、サーバー上で実行される関数です。

```ts
"use server";

export async function createProject(formData: FormData) {
	// DB更新処理
}
```

主な用途：

- フォーム送信
- DB更新
- 認証済みユーザーの操作
- UIと密接な業務アクション

基本の置き場所：

```text
src/features/projects/actions.ts
src/features/billing/actions.ts
src/features/organizations/actions.ts
```

ただし、機能が大きくなる場合は `actions/` ディレクトリに分割してもよいです。

```text
src/features/billing/actions/
├── create-checkout-session.ts
├── create-billing-portal-session.ts
├── cancel-subscription.ts
└── index.ts
```

### 5.3 Server Actions のセキュリティ注意点

Server Actions はサーバー上で実行されますが、**信頼できる内部関数として扱ってはいけません**。

必ず以下を行います。

- 認証チェック
- 認可チェック
- 入力値検証
- `organization_id` の検証
- 権限不足時の早期return
- 必要に応じた監査ログ記録

NG：

```ts
"use server";

export async function deleteProject(projectId: string) {
	const supabase = await createClient();

	await supabase.from("projects").delete().eq("id", projectId);
}
```

この実装では、ログインユーザーがそのprojectを削除してよいか分かりません。

OK：

```ts
"use server";

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { canDeleteProject } from "./permissions";

export async function deleteProject(projectId: string) {
	const supabase = await createClient();

	const allowed = await canDeleteProject(projectId);

	if (!allowed) {
		return {
			ok: false,
			error: "Forbidden",
		};
	}

	const { error } = await supabase
		.from("projects")
		.delete()
		.eq("id", projectId);

	if (error) {
		return {
			ok: false,
			error: "Failed to delete project",
		};
	}

	return { ok: true };
}
```

---

## 6. `src/features/`

`features/` は、業務機能ごとにコードをまとめる場所です。

SaaS開発では、ここを中心に設計します。

例：

```text
src/features/
├── auth/
├── organizations/
├── billing/
├── projects/
├── members/
└── dashboard/
```

各featureの中は、以下のように分けます。

```text
src/features/billing/
├── components/
├── actions.ts
├── queries.ts
├── permissions.ts
├── types.ts
├── schemas.ts
└── constants.ts
```

### 6.1 各ファイルの役割

| ファイル/フォルダ | 役割                                      |
| ----------------- | ----------------------------------------- |
| `components/`     | その機能内だけで使うUI                    |
| `actions.ts`      | Server Actions。主に書き込み・mutation    |
| `queries.ts`      | DB読み取り処理                            |
| `permissions.ts`  | 認可判定                                  |
| `types.ts`        | その機能専用の型                          |
| `schemas.ts`      | Zodなどのバリデーションスキーマ           |
| `constants.ts`    | その機能専用の定数                        |
| `hooks/`          | その機能専用のReact hooks。必要な場合のみ |
| `utils.ts`        | その機能専用の補助関数。必要な場合のみ    |

例：billing feature

```text
src/features/billing/
├── components/
│   ├── PlanCard.tsx
│   └── BillingPortalButton.tsx
├── actions.ts
├── queries.ts
├── permissions.ts
├── types.ts
├── schemas.ts
└── constants.ts
```

### 6.2 この構成のメリット

- 請求関連のコードが一箇所に集まる
- `components/` に何でも溜まる問題を防げる
- 機能削除・機能移動がしやすい
- 新人が「どこを見ればよいか」を判断しやすい
- 認可処理の場所が明確になる

---

## 7. `src/components/`

`components/` は、アプリ全体で再利用するUIコンポーネントを置く場所です。

例：

```text
src/components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
└── layout/
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx
```

### 7.1 置いてよいもの

- `Button`
- `Input`
- `Modal`
- `Dialog`
- `Card`
- `Dropdown`
- `Header`
- `Sidebar`
- `Footer`

### 7.2 置かないもの

- `BillingPlanCard`
- `ProjectInviteDialog`
- `OrganizationMemberTable`
- `UserProfileForm`

これらは業務機能に依存しているため、`features/` 配下に置きます。

```text
src/features/billing/components/BillingPlanCard.tsx
src/features/projects/components/ProjectInviteDialog.tsx
src/features/organizations/components/OrganizationMemberTable.tsx
```

---

## 8. `src/lib/`

`lib/` は、アプリ全体で使う汎用処理や外部サービスクライアントを置く場所です。

例：

```text
src/lib/
├── cloudflare/
├── supabase/
├── utils.ts
├── logger.ts
└── errors.ts
```

### 8.1 置いてよいもの

- Supabase client
- 汎用ユーティリティ
- ロガー
- エラー処理
- 日付処理
- 共通定数
- 外部APIクライアントの共通初期化
- Cloudflare binding への薄いアクセサ

### 8.2 置かないもの

- billing専用ロジック
- organization専用ロジック
- project専用ロジック
- 特定featureの認可処理

業務専用ロジックは `features/` に置きます。

### 8.3 `src/lib/cloudflare/`

Cloudflare binding を使う場合は、`getCloudflareContext()` を各featureから直接呼び散らさず、`src/lib/cloudflare/` に薄い境界を作ります。

```text
src/lib/cloudflare/
├── context.ts
├── r2.ts
├── kv.ts
└── queue.ts
```

基本方針：

- binding名は `CloudflareEnv` の型で管理する
- `getCloudflareContext()` は `context.ts` に寄せる
- R2 / KV / D1 / Queue などのbindingごとに小さなアクセサを作る
- 業務判断は `features/` 側に置き、`lib/cloudflare/` はCloudflare APIの薄いラッパーに留める
- `next dev` と `preview` で挙動差が出るため、binding利用コードは必ず `pnpm run preview` でも確認する

例：

```ts
import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getCloudflareEnv() {
	return getCloudflareContext().env;
}
```

---

## 9. Supabase構成

Supabaseを使うプロジェクトでは、クライアントを明確に分けます。

```text
src/lib/supabase/
├── client.ts
├── server.ts
└── admin.ts
```

### 9.1 `client.ts`

ブラウザで使う Supabase client です。

用途：

- Client Component
- ブラウザ上の処理
- publishable key を使う処理

注意点：

- `service_role` key を使ってはいけない
- RLS前提のアクセスに限定する
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 以外の秘密情報を入れない

> [!note]
> Supabase の古いプロジェクトや既存資料では `anon key` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` と呼ばれる場合があります。新規プロジェクトでは、公開可能なクライアント用キーとして `publishable key` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を使います。どちらもブラウザに露出する前提のキーであり、アクセス制御はRLSと認証済みユーザーのJWTで行います。

### 9.2 `server.ts`

Server Component / Server Actions / Route Handlers で使う通常のサーバー用clientです。

用途：

- ログインユーザーのセッションを使ったDBアクセス
- RLSを効かせたサーバー処理
- Cookieベースの認証処理

基本方針：

```ts
import "server-only";
```

を入れ、サーバー専用であることを明示します。

### 9.3 `admin.ts`

`service_role` を使う管理者用clientです。

`admin.ts` は原則として最終手段です。

使ってよい場面：

- Stripe Webhook など、ログインユーザーのセッションが存在しない処理
- 管理者専用のバックオフィス処理
- Cron / batch などのシステム処理
- Auth Admin API を使う処理
- RLSを意図的にバイパスする必要がある処理

使わない場面：

- 通常のログインユーザー操作
- 一般的なCRUD
- RLSを書けば実現できる処理
- Client Component
- ブラウザで実行されるhooks

重要ルール：

```ts
import "server-only";
```

`admin.ts` には必ず `server-only` を入れます。

NG：

```ts
// Client Componentからadmin.tsをimportする
import { createAdminClient } from "@/lib/supabase/admin";
```

OK：

```ts
// Route HandlerやServer Actionの中で、必要な場合だけ使う
import { createAdminClient } from "@/lib/supabase/admin";
```

---

## 10. `server-only` / `client-only` の使い分け

サーバー専用モジュールには `server-only` を入れます。

対象例：

- `src/lib/supabase/admin.ts`
- `src/lib/supabase/server.ts`
- `src/lib/cloudflare/context.ts`
- `src/features/**/queries.ts`
- `src/features/**/permissions.ts`
- `src/config/env.server.ts`
- Stripe secret key を扱う処理
- service role key を扱う処理
- Cloudflare R2 / KV / D1 / Queue などのサーバーbindingを扱う処理

例：

```ts
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/config/env.server";

export function createAdminClient() {
	const serverEnv = getServerEnv();

	return createClient(
		serverEnv.NEXT_PUBLIC_SUPABASE_URL,
		serverEnv.SUPABASE_SERVICE_ROLE_KEY,
	);
}
```

理由：

- `service_role` key の漏えい防止
- サーバー専用処理のクライアント混入防止
- import ミスの早期検知

---

## 11. `src/hooks/`

`hooks/` は、アプリ全体で再利用するカスタムReactフックを置きます。

例：

```text
src/hooks/
├── useMediaQuery.ts
├── useDebounce.ts
└── useMounted.ts
```

### 11.1 置いてよいもの

- `useMediaQuery`
- `useDebounce`
- `useLocalStorage`
- `useMounted`

### 11.2 置かないもの

- `useBillingPlans`
- `useOrganizationMembers`
- `useProjectTasks`

機能に依存するhookは `features/` に置きます。

```text
src/features/billing/hooks/useBillingPlans.ts
src/features/organizations/hooks/useOrganizationMembers.ts
```

---

## 12. `src/types/`

`types/` は、アプリ全体で使う型を置きます。

例：

```text
src/types/
├── database.types.ts
├── app.ts
└── common.ts
```

### 12.1 置いてよいもの

- Supabaseから生成したDB型
- アプリ全体で使う共通型
- 汎用的なレスポンス型

### 12.2 置かないもの

- billing専用の型
- project専用の型
- organization専用の型

機能専用の型は `features/{feature}/types.ts` に置きます。

---

## 13. `src/config/`

`config/` はアプリケーション設定を置く場所です。

例：

```text
src/config/
├── app.ts
├── routes.ts
├── env.client.ts
└── env.server.ts
```

### 13.1 `app.ts`

```ts
export const appConfig = {
	name: "My SaaS",
	description: "Project management app",
};
```

### 13.2 `routes.ts`

```ts
export const routes = {
	home: "/",
	dashboard: "/dashboard",
	settings: "/settings",
};
```

### 13.3 `env.server.ts` / `env.client.ts`

環境変数は `env.server.ts` / `env.client.ts` などで検証してから使います。

推奨：

- `process.env` を各所で直接読まない
- サーバー専用値は `env.server.ts` に集約する
- ブラウザ公開値は `env.client.ts` に集約する
- Zodなどで必須環境変数を検証する
- サーバー専用環境変数とクライアント公開環境変数を分ける
- Cloudflare binding は `process.env` ではなく `src/lib/cloudflare/` から扱う

Zodで検証する場合は、あらかじめ依存関係を追加します。

```bash
pnpm add zod
```

例：

```ts
import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
	NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
	NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
	STRIPE_SECRET_KEY: z.string().min(1).optional(),
});

export const serverEnv = serverEnvSchema.parse({
	NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
	NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
	STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
});
```

クライアント側で使う公開環境変数は別ファイルに分けてもよいです。

```text
src/config/env.server.ts
src/config/env.client.ts
```

Cloudflare Workers では、環境変数とbindingを分けて考えます。

| 種類                      | 主な用途                                                    | 置き場所                                               |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| Next.js / build time env  | `next dev`、`next build`、SSG、クライアント公開値の埋め込み | `.env.local`、`.env.example`、Workers Buildsの変数     |
| Runtime env               | Worker上で動くNext.jsコードが実行時に読む値                 | `.env.local`、Cloudflare DashboardのRuntime variables  |
| Cloudflare binding        | R2、KV、D1、Queue、Service Binding                          | `wrangler.jsonc`、Cloudflare Dashboardの各リソース設定 |
| Worker local env selector | `preview`時にNext.jsの環境名を選ぶ                          | `.dev.vars` の `NEXTJS_ENV=development`                |

ローカルでは以下のように分けます。

```text
.env.local        # next dev / next build 用。コミットしない
.env.example      # 共有用サンプル。秘密値は入れない
.dev.vars         # preview時のNEXTJS_ENV指定用。コミットしない
.dev.vars.example # NEXTJS_ENV=development の共有用サンプル
```

ローカル開発では、通常の環境変数はNext.jsの `.env` 系ファイルで管理します。`.dev.vars` に大量のアプリ用環境変数を寄せると、`next dev` から見えず、開発サーバーと `preview` で挙動がズレやすくなります。

`NEXT_PUBLIC_` が付かない値は、Client Component から読めない前提で扱います。Cloudflareにデプロイする場合も、ビルド時に必要な値とruntimeで必要な値を分けて登録します。

---

## 14. グローバルCSS / Tailwind CSS

Cloudflare向けにC3で作成したNext.jsプロジェクトでは、グローバルCSSは Next.js App Router 標準の `src/app/globals.css` に置きます。

```text
src/app/
├── layout.tsx
├── page.tsx
└── globals.css
```

Tailwind CSS v4 では、`tailwind.config.ts` を作らずに `postcss.config.mjs` とCSS側のimportで完結する構成も標準的です。必要になった場合だけトップレベルに `tailwind.config.ts` を追加します。

```text
postcss.config.mjs
tailwind.config.ts  # 必要になった場合のみ
```

NG：

```text
src/styles/globals.css
src/styles/tailwind.config.ts
```

理由：

- `src/app/layout.tsx` から `./globals.css` をimportするNext.js標準構成とズレる
- C3生成テンプレートとの差分が増える
- Tailwindや関連ツールの設定ファイルはトップレベルにある方が見つけやすい

---

## 15. `public/`

`public/` は静的アセットを置く場所です。

例：

```text
public/
├── _headers
├── images/
├── icons/
├── favicon.ico
└── og-image.png
```

置くもの：

- 画像
- アイコン
- favicon
- OGP画像
- `robots.txt`
- `sitemap.xml`
- `_headers`

Cloudflare Workers Static Assets では、`public/_headers` を使って静的アセットのHTTPヘッダーを定義できます。C3生成構成では、Next.js のビルド済み静的アセットに長期キャッシュを付ける用途で使います。

例：

```text
/_next/static/*
  Cache-Control: public,max-age=31536000,immutable
```

注意：

ユーザーがアップロードした画像は、原則として `public/` に置きません。

アップロード画像は、以下のようなストレージを使います。

- Supabase Storage
- Cloudflare R2
- Bunny.net Storage

教材の標準構成では、まず Supabase Storage を使う方針にすると分かりやすいです。

---

## 16. `tests/`

`tests/` はテスト関連ファイルを置きます。

例：

```text
tests/
├── unit/
├── integration/
├── e2e/
└── fixtures/
```

例：

```text
tests/
├── unit/
│   └── formatDate.test.ts
├── integration/
│   └── createProject.test.ts
├── e2e/
│   └── signup.spec.ts
└── fixtures/
    └── users.ts
```

ルール：

- 単体テストは対象ファイルの近くに置いてもよい
- E2Eテストは `tests/e2e` にまとめる
- fixtureは `tests/fixtures` にまとめる

---

## 17. `supabase/`

Supabaseを本格利用する場合は、アプリコードとは別に `supabase/` ディレクトリを管理します。

```text
supabase/
├── migrations/
├── seed.sql
└── config.toml
```

基本方針：

- DBスキーマ変更は migrations に残す
- ローカル開発用の初期データは `seed.sql` に置く
- 生成された型は `src/types/database.types.ts` に置く
- RLS policy も migration として管理する

例：

```text
src/types/database.types.ts
```

---

## 18. Cloudflare Workers / OpenNext構成

Cloudflare Workers にデプロイするNext.jsプロジェクトでは、次の4ファイルを標準構成に含めます。

```text
wrangler.jsonc
open-next.config.ts
cloudflare-env.d.ts
public/_headers
```

### 18.1 `wrangler.jsonc`

`wrangler.jsonc` は、Cloudflare Workers でどのファイルを起動し、どのassetsやbindingを使うかを定義するファイルです。

C3生成構成では、主に以下を管理します。

- `main: ".open-next/worker.js"`
- `compatibility_date`
- `compatibility_flags`
- `assets.directory: ".open-next/assets"`
- `assets.binding: "ASSETS"`
- R2 / KV / D1 / Queue / Service Binding
- Observability

基本例：

```jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "my-next-app",
	"main": ".open-next/worker.js",
	"compatibility_date": "2026-05-15",
	"compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
	"assets": {
		"binding": "ASSETS",
		"directory": ".open-next/assets",
	},
	"observability": {
		"enabled": true,
	},
}
```

`name` と `compatibility_date` は、プロジェクト作成直後のplaceholderのままにしません。

### 18.2 `open-next.config.ts`

`open-next.config.ts` は、OpenNext Cloudflare adapter の設定ファイルです。

置くもの：

- incremental cache の設定
- R2 cache の設定
- advanced mode の設定
- adapter固有のoverride

置かないもの：

- 業務ロジック
- 環境変数検証
- Supabase client
- feature専用設定

基本例：

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

### 18.3 `cloudflare-env.d.ts`

`cloudflare-env.d.ts` は、Cloudflare binding の型定義です。

`wrangler.jsonc` にbindingを追加したら、以下を実行して型を更新します。

```bash
pnpm run cf-typegen
```

生成された `CloudflareEnv` は、`getCloudflareContext().env` の型として使います。

```ts
import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getCloudflareEnv(): CloudflareEnv {
	return getCloudflareContext().env;
}
```

### 18.4 `next.config.ts`

Cloudflare binding を `next dev` からも参照する場合は、C3生成構成のように `initOpenNextCloudflareForDev()` を呼び出します。

```ts
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

export default nextConfig;

initOpenNextCloudflareForDev();
```

ただし、`next dev` はWorkers runtimeではありません。本番相当の確認は `pnpm run preview` で行います。

### 18.5 npm scripts

Cloudflare向けプロジェクトでは、最低限以下のscriptを持たせます。

```json
{
	"scripts": {
		"dev": "next dev",
		"build": "next build",
		"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
		"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
		"upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
		"cf-typegen": "wrangler types --env-interface CloudflareEnv ./cloudflare-env.d.ts"
	}
}
```

| コマンド     | 用途                                                 |
| ------------ | ---------------------------------------------------- |
| `dev`        | Next.js 開発サーバー。開発速度を優先する             |
| `build`      | Next.js の通常ビルド。型・構文の基本確認にも使う     |
| `preview`    | OpenNext build後、`workerd` で本番相当に近く確認する |
| `deploy`     | Cloudflare Workers にデプロイする                    |
| `upload`     | Workerをアップロードする。CI構成によって使い分ける   |
| `cf-typegen` | `cloudflare-env.d.ts` を更新する                     |

---

## 19. `proxy.ts` / `middleware.ts`

> [!warning]
> Next.js 16 では `middleware.ts` は非推奨になりました。新規プロジェクトでは使用しないでください。
> 代わりに `proxy` を使用してください。詳細は [middleware-to-proxy](https://nextjs.org/docs/messages/middleware-to-proxy) を参照してください。

新規プロジェクトでリクエスト前段の制御が必要な場合は、`src/proxy.ts` を作成します。Proxy はプロジェクト内に1つだけ置き、ルート別の処理は別モジュールへ分割して `src/proxy.ts` から呼び出します。

既存プロジェクトで `middleware.ts` を使っている場合は、`proxy.ts` への移行時に以下を参考にしてください。

Cloudflare adapter は Middleware / Proxy をサポートしますが、Node.js Middleware に依存した処理は避けます。Proxy はアプリ本体の前段にあるネットワーク境界として扱い、軽量なリクエスト制御に限定します。本番相当の確認は `pnpm run preview` で行います。

### 19.1 置いてよかった処理

- 認証セッションの更新
- 未ログインユーザーのリダイレクト
- 保護ルートの簡易判定
- locale判定
- 軽量なリクエスト制御

Proxy は完全な認可層ではありません。ログイン状態に応じたリダイレクトやcookie更新までは置いてよいですが、最終的な認証・認可・入力検証は Server Actions、Route Handlers、RPC、RLS 側で必ず行います。

### 19.2 置かない処理

- 複雑な業務ロジック
- 大量のDBアクセス
- 請求・権限・状態更新のような重要処理
- `service_role` を使う処理
- Proxy の判定だけに依存する最終認可

---

## 20. 小規模プロジェクトの場合

最初から複雑にしすぎる必要はありません。

小規模なら以下で十分です。

```text
src/
├── app/
├── components/
├── lib/
└── styles/
```

機能が増えてきたら、`features/` を導入します。

### 20.1 導入の目安

- 認証、請求、組織管理などの機能が増えた
- `components/` が肥大化してきた
- `lib/` に業務ロジックが混ざり始めた
- どこに何を置くか迷う時間が増えた

このタイミングで `features/` に切り出します。

---

## 21. 中規模以上のSaaSの場合

中規模以上では、最初から `features/` を中心にします。

```text
src/features/
├── auth/
├── onboarding/
├── organizations/
├── members/
├── billing/
├── projects/
├── notifications/
└── settings/
```

各featureは以下の構成を基本にします。

```text
src/features/{feature-name}/
├── components/
├── actions.ts
├── queries.ts
├── permissions.ts
├── schemas.ts
├── types.ts
└── constants.ts
```

必要に応じて追加します。

```text
hooks/
utils.ts
server.ts
client.ts
events.ts
```

---

## 22. 命名ルール

### 22.1 フォルダ名

フォルダ名は原則として `kebab-case` または `lowercase` にします。

OK：

```text
billing
user-profile
organizations
project-settings
```

NG：

```text
Billing
UserProfile
ProjectSettings
```

### 22.2 コンポーネント名

Reactコンポーネントは `PascalCase` にします。

OK：

```text
BillingPlanCard.tsx
UserProfileForm.tsx
ProjectInviteDialog.tsx
```

NG：

```text
billing-plan-card.tsx
user-profile-form.tsx
```

### 22.3 hooks

React hooks は `use` から始めます。

OK：

```text
useDebounce.ts
useMediaQuery.ts
useOrganizationMembers.ts
```

NG：

```text
debounce.ts
mediaQuery.ts
organizationMembers.ts
```

### 22.4 Server Actions

小〜中規模では、Server Actions は `actions.ts` にまとめます。

```text
src/features/projects/actions.ts
```

例：

```ts
"use server";

export async function createProject() {}
export async function updateProject() {}
export async function deleteProject() {}
```

大きくなったら `actions/` ディレクトリに分割します。

---

## 23. importルール

### 23.1 原則

重要なのは、**共通層が業務機能に依存しないこと**です。

許可する依存：

```text
app → features
app → components
features → components/ui
features → lib
features → types
components/ui → lib/utils
```

避けるべき依存：

```text
lib → features
components/ui → features
別featureの内部実装を直接import
```

### 23.2 NG例

```ts
// NG: lib が業務機能に依存している
import { createInvoice } from "@/features/billing/actions";
```

```ts
// NG: 共通Buttonがbillingに依存している
import { BillingPlan } from "@/features/billing/types";
```

### 23.3 OK例

```ts
// OK: app が feature を使う
import { BillingPage } from "@/features/billing/components/BillingPage";
```

```ts
// OK: feature が共通UIを使う
import { Button } from "@/components/ui/Button";
```

```ts
// OK: components/ui が汎用utilsを使う
import { cn } from "@/lib/utils";
```

### 23.4 feature間の依存

別featureの内部実装を直接importしすぎると、依存関係が複雑になります。

NG：

```ts
import { internalBillingHelper } from "@/features/billing/utils";
```

許容：

```ts
import { getCurrentOrganization } from "@/features/organizations/queries";
```

ただし、共有される前提の関数だけを使います。必要なら `features/shared/` や `lib/` への切り出しを検討します。

---

## 24. Supabase + RLS の設計ルール

Supabaseを使う場合、フォルダ構成とセキュリティ設計をセットで考えます。

### 24.1 基本ルール

- ブラウザでは publishable key client を使う
- サーバーでは server client を使う
- `service_role` は `admin.ts` に閉じ込める
- `admin.ts` には `server-only` を入れる
- RLSを有効にする
- ただしRLSだけに依存しない
- アプリケーション層でも `organization_id` を必ず扱う
- Server Actions でも認証・認可を必ず行う

### 24.2 `organization_id`

マルチテナントSaaSでは、主要テーブルに `organization_id` を持たせます。

例：

```text
projects
tasks
members
invoices
subscriptions
```

推奨：

- `organization_id` を検索条件に必ず含める
- インデックスは `organization_id` を先頭にする
- RLSは防御層として使う
- 業務ロジックは Server Actions / RPC / Route Handlers に寄せる
- `organization_id` をクライアント入力だけで信用しない

### 24.3 認可チェックの置き場所

認可処理は `permissions.ts` に寄せます。

```text
src/features/projects/permissions.ts
```

例：

```ts
import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function canDeleteProject(projectId: string) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("projects")
		.select("id, organization_id")
		.eq("id", projectId)
		.single();

	if (error || !data) {
		return false;
	}

	const { data: membership } = await supabase
		.from("members")
		.select("role")
		.eq("organization_id", data.organization_id)
		.in("role", ["owner", "admin"])
		.maybeSingle();

	return Boolean(membership);
}
```

---

## 25. 実装例：projects feature

### 25.1 構成

```text
src/features/projects/
├── components/
│   ├── ProjectList.tsx
│   ├── ProjectCard.tsx
│   └── CreateProjectForm.tsx
├── actions.ts
├── queries.ts
├── permissions.ts
├── schemas.ts
├── types.ts
└── constants.ts
```

### 25.2 `schemas.ts`

```ts
import { z } from "zod";

export const createProjectSchema = z.object({
	name: z.string().min(1).max(100),
});
```

### 25.3 `queries.ts`

```ts
import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getProjects(organizationId: string) {
	const supabase = await createClient();

	return supabase
		.from("projects")
		.select("*")
		.eq("organization_id", organizationId)
		.order("created_at", { ascending: false });
}
```

### 25.4 `actions.ts`

```ts
"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationId } from "@/features/organizations/queries";
import { createProjectSchema } from "./schemas";

export async function createProject(input: unknown) {
	const parsed = createProjectSchema.safeParse(input);

	if (!parsed.success) {
		return {
			ok: false,
			error: "Invalid input",
		};
	}

	const organizationId = await getCurrentOrganizationId();

	if (!organizationId) {
		return {
			ok: false,
			error: "Organization not found",
		};
	}

	const supabase = await createClient();

	const { error } = await supabase.from("projects").insert({
		name: parsed.data.name,
		organization_id: organizationId,
	});

	if (error) {
		return {
			ok: false,
			error: "Failed to create project",
		};
	}

	return {
		ok: true,
	};
}
```

ポイント：

- `organization_id` をクライアントから直接受け取らない
- 現在のログインユーザーに紐づくorganizationをサーバー側で決める
- 入力値はZodで検証する
- エラーメッセージにDB内部情報をそのまま出しすぎない

---

## 26. よくあるアンチパターン

### 26.1 `components/` が肥大化する

NG：

```text
src/components/
├── BillingPlanCard.tsx
├── ProjectList.tsx
├── OrganizationMemberTable.tsx
├── UserInviteDialog.tsx
└── DashboardRevenueChart.tsx
```

改善：

```text
src/features/billing/components/BillingPlanCard.tsx
src/features/projects/components/ProjectList.tsx
src/features/organizations/components/OrganizationMemberTable.tsx
src/features/dashboard/components/DashboardRevenueChart.tsx
```

### 26.2 `lib/` に業務ロジックを置きすぎる

NG：

```text
src/lib/
├── createInvoice.ts
├── inviteMember.ts
├── cancelSubscription.ts
└── createProject.ts
```

改善：

```text
src/features/billing/actions.ts
src/features/members/actions.ts
src/features/projects/actions.ts
```

### 26.3 `api/` をトップレベルに作る

NG：

```text
api/
└── users.ts
```

改善：

```text
src/app/api/users/route.ts
```

### 26.4 Server Actions を `app/api/` に置く

NG：

```text
src/app/api/projects/actions.ts
```

改善：

```text
src/features/projects/actions.ts
```

### 26.5 `service_role` を雑に使う

NG：

```text
src/lib/supabase.ts
```

この1ファイルに publishable key client、server client、admin client を全部混ぜると危険です。

改善：

```text
src/lib/supabase/
├── client.ts
├── server.ts
└── admin.ts
```

### 26.6 Cloudflare設定をfeature内に分散する

NG：

```text
src/features/files/r2-client.ts
src/features/search/kv-client.ts
src/features/notifications/queue-client.ts
```

各featureが `getCloudflareContext()` やbinding名を直接持つと、binding変更・型更新・preview確認の責務が分散します。

改善：

```text
src/lib/cloudflare/
├── context.ts
├── r2.ts
├── kv.ts
└── queue.ts
```

feature側は、業務用途に必要な関数だけを呼び出します。

```text
src/features/files/actions.ts
src/features/notifications/actions.ts
```

### 26.7 `.open-next/` や `.wrangler/` を管理対象にする

NG：

```text
.open-next/
.wrangler/
.next/
```

これらはビルド・プレビュー時の生成物です。Git管理しません。

改善：

```text
.gitignore
```

```text
/.next/
/.open-next/
.wrangler
```

### 26.8 `next dev` だけでCloudflare対応済みと判断する

NG：

```bash
pnpm run dev
```

`dev` は開発体験を優先した Next.js 開発サーバーです。Workers runtimeとの差分を検出できません。

改善：

```bash
pnpm run preview
```

デプロイ前には、OpenNext build後の `workerd` runtimeで確認します。

### 26.9 Server Actions で認可チェックをしない

NG：

```ts
"use server";

export async function updateProject(projectId: string, name: string) {
	const supabase = await createClient();

	await supabase.from("projects").update({ name }).eq("id", projectId);
}
```

改善：

```ts
"use server";

export async function updateProject(projectId: string, name: string) {
	const allowed = await canUpdateProject(projectId);

	if (!allowed) {
		return {
			ok: false,
			error: "Forbidden",
		};
	}

	const supabase = await createClient();

	const { error } = await supabase
		.from("projects")
		.update({ name })
		.eq("id", projectId);

	if (error) {
		return {
			ok: false,
			error: "Failed to update project",
		};
	}

	return { ok: true };
}
```

---

## 27. 判断基準

どこに置くべきか迷った場合は、以下を基準にします。

| 置きたいもの       | 置き場所                                                |
| ------------------ | ------------------------------------------------------- |
| ページ             | `src/app/**/page.tsx`                                   |
| レイアウト         | `src/app/**/layout.tsx`                                 |
| APIエンドポイント  | `src/app/api/**/route.ts`                               |
| Server Action      | `src/features/{feature}/actions.ts`                     |
| DB読み取り処理     | `src/features/{feature}/queries.ts`                     |
| 認可処理           | `src/features/{feature}/permissions.ts`                 |
| 共通UI             | `src/components/ui/`                                    |
| 機能専用UI         | `src/features/{feature}/components/`                    |
| 汎用hook           | `src/hooks/`                                            |
| 機能専用hook       | `src/features/{feature}/hooks/`                         |
| Supabase client    | `src/lib/supabase/`                                     |
| Cloudflare binding | `src/lib/cloudflare/`                                   |
| 共通型             | `src/types/`                                            |
| 機能専用型         | `src/features/{feature}/types.ts`                       |
| 環境変数設定       | `src/config/env.server.ts` / `src/config/env.client.ts` |
| グローバルCSS      | `src/app/globals.css`                                   |
| 画像・静的ファイル | `public/`                                               |
| 静的assetヘッダー  | `public/_headers`                                       |
| DB migration       | `supabase/migrations/`                                  |
| Workers設定        | `wrangler.jsonc`                                        |
| OpenNext設定       | `open-next.config.ts`                                   |
| Cloudflare型定義   | `cloudflare-env.d.ts`                                   |
| E2Eテスト          | `tests/e2e/`                                            |

---

## 28. 社内標準ルール

1. `app/` はルーティング中心にする
2. `app/api/` は Route Handlers 専用にする
3. Server Actions は `features/{feature}/actions.ts` に置く
4. 業務機能は `features/` に集約する
5. 共通UIのみ `components/` に置く
6. Supabase client は `lib/supabase/` で分離する
7. `admin.ts` には `service_role` を閉じ込める
8. `admin.ts` と `server.ts` には `server-only` を入れる
9. Server Actions では認証・認可・入力検証を必ず行う
10. マルチテナントSaaSでは `organization_id` を必ず扱う
11. `public/` にユーザーアップロードファイルを置かない
12. グローバルCSSは `src/app/globals.css` に置く
13. `wrangler.jsonc` と `open-next.config.ts` をCloudflareデプロイ設定の標準ファイルとして管理する
14. Cloudflare binding は `src/lib/cloudflare/` に境界を作って扱う
15. `cloudflare-env.d.ts` はbinding変更時に `pnpm run cf-typegen` で更新する
16. `pnpm run preview` でWorkers runtime上の確認を行う
17. Tailwind設定は必要な場合のみトップレベルに置く
18. DBスキーマ変更は `supabase/migrations/` に残す

---

## 29. まとめ

Next.jsのフォルダ構成は、最初はシンプルで問題ありません。

ただし、SaaSとして拡張する場合は、以下の4点が重要です。

1. `features/` を中心にする
2. Route Handlers と Server Actions を分ける
3. Supabase client を `client / server / admin` に分離する
4. Cloudflare Workers の設定を `wrangler.jsonc` / `open-next.config.ts` に集約する
5. Cloudflare binding を `src/lib/cloudflare/` に閉じ込める
6. `organization_id` と認可処理を設計の中心に置く

特に Supabase + Next.js の構成では、フォルダ構成がそのままセキュリティ設計にも影響します。

Cloudflare Workers + OpenNext の構成では、さらに実行環境の境界も重要です。単に「きれいなフォルダ構成」を目指すのではなく、**責務・境界・実行環境・権限が読み取れる構成**にすることが重要です。
