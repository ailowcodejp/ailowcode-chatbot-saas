# ailowcode-chatbot-saas

AILowcodeスクールのtoC向けAIチャットSaaSの教材用リポジトリです。

## 技術スタック

| カテゴリ       | 技術                                 |
| -------------- | ------------------------------------ |
| フレームワーク | Next.js 16（App Router）             |
| UI             | React 19, Tailwind CSS 4             |
| 言語           | TypeScript 5                         |
| データベース   | Supabase（PostgreSQL）               |
| 認証           | Supabase Auth（SSR）                 |
| 決済           | Stripe                               |
| AI             | LLM Gateway                          |
| デプロイ       | Cloudflare（OpenNext.js / Wrangler） |
| パッケージ管理 | pnpm                                 |
| Lint / Format  | ESLint 9, Prettier                   |
| Git Hooks      | Husky + lint-staged                  |
| バリデーション | Zod                                  |

## 機能

- サインアップ
- ログイン
- パスワードリセット
- チャット
- 決済（サブスクリプション）

## サブスクリプション概要

- 初回登録時に **10クレジット** を付与
- 会話の回数に応じて **1クレジット** を消費
- **無料プラン** と **プロプラン** の2種類

### プロプラン（AIチャット Pro）

| 項目 | 料金             | クレジット付与         |
| ---- | ---------------- | ---------------------- |
| 月額 | 月額 **980円**   | 毎月 **100クレジット** |
| 年額 | 年額 **9,800円** | 毎月 **100クレジット** |

## 開発環境

- Node.js: 22.13.0以上
- Package manager: pnpm
- Branch strategy: main + Pull Request

## よく使うコマンド

```bash
pnpm install
pnpm run dev
pnpm run preview
pnpm run lint
pnpm run build
```

## セットアップ手順（スクール生向け）

以下は、このリポジトリをクローンして自分のSupabaseプロジェクトに接続し、Cloudflare Workersにデプロイするまでの手順です。

### 前提ツール

| ツール     | バージョン                       |
| ---------- | -------------------------------- |
| Node.js    | >= 22.13.0                       |
| pnpm       | 11.1.1                           |
| Docker     | 最新安定版（ローカルSupabase用） |
| GitHub CLI | 最新安定版                       |

### 1. リポジトリをクローン & 依存関係をインストール

```bash
git clone https://github.com/ailowcodejp/ailowcode-chatbot-saas.git
cd ailowcode-chatbot-saas
pnpm install
```

### 2. Supabase リモートプロジェクトを作成

