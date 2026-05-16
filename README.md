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

## ブランチ運用

- main を基準ブランチとする
- main へ直接 push しない
- 作業ブランチを作成し、Pull Request 経由で main にマージする
