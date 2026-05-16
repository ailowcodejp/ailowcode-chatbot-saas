# Stripe決済とWebhook実装ガイド

## 目的

このドキュメントは、Stripeを使った決済機能をアプリに実装する際に必要な設計・運用手順をまとめたものです。  
画像で示されていたポイント（テストクロック、Webhookエンドポイント、購読イベント）を基準に、実運用で必要になる要件を追加しています。

## 対象範囲

- Checkout / Subscription の決済フロー
- Webhook受信・署名検証・再試行対策
- DB更新タイミングと冪等性管理
- ローカル検証（Stripe Test Clock）

## 全体アーキテクチャ

1. フロントエンドから決済開始APIを呼ぶ
2. サーバーで Stripe API を呼び出して Checkout Session / Subscription を作成
3. ユーザーは Stripe Hosted Checkout で決済
4. Stripe から Webhook が送信される
5. サーバーで Webhook を検証し、DB状態を更新
6. 必要な更新が終わったら `200` を返す

## 実装原則

- Webhookは「必ず署名検証」してから処理する
- DB更新が完了するまでは `200` を返さない
- 同じイベントの再送に備えて「冪等性」を担保する
- ログは `event_id` 単位で追跡できるように残す
- 失敗時に手動復旧できるよう、処理状態を永続化する

## 決済開始APIの仕様

### 決済APIエンドポイント

- `POST /functions/v1/create-billing-checkout-session`

### 入力例

```json
{
	"priceId": "price_xxx",
	"mode": "subscription"
}
```

### 処理の要点

- アプリユーザーとStripe customerを紐づける
- customer未作成時は作成する
- `success_url` / `cancel_url` を明示する
- 返却値は `checkoutUrl` か `sessionId`

## Webhook実装

### Webhookエンドポイント

- `POST /functions/v1/stripe-billing-webhook`

### 実装必須事項

1. `stripe-signature` ヘッダーを検証
2. 受信payloadを改変せずに検証関数へ渡す
3. `event.id` をキーに重複処理を防止
4. 必要なDB更新をトランザクションで実行
5. 成功時のみ `200` を返す

### 200レスポンスの扱い

- Stripeは `2xx` 以外の応答時に再試行する
- 本番では指数バックオフで再送される
- よって「中途半端な更新で先に200を返す」のは不可

## 購読対象イベント（最小セット）

画像で示されていた運用に合わせ、まず以下を購読します。

1. `refund.failed`
   - 返金失敗時に通知テーブルへ記録し、運用者へ通知
2. `customer.subscription.created`
   - サブスク状態を `active/trialing` へ更新
3. `customer.subscription.updated`
   - プラン変更・期間変更・状態変化を反映
4. `customer.subscription.deleted`
   - 解約状態へ更新（毎月100回分のクレジット付与を停止、アクセス権を無料プランへ降格）
5. `customer.subscription.paused`
   - 一時停止状態へ更新
6. `customer.subscription.resumed`
   - 一時停止解除へ更新
7. `invoice.payment_succeeded`
   - 毎月の決済成功時にクレジット100回分を付与するトリガー
8. `invoice.payment_failed`
   - 決済失敗時にクレジット付与を保留し、ユーザーへ通知

必要に応じて次を追加します。

- `checkout.session.completed`
- `customer.subscription.trial_will_end`

## DB更新設計

このセクションのテーブルは `supabase/migrations/001_schema.sql` で作成し、RLSと権限は `supabase/migrations/002_rls_permissions.sql` で設定します。

### 推奨テーブル

- `billing_subscriptions`
  - `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end`
- `billing_webhook_events`
  - `stripe_event_id` (unique), `event_type`, `payload`, `processed_at`, `status`, `error_message`

### 関連RPC

- `record_billing_webhook_event`: イベント受信/処理状態を冪等更新
- `upsert_billing_subscription_from_stripe`: Stripe subscription状態を冪等反映
- `upsert_billing_customer`: `user_id` と `stripe_customer_id` を同期
- `get_user_id_by_stripe_customer`: Webhook処理時のユーザー特定

### 冪等性の基本

- `stripe_event_id` に一意制約を置く
- 既処理イベントは即時スキップ
- 重複受信でも最終状態が壊れない更新SQLにする

## ローカル開発・テスト

### Stripe Test Clock

ローカル検証では Stripe Test Clock を使い、サブスクの時間経過イベントを再現します。

- 事前に環境変数 `STRIPE_TEST_CLOCK_NAME` を設定
- Stripe Dashboard から時間を進めてイベント発火を確認
- 決済関連のテストデータは必要に応じてリセット

### Stripe CLI（任意）

```bash
stripe listen --forward-to http://localhost:3000/api/webhook/stripe
```

```bash
stripe trigger customer.subscription.created
```

## 障害対応の運用

- Webhook失敗時は `billing_webhook_events.status = 'failed'` を記録
- 運用画面またはSQLで再処理できるようにする
- 返金失敗・継続課金失敗は管理者通知を必須にする

## セキュリティ

- 秘密鍵は `STRIPE_SECRET_KEY` として安全に管理
- Webhook署名シークレットは `STRIPE_WEBHOOK_SECRET` に保存
- APIキーはクライアントに公開しない
- ログ出力時にカード情報など機密値をマスクする

## チェックリスト

- [x] Checkout Session作成APIが実装済み（`create-billing-checkout-session`）
- [x] Webhook署名検証が実装済み（`stripe-billing-webhook`）
- [x] `event.id` ベースの冪等処理が実装済み
- [x] 主要イベントのDB更新が実装済み
- [ ] 失敗通知（refund/payment_failed）が実装済み
- [ ] Test Clockでサブスク更新を検証済み
- [ ] 本番Webhook URLがDashboardに設定済み
