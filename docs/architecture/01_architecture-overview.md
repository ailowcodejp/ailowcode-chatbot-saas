# システムアーキテクチャ

AILowcode プロジェクトにおけるシステム全体のアーキテクチャと、技術選定の意思決定（ADR）をまとめます。

## ドキュメント一覧

| No  | ドキュメント                         | 内容                                |
| --- | ------------------------------------ | ----------------------------------- |
| 01  | 概要（本ドキュメント）               | アーキテクチャ全体像                |
| 02  | フロントエンド設計                   | Next.js App Router の設計方針       |
| 03  | バックエンド設計                     | Supabase を利用したバックエンド構成 |
| 04  | デプロイアーキテクチャ               | Cloudflare Workers の構成           |
| 05  | ADR（Architecture Decision Records） | 技術選定の意思決定記録              |

## 全体構成

```text
[User] -> [Cloudflare Workers] -> [Next.js App Router] -> [Supabase]
                                      |
                                      +-> [Stripe]
                                      +-> [LLM Gateway]
```

- **フロントエンド**: Next.js App Router（SSR / SSG 対応）
- **API**: App Router Route Handlers / Server Actions + Supabase SDK
- **データベース**: Supabase（PostgreSQL）
- **認証**: Supabase Auth（SSR Auth）
- **決済**: Stripe
- **AI**: LLM Gateway
- **デプロイ**: Cloudflare Workers

## 実装時の必須方針

- Route Handler と Server Action は用途を分け、外部 webhook や外部公開 API は `src/app/api/**/route.ts` に置く
- Stripe webhook は署名検証を必須にし、同一イベントの重複処理に耐える設計にする
- LLM Gateway 呼び出しはサーバー側に閉じ、API key や gateway token を Client Component に渡さない
- Supabase の読み書きは RLS を前提にし、service role client は管理処理や webhook 処理など必要な箇所に限定する
- Cloudflare Workers では Node.js サーバー前提の API を避け、`pnpm run preview` で Workers runtime 上の確認を行う
