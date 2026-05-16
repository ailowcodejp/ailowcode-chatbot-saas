# Next.js

**説明:** Next.js アプリケーションを作成し、Workers Assets を使って Cloudflare Workers にデプロイする方法。

---

## CLI から開始する

Next.js プロジェクトを Cloudflare Workers 向けに作成します。

```bash
pnpm create cloudflare@latest . --framework=next
```

これはシンプルな入門ガイドです。Cloudflare OpenNext アダプターの詳しい使い方は、OpenNext のドキュメントを参照してください。

---

## Next.js とは？

Next.js は、フルスタックアプリケーションを構築するための React フレームワークです。

Next.js は以下をサポートしています。

- サーバーサイドレンダリング
- クライアントサイドレンダリング
- Partial Prerendering

Partial Prerendering を使うと、同じルート内で静的コンポーネントと動的コンポーネントを組み合わせられます。

Cloudflare OpenNext アダプターを使うことで、Next.js アプリを Cloudflare Workers にデプロイできます。

---

## Next.js の対応機能

Cloudflare OpenNext アダプターでは、Next.js の多くの機能がサポートされています。

| 機能                                  | Cloudflare アダプター | 備考                                                      |
| ------------------------------------- | --------------------- | --------------------------------------------------------- |
| App Router                            | 対応                  |                                                           |
| Pages Router                          | 対応                  |                                                           |
| Route Handlers                        | 対応                  |                                                           |
| React Server Components               | 対応                  |                                                           |
| Static Site Generation / SSG          | 対応                  |                                                           |
| Server-Side Rendering / SSR           | 対応                  |                                                           |
| Incremental Static Regeneration / ISR | 対応                  |                                                           |
| Server Actions                        | 対応                  |                                                           |
| Response streaming                    | 対応                  |                                                           |
| `next/after` による非同期処理         | 対応                  |                                                           |
| Middleware                            | 対応                  |                                                           |
| Image optimization                    | 対応                  | Cloudflare Images 経由で対応                              |
| Partial Prerendering / PPR            | 対応                  | PPR は Next.js では実験的機能                             |
| Composable Caching / `use cache`      | 対応                  | Composable Caching は Next.js では実験的機能              |
| Node.js in Middleware                 | まだ未対応            | Next.js 15.2 で導入された Node.js Middleware はまだ未対応 |

---

# 新規 Next.js プロジェクトを Workers にデプロイする

## 1. create-cloudflare CLI / C3 で新規プロジェクトを作成する

```bash
pnpm create cloudflare@latest my-next-app --framework=next
```

### 裏側で何が起きているか

このコマンドを実行すると、C3 は新しいプロジェクトディレクトリを作成します。

その後、Next.js の公式セットアップツールである `create-next-app` を起動し、Cloudflare 向けの設定を追加します。

さらに、アプリケーションをすぐに Cloudflare にデプロイするかどうかも選択できます。

---

## 2. ローカルで開発する

プロジェクト作成後、プロジェクトディレクトリ内で以下を実行して、ローカル開発サーバーを起動します。

このコマンドでは Next.js の開発サーバーが使われます。

ソースコードを更新するたびに素早くリロードされるため、開発体験が良いです。

```bash
pnpm run dev
```

---

## 3. Cloudflare アダプターでサイトをテスト・プレビューする

```bash
pnpm run preview
```

### `dev` と `preview` の違い

前の手順で使った `dev` コマンドは、Next.js の開発サーバーを使います。

これは Node.js 上で動作します。

一方、実際にデプロイされたアプリケーションは Cloudflare Workers 上で動作します。

Cloudflare Workers は `workerd` ランタイムを使います。

そのため、統合テストや本番環境に近い確認を行う場合は、`preview` コマンドを使うべきです。

`preview` は、`wrangler dev` を使って `workerd` ランタイム上でアプリケーションを実行するため、本番環境により近い動作確認ができます。

---

## 4. プロジェクトをデプロイする

ローカルマシン、または CI/CD システムから、以下のいずれかにデプロイできます。

- `*.workers.dev` サブドメイン
- カスタムドメイン

ビルドしてデプロイするには、以下を実行します。

```bash
pnpm run deploy
```

CI サービスを使う場合は、デプロイコマンドをこれに合わせて更新してください。

### 注意

Workers Builds を使う場合は、Cloudflare 側の **Build Variables and secrets** セクションで環境変数を設定する必要があります。

これにより、Next.js のビルドが以下の環境変数へアクセスできるようになります。

- `NEXT_PUBLIC_...` のような公開用環境変数
- `NEXT_PUBLIC_...` ではない非公開環境変数

これらは、SSG ページのビルドや値のインライン化などに必要です。

---

# 既存の Next.js プロジェクトを Workers にデプロイする

## 自動設定

Wrangler 設定ファイルがないプロジェクトで `wrangler deploy` を実行すると、Wrangler が Next.js を自動検出します。

そのうえで、必要な設定を生成し、プロジェクトをデプロイします。

```bash
pnpm wrangler deploy
```

### 自動で生成される設定

Next.js が検出されると、Wrangler は自動的に以下のような設定を生成します。