1. [Supabase Dashboard](https://supabase.com) で **New project** を作成
2. プロジェクト作成後、`Project Settings` → `API` から以下を控える：
   - **Project URL**（`NEXT_PUBLIC_SUPABASE_URL` 用）
   - **publishable key / anon public key**（`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 用）
   - **service_role key**（`SUPABASE_SERVICE_ROLE_KEY` 用、サーバー側のみ）
3. `Project Settings` → `Database` の **Database password** も控える

ローカル Supabase に接続して作業する場合は、`pnpm run db:start` 後に `pnpm exec supabase status` で表示される `API URL`、`anon key`、`service_role key` を同じ env に設定してください。

### 3. Supabase CLI でログイン & リンク

```bash
# Supabase CLI にログイン（ブラウザが開く）
pnpm exec supabase login

# 自分のプロジェクトにリンク
pnpm exec supabase link --project-ref <自分のプロジェクトID>
```

> プロジェクトIDは Supabase ダッシュボードのURL `https://supabase.com/dashboard/project/<ここ>` で確認できます。

### 4. マイグレーションをリモートDBに反映

```bash
pnpm exec supabase db push
```

リポジトリ内のマイグレーションファイルがリモートDBに適用され、テーブル・RLSポリシー・関数などが作成されます。

### 5. 環境変数を設定

ルートの `.env.example` を `.env.local` にコピーし、**自分の Supabase / Stripe の値**に差し替えます。`.env.local` は Git 管理外です。

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<あなたのProject URL または ローカルAPI URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<あなたのpublishable key / anon key>
SUPABASE_SERVICE_ROLE_KEY=<あなたのservice_role key>
LLM_GATEWAY_API_KEY=<LLM GatewayのAPIキー>
STRIPE_SECRET_KEY=<あなたのStripe test secret key>
STRIPE_WEBHOOK_SECRET=<あなたのStripe Webhook署名シークレット>
STRIPE_ALLOWED_PRICE_IDS=<許可するStripe Price ID。複数の場合はカンマ区切り>
STRIPE_PRO_MONTHLY_PRICE_ID=<任意: 月額プランのPrice ID>
STRIPE_PRO_YEARLY_PRICE_ID=<任意: 年額プランのPrice ID>
ALLOWED_REDIRECT_ORIGINS=http://localhost:3000
```

Stripe は受講生ごとの **Test mode workspace** で Product / Price / Webhook を作成し、その workspace の `sk_test_...`、`whsec_...`、`price_...` を設定してください。月額/年額を作る場合は、該当 Price ID を `STRIPE_PRO_MONTHLY_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID` にも設定すると、Webhook 側のプラン判定が安定します。

**Supabase Edge Functions 用のローカル secret** は、Next.js の `.env.local` とは別に `supabase/functions/.env` に設定します。

```bash
cp supabase/functions/.env.example supabase/functions/.env
```

リモート Supabase Edge Functions には、各自の Supabase プロジェクトにリンクした状態で secret を登録します。

```bash
pnpm exec supabase secrets set --env-file supabase/functions/.env
```

**`.dev.vars`**（Cloudflare Workersローカルプレビュー用）も、`.dev.vars.example` をコピーして自分の値に差し替えます。

```bash
cp .dev.vars.example .dev.vars
```

### 6. ローカル開発

```bash
# ローカルSupabase起動（Dockerが必要）
pnpm run db:start

# DB型定義を自動生成
pnpm run gen:types

# 開発サーバー起動
pnpm run dev
```

`http://localhost:3000` で動作確認できます。

### 7. デプロイ（Cloudflare Workers）

```bash
# 本番ビルド確認
pnpm run build

# Cloudflare Workers プレビュー（本番に近い動作確認）
pnpm run preview

# 本番デプロイ
pnpm run deploy
```

> デプロイ後、Cloudflare Dashboard → Workers → 該当アプリ → **Settings → Variables** で Step 5 と同じ環境変数を設定してください。

## 環境変数一覧

| 変数名                                 | 必須 | 公開   | 説明                                                     |
| -------------------------------------- | ---- | ------ | -------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | -    | 公開可 | サイトURL（デフォルト http://localhost:3000）            |
| `NEXT_PUBLIC_SUPABASE_URL`             | ✅   | 公開可 | Supabase Project URL                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅   | 公開可 | Supabase anon public key                                 |
| `SUPABASE_SERVICE_ROLE_KEY`            | ✅   | 秘密   | Supabase service_role key（サーバー側のみ）              |
| `LLM_GATEWAY_API_KEY`                  | ✅   | 秘密   | LLM Gateway の APIキー                                   |
| `STRIPE_SECRET_KEY`                    | ✅   | 秘密   | Stripe API のシークレットキー                            |
| `STRIPE_WEBHOOK_SECRET`                | ✅   | 秘密   | Stripe Webhook の署名検証用シークレット                  |
| `STRIPE_ALLOWED_PRICE_IDS`             | ✅   | 秘密   | Checkout で許可する Stripe Price ID のカンマ区切り一覧   |
| `STRIPE_PRO_MONTHLY_PRICE_ID`          | -    | 秘密   | 月額プランとして扱う Stripe Price ID                     |
| `STRIPE_PRO_YEARLY_PRICE_ID`           | -    | 秘密   | 年額プランとして扱う Stripe Price ID                     |
| `ALLOWED_REDIRECT_ORIGINS`             | -    | 秘密   | Stripe Checkout / Portal の戻り先許可 Origin             |
| `NEXTJS_ENV`                           | -    | 秘密   | Cloudflare環境判定（`.dev.vars` 用、値は `development`） |

## ブランチ運用

- main を基準ブランチとする
- main へ直接 push しない
- 作業ブランチを作成し、Pull Request 経由で main にマージする
