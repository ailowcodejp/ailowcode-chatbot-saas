# Stripe Sync Engineとは

## 概要

Stripe Sync Engineは、Stripeの顧客・サブスクリプション・請求・決済データを、Supabaseのデータベースに継続的に同期する仕組みです。  
Supabase Dashboardの `Integrations` から有効化でき、同期後は `stripe` スキーマのテーブルを通常のSQLテーブルと同じように扱えます。

## 何が便利なのか

### 1. SQLで直接JOIN・集計できる

同期されたStripeデータはローカルDB上にあるため、アプリデータと簡単にJOINできます。

- `auth.users` と `stripe.customers` を結合してコンバージョン分析
- `stripe.subscriptions` と `stripe.prices` を結合してMRR集計
- 自社イベントログとStripeデータを結合して解約予兆分析

### 2. APIレート制限に依存しにくい

Foreign Data Wrapper（FDW）のように毎回Stripe APIを叩くのではなく、同期済みデータを読むため、参照クエリの頻度が高くても運用が安定しやすくなります。

### 3. クエリ性能が安定しやすい

ローカルテーブルに対するクエリのため、複雑なJOINや集計でも性能見積もりがしやすく、監視・チューニングが行いやすくなります。

### 4. 同期の信頼性が高い

Sync EngineはWebhookによる更新取り込みとバックフィル（履歴同期）を組み合わせ、初回導入時と運用時の両方でデータを追従させます。

## FDWとの違い（要点）

- FDW: SQLをStripe API呼び出しに変換する方式（都度取得）
- Sync Engine: StripeデータをDBへ同期する方式（ローカル参照）

目安として、単発参照だけならFDWでも成立しますが、アプリ機能・分析で継続利用するならSync Engineの方が運用保守しやすいです。

## このプロジェクトでの推奨方針

本プロジェクトでは、Stripe連携の主軸をSync Engineに置きます。

- `supabase/migrations/001_schema.sql`: `stripe` スキーマ初期化のみ
- FDW作成やforeign table作成は行わない
- DashboardでSync Engineを有効化して `stripe` テーブルを同期
- `supabase/migrations/002_rls_permissions.sql`: `stripe` スキーマをクライアントに公開しない

詳細な移行手順は以下を参照してください。

- `docs/stripe-docs/stripe-sync-engine-migration.md`

## 有効化の流れ（高レベル）

1. Supabase Dashboardで `Integrations` を開く
2. `Stripe Sync Engine` をInstall
3. Stripe APIキーを設定
4. 初回バックフィル完了を待つ
5. `stripe` スキーマ内テーブルをSQLで確認する

## 注意点

- Sync Engineの有効化はDashboard操作が必要
- 初回バックフィルにはデータ量に応じて時間がかかる
- 同期後にアプリから使う際は、必要なアクセス制御（ビュー/RPC/RLS方針）を別途設計する
