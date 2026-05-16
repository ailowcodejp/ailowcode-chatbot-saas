# AGENTS.md

このプロジェクトは AILowcode スクールの toC 向け AI チャット SaaS の教材用リポジトリです。

**決済**: Stripe  
**AI**: LLM Gateway  
**フレームワーク**: Next.js 16（App Router）+ React 19  
**言語**: TypeScript 5  
**UI**: Tailwind CSS 4  
**データベース / 認証**: Supabase（PostgreSQL, SSR Auth）  
**デプロイ先**: Cloudflare Workers（OpenNext.js / Wrangler）

## プロジェクト固有のコマンド

| カテゴリ         | 実行コマンド                                         |
| ---------------- | ---------------------------------------------------- |
| 開発サーバー起動 | `pnpm run dev`                                       |
| 本番ビルド       | `pnpm run build`                                     |
| Lint             | `pnpm run lint` / `pnpm run lint:fix`                |
| Format           | `pnpm run format` / `pnpm run format:check`          |
| 型チェック       | `pnpm run cf-typegen`（Cloudflare 環境変数の型生成） |
| Cloudflare 確認  | `pnpm run preview`                                   |
| Cloudflare 本番  | `pnpm run deploy`                                    |
| DB 起動          | `pnpm run db:start`                                  |
| DB 停止          | `pnpm run db:stop`                                   |
| DB リセット      | `pnpm run db:reset`                                  |
| DB 差分          | `pnpm run db:diff`                                   |
| DB 反映          | `pnpm run db:push`                                   |
| Supabase 型生成  | `pnpm run gen:types`                                 |

## プロジェクト固有のワークフロー指示

### 1. コード品質（フォーマット・Lint）

コミット前のステージングファイルに対して、**ESLint + Prettier** が自動実行されます（Husky + lint-staged による pre-commit hook）。手動で全体整形する場合は `pnpm run format && pnpm run lint:fix` を実行してください。

`pnpm run lint` でエラーが出た場合は修正してからコミットしてください。

### 2. ドキュメント更新判断

以下のいずれかに該当する変更を行う場合は、必要に応じて該当ドキュメントを更新してください。

- 公開API のインターフェース変更 → `docs/` 配下の関連ドキュメント
- 環境変数やシークレットの追加・削除 → `docs/setup/environment-setup-guide.md` / `.dev.vars.example`
- フォルダ構成の変更 → `docs/coding-guide/11_nextjs-folder-structure-guide.md`
- テスト手法やツールの変更 → `docs/testing/testing-overview.md`
- ビジネスロジック（サブスクリプション、クレジット等）の変更 → `docs/business/business-plan.md` + `README.md`
- アーキテクチャや技術選定の変更 → `docs/architecture/01_architecture-overview.md`

## エージェントスキル

### セットアップガイド

プロジェクトの環境構築手順です。`docs/setup/environment-setup-guide.md` を参照してください。

新規プロジェクトの初期化は `docs/setup/new-project-setup-guide.md` を参照してください。

### アーキテクチャ

システム全体のアーキテクチャと技術選定の意思決定記録（ADR）です。`docs/architecture/01_architecture-overview.md` を参照してください。

### 開発ワークフロー

日々の機能追加・バグ修正の標準フローです。`docs/development/feature-development-guide.md` を参照してください。

運用の詳細は `docs/development/development-operations-guide.md` も併せて参照してください。

### テスト戦略

単体テスト（Vitest / Jest）、コンポーネントテスト（React Testing Library）、E2E テスト（Playwright）の方針です。`docs/testing/testing-overview.md` を参照してください。

### デプロイ / CI/CD

Cloudflare Workers へのデプロイ手順と GitHub Actions による CI/CD パイプラインの構成です。

- デプロイ: `docs/deployment/nextjs-cloudflare-workers-deploy.md`
- CI/CD: `docs/ci-cd/01_ci-cd-overview.md`

### コーディングガイド

Next.js App Router + TypeScript + Tailwind CSS のフォルダ構成とコーディング規約です。`docs/coding-guide/11_nextjs-folder-structure-guide.md` を参照してください。

### バージョン管理

Git / GitHub の運用ルール（ブランチ戦略、コミットルール、PR 手順）です。`docs/version-control/` 配下のドキュメント群を参照してください。

### AI エージェントルール

AI 駆動開発の原則とセキュリティポリシーです。`docs/agent-rules/` 配下を参照してください。

- `docs/agent-rules/ai-driven-development-principles.md`
- `docs/agent-rules/ai-tool-security-policy.md`
