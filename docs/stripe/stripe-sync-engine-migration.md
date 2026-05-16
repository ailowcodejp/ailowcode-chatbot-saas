# Stripe Sync Engine 移行手順（FDW廃止）

## 目的

このプロジェクトの Stripe 連携を、`Stripe Foreign Data Wrapper (FDW)` 前提から `Stripe Sync Engine` 前提へ移行する。

- 運用時のクエリ性能を安定化
- Stripe API レート制限依存を削減
- SQL JOIN / 集計をローカルテーブルで高速化
- foreign table 制約によるポリシー運用の複雑化を回避

## 変更方針

1. `supabase/migrations/001_schema.sql` は FDW を作らず、`stripe` スキーマ初期化のみを実行する
2. `supabase/migrations/002_rls_permissions.sql` は `stripe` スキーマを `anon` / `authenticated` に公開しない
3. Stripeデータ同期は Supabase Dashboard の Integrations から `Stripe Sync Engine` を有効化して行う

## 実施済み変更

- `supabase/migrations/001_schema.sql`
  - FDW関連（`wrappers`, `stripe_wrapper`, `create server`, `create foreign table`）を削除
  - `create schema if not exists stripe;` のみ実行する構成へ変更
- `supabase/migrations/002_rls_permissions.sql`
  - `stripe` スキーマのクライアント公開を明示的に取り消し
  - 顧客向け課金状態は `public.billing_*` を参照する方針へ整理

## Dashboard 作業（必須）

ローカルSQLだけでは Sync Engine を有効化できないため、以下は手動実施が必要。

1. Supabase Dashboard を開く
2. `Integrations` に移動
3. `Stripe Sync Engine` を `Install`
4. Stripe API Key を登録
   - 推奨: Webhook Endpoints の write と他カテゴリ read-only の restricted key
5. 初回バックフィル完了まで待機

## 反映後の確認SQL

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'stripe'
order by table_name;
```

```sql
select table_name
from information_schema.tables
where table_schema = 'stripe'
  and table_name in (
    'customers',
    'products',
    'prices',
    'subscriptions',
    'invoices',
    'payment_intents'
  )
order by table_name;
```

## ローカル実行コマンド

```bash
npx supabase start
npx supabase db reset --local
```

## 注意事項

- Sync Engine 未導入時は `stripe.*` テーブルが存在しない
- 本番/検証で Stripe 参照機能を使う前に、必ず Integrations 側の同期完了を確認する
- `stripe.*` をユーザー向けに直接公開しない。必要な顧客向け状態は `public.billing_customers` / `public.billing_subscriptions` に同期してRLS越しに参照する
