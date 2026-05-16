# セキュリティガイドライン

AILowcode プロジェクトにおけるアプリケーション全体のセキュリティ方針を定めます。

## ドキュメント一覧

| No  | ドキュメント                   | 内容                             |
| --- | ------------------------------ | -------------------------------- |
| 01  | 概要（本ドキュメント）         | セキュリティ全体方針             |
| 02  | 認証・認可                     | Supabase Auth / RLS の設定       |
| 03  | 環境変数管理                   | シークレット情報の取り扱い       |
| 04  | CSP・HTTP セキュリティヘッダー | Content Security Policy の設定   |
| 05  | 依存パッケージ管理             | 脆弱性チェックとアップデート方針 |

## 基本方針

- Supabase Row Level Security（RLS）は、ユーザーデータを持つ全テーブルに適用する
- 環境変数・API キーは `.env.local` で管理し、Git にコミットしない
- Next.js の Server Actions では適切な認可チェックを実施
- 依存パッケージの脆弱性は、導入済みのツールと CI 方針に合わせて定期確認する
- Cloudflare のセキュリティ機能（WAF, DDoS 対策）を活用

## 現在の導入状況

初期状態では、Supabase client、SSR Auth 用 client、service role client、基本的な HTTP セキュリティヘッダーを用意しています。アプリ固有のテーブル、RLS policy、Stripe webhook、LLM Gateway 呼び出し、クレジット処理は、対象機能の実装時に追加します。

## 実装時の必須方針

- ユーザー別データ、チャット履歴、クレジット残高、サブスクリプション状態を保存するテーブルは RLS を有効化する
- RLS policy は `auth.uid()` などの認証済みユーザー情報を基準にし、他ユーザーのデータを読めないことを検証する
- `SUPABASE_SERVICE_ROLE_KEY` は `src/lib/supabase/admin.ts` 経由のサーバー側処理に限定し、Client Component から参照しない
- Stripe webhook は署名検証、イベント重複対策、失敗時の再処理を前提に実装する
- LLM Gateway の key、Stripe secret、Supabase service role key は `.env.example` にはダミー名だけを記載し、実値をコミットしない
- 外部スクリプト、画像、iframe を追加する場合は CSP と `next.config.ts` のセキュリティヘッダーを見直す
- 認証、決済、クレジット消費、AI 呼び出しに関わる Route Handler / Server Action は、入力検証と認可チェックを必ず行う