#### `wrangler.jsonc`

```jsonc
main: .open-next/worker.js
```

#### `wrangler.jsonc`

```jsonc
assets:
  directory: .open-next/assets
```

#### `wrangler.jsonc`

```jsonc
compatibility_flags:
  nodejs_compat
```

#### `wrangler.jsonc`

```jsonc
observability:
  enabled: true
```

#### `package.json`

```json
adapter: @opennextjs/cloudflare
```

つまり、Wrangler がプロジェクト設定を自動で処理してくれます。

---

# 手動設定

手動で設定したい場合は、以下の手順に従います。

---

## 1. `@opennextjs/cloudflare` をインストールする

```bash
pnpm add @opennextjs/cloudflare@latest
```

---

## 2. Wrangler CLI を devDependency としてインストールする

```bash
pnpm add -D wrangler@latest
```

---

## 3. Wrangler 設定ファイルを追加する

プロジェクトルートに Wrangler 設定ファイルを作成します。

### `wrangler.jsonc` の例

```jsonc
{
	"$schema": "./node_modules/wrangler/config-schema.json",
	"main": ".open-next/worker.js",
	"name": "my-app",

	// 今日の日付を設定する
	"compatibility_date": "2026-05-14",

	"compatibility_flags": ["nodejs_compat"],

	"assets": {
		"directory": ".open-next/assets",
		"binding": "ASSETS",
	},
}
```

### `wrangler.toml` の例

```toml
"$schema" = "./node_modules/wrangler/config-schema.json"
main = ".open-next/worker.js"
name = "my-app"

# 今日の日付を設定する
compatibility_date = "2026-05-14"
compatibility_flags = [ "nodejs_compat" ]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"
```

### 注意

Next.js アプリを `@opennextjs/cloudflare` で動作させるには、以下が必要です。

- `nodejs_compat` compatibility flag を有効にする
- compatibility date を `2024-09-23` 以降に設定する

---

## 4. OpenNext の設定ファイルを追加する

プロジェクトルートに、`open-next.config.ts` という名前の OpenNext 設定ファイルを作成します。

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

### 注意

`open-next.config.ts` ではキャッシュ設定などを行えます。

詳しくは、アダプターのドキュメントを参照します。

---

## 5. `package.json` を更新する

`package.json` に以下の scripts を追加できます。

```json
{
	"scripts": {
		"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
		"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
		"cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
	}
}
```

### 各コマンドの用途

| コマンド     | 用途                                                              |
| ------------ | ----------------------------------------------------------------- |
| `preview`    | アプリをビルドし、Workers ランタイム上でローカルプレビューする    |
| `deploy`     | アプリをビルドし、Cloudflare にデプロイする                       |
| `cf-typegen` | `cloudflare-env.d.ts` を生成し、Cloudflare 環境変数の型を作成する |

---

## 6. ローカルで開発する

プロジェクト作成後、プロジェクトディレクトリで以下を実行します。

このコマンドは Next.js の開発サーバーを使います。

ソースコード更新時に高速にリロードされるため、開発体験が良いです。

```bash
pnpm run dev
```

---

## 7. Cloudflare アダプターでサイトをテストする

前の手順の `dev` コマンドは、Next.js の開発サーバーを使います。

これは開発体験としては優れていますが、実際のアプリケーションは Cloudflare Workers 上で動作します。

そのため、統合テストや本番に近い検証では、以下の `preview` コマンドを使います。

```bash
pnpm run preview
```

---

## 8. プロジェクトをデプロイする

以下のいずれかにデプロイできます。

- `*.workers.dev` サブドメイン
- カスタムドメイン

ローカルマシン、または CI/CD システムからデプロイ可能です。

ビルドしてデプロイするには、以下を実行します。

```bash
pnpm run deploy
```

CI サービスを使う場合は、デプロイコマンドを上記に合わせて更新してください。

### 注意

Workers Builds を使う場合は、Cloudflare の **Build Variables and secrets** に環境変数を設定する必要があります。

これは、Next.js のビルド時に必要な環境変数へアクセスできるようにするためです。

特に以下が重要です。

- `NEXT_PUBLIC_...` で始まる公開環境変数
- `NEXT_PUBLIC_...` で始まらないサーバー側環境変数

これらは、SSG ページのビルドや環境変数のインライン化に必要です。

---

## 要点

このドキュメントのポイントは次のとおりです。

| 項目             | 内容                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ |
| 新規作成         | `pnpm create cloudflare@latest my-next-app --framework=next` が推奨ルート            |
| 開発             | `pnpm run dev`                                                                       |
| 本番に近い確認   | `pnpm run preview`                                                                   |
| デプロイ         | `pnpm run deploy`                                                                    |
| 既存プロジェクト | `pnpm wrangler deploy` で自動検出可能                                                |
| 手動設定         | `@opennextjs/cloudflare`、`wrangler`、`wrangler.jsonc`、`open-next.config.ts` を追加 |
| 重要設定         | `nodejs_compat` と `compatibility_date >= 2024-09-23`                                |
| 注意点           | Workers Builds では環境変数設定が必要                                                |
