# Stripeダッシュボード設定ガイド（AIチャット Pro 商品登録）

このドキュメントは、`ai-chat-template` の課金連携で必要な Stripe ダッシュボード設定を、実装に合わせて手順化したものです。

## プロダクト概要

このプロジェクトはプロダクト開発スクールの教材として、シンプルな課金モデルを採用:

- **無料プラン**: 基本的なAIチャット機能、クレジット10回分（初回のみ）
- **有料プラン**: AIチャット Pro
  - 月額: 980円/月 - 毎月100回分のクレジット付与、高度なAIモデル、優先サポート
  - 年額: 9,800円/年（2ヶ月分無料相当） - 毎月100回分のクレジット付与

対象実装:

- `supabase/functions/create-billing-checkout-session/index.ts`
- `supabase/functions/create-billing-portal-session/index.ts`
- `supabase/functions/stripe-billing-webhook/index.ts`
- `supabase/functions/_shared/stripe.ts`
- `supabase/functions/_shared/supabase-admin.ts`

---

## 1. まず前提として理解しておくこと

このプロジェクトの Checkout 作成は、リクエストボディで受け取った `priceId` を `STRIPE_ALLOWED_PRICE_IDS` の許可リストで検証してから Stripe API に渡します。

- `create-billing-checkout-session` は `priceId`, `successUrl`, `cancelUrl` を必須で受け取る
- `priceId` は `STRIPE_ALLOWED_PRICE_IDS` に含まれる値のみ許可する
- `successUrl` / `cancelUrl` は `ALLOWED_REDIRECT_ORIGINS` に含まれるOriginのみ許可する
- Checkout Session は `mode: "subscription"` で作成される
- そのため Stripe 側では「商品（Product）」だけでなく「定期課金の価格（Recurring Price）」が必要
- アプリ側で使う識別子は `product_xxx` ではなく `price_xxx`

---

## 2. 商品登録（Product + Price）の手順

ここでは、Stripeダッシュボードで Product と Price を実際に作る流れを順番に実施します。

### 2-1. テストモードを有効化

1. Stripe Dashboard 右上の `Test mode` を ON
2. 以後の作業はテストデータとして作成される

### 2-2. 商品と料金を一括作成

Stripeダッシュボードでは「商品を追加」画面から商品情報と料金を同時に作成できます。

1. 左メニュー `商品カタログ`
2. `+ 商品を作成` をクリック → 「商品を追加」画面が開く
3. **名前 (必須)**: `AIチャット Pro`
4. **説明**: `毎月100回分のクレジット付与、高度なAIモデル、優先サポート`
5. **画像**: 任意（2MB未満のJPEG、PNG、またはWEBP）
6. **料金**:
   - `継続` を選択（`1回限り` ではない）
   - **金額 (必須)**: `980`、通貨: `JPY`
   - **請求期間**: `毎月`
7. `商品を追加` ボタンをクリックして保存

### 2-3. 年額プランの料金を追加

月額プランの商品作成後、年額プランの料金を追加します。

1. 作成した `AIチャット Pro` の商品詳細画面を開く
2. 料金セクションの `+ 別の料金を追加` をクリック
3. **料金**:
   - `継続` を選択
   - **金額 (必須)**: `9800`、通貨: `JPY`
   - **請求期間**: `毎年`
4. 保存

### 2-4. 本プロジェクトのプラン構成

このプロジェクトでは教材としてシンプルな構成を採用:

- **無料プラン**: 基本的なAIチャット機能、クレジット10回分（初回のみ）
- **有料プラン**: AIチャット Pro
  - 月額: 980円/月 - 毎月100回分のクレジット付与
  - 年額: 9,800円/年（2ヶ月分無料相当） - 毎月100回分のクレジット付与

### 2-5. Price IDの控える

- Price詳細から `price_...` を取得
- この値を Supabase Edge Functions の `STRIPE_ALLOWED_PRICE_IDS` に設定する
- フロント実装では許可済みのPrice IDだけを送信する

---

## 3. Webhook設定手順

`stripe-billing-webhook` 関数は署名検証を実施するため、Webhook Secret の設定が必須です。

### 3-1. エンドポイント作成

1. `Developers` → `Webhooks`
2. `Add endpoint`
3. Endpoint URL を入力:
   - `https://<project-ref>.supabase.co/functions/v1/stripe-billing-webhook`
4. `Select events` で受信イベントを選択
5. 保存

### 3-2. 受信イベント（コードで処理しているもの）

以下を選択:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.paused`
- `customer.subscription.resumed`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.created`
- `customer.updated`

### 3-3. Signing secretを取得

1. 作成した Webhook endpoint の詳細画面を開く
2. `Signing secret`（`whsec_...`）をコピー
3. Supabase Edge Functions 環境変数 `STRIPE_WEBHOOK_SECRET` に設定

### 3-4. Stripeダッシュボード（Workbench）からのWebhook設定手順

Stripe の新しいダッシュボード UI では、`Workbench` タブからWebhookの送信先を管理します。

#### ステップ1: Workbench > Webhookタブを開く

1. Stripe Dashboard 左サイドバーの `ワークベンチ` をクリック
2. 上部タブから `Webhook` を選択
3. **イベントの送信先** 一覧が表示される
   - 既存の送信先がある場合はここに表示される（例: `http://127.0.0.1:54321/functions/v1/stripe-billing-webhook`）
   - 受信したイベント数も確認可能

#### ステップ2: 送信先を追加する

1. 右上の `+ 送信先を追加する` ボタンをクリック
2. ウィザード形式で3ステップの設定画面が開く:
   - **イベントを選択**
   - **送信先のタイプを選択する**
   - **送信先を設定する**

#### ステップ3: イベントを選択

1. **イベントのリッスン元**で `お客様のアカウント` を選択
   - 自分のアカウント内のリソースからイベントを受信する設定
   - 「連結アカウントと v2 アカウント」は Connect を利用する場合のみ
2. **APIバージョン**: デフォルトのまま（例: `2026-04-22.dahlia`）
3. **イベント**セクションで、リッスンするイベントを選択:
   - `すべてのイベント` タブから検索ボックスで絞り込み可能
   - `選択されているイベント` タブで選択済みイベントを確認
   - 本プロジェクトで必要なイベント（セクション 3-2 参照）:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.paused`
     - `customer.subscription.resumed`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.created`
     - `customer.updated`
4. `続行 →` をクリック

#### ステップ4: 送信先のタイプを選択する

1. `Webhook エンドポイント` を選択
2. `続行 →` をクリック

#### ステップ5: 送信先を設定する

1. **エンドポイント URL** を入力:
   - ローカル開発: `http://127.0.0.1:54321/functions/v1/stripe-billing-webhook`
   - 本番環境: `https://<project-ref>.supabase.co/functions/v1/stripe-billing-webhook`
2. 設定を確認して `送信先を作成` をクリック

#### 作成後の確認

- **イベントの送信先** 一覧に追加した送信先が表示される
- 送信先名の横にステータス（●）と受信イベント数が表示される
- `...` メニューから送信先の編集・削除が可能
- 送信先をクリックすると詳細画面が開き、**署名シークレット**（`whsec_...`）を取得できる

> **ローカル開発時の注意**: ローカルの Supabase にWebhookを転送する場合、Stripe CLI の `stripe listen` コマンドを使う方法が簡便です（セクション 5-2 参照）。Workbench から直接ローカルURLを指定する場合は、Stripe CLI でのポートフォワーディングが前提です。

---

## 4. Customer Portal設定

`create-billing-portal-session` 関数を使う場合、Stripeの Customer Portal を有効化しておく必要があります。

1. `Settings` → `Billing` → `Customer portal`
2. 未有効なら `Activate`
3. 要件に応じて設定
   - サブスクリプションキャンセル可否
   - プラン変更可否
   - 支払い方法更新可否
4. 保存

---

## 5. APIキーと環境変数の対応

### 5-1. STRIPE_SECRET_KEY の取得

1. Stripe Dashboard 左サイドバー下部の `APIキー` をクリック
2. **シークレットキー** の横にある `表示` をクリック
3. `sk_test_...`（テスト）または `sk_live_...`（本番）で始まるキーをコピー

> **注意**: 公開可能キー（`pk_test_...`）ではなくシークレットキーを使用してください。

### 5-2. STRIPE_WEBHOOK_SECRET の取得

取得方法は本番環境とローカル開発で異なります。

**本番環境（Stripe Dashboard から取得）:**

1. 左サイドバー `Workbench` > `Webhook` をクリック
2. 対象のエンドポイントを選択
3. **署名シークレット**（`whsec_...`）をコピー

**ローカル開発（Stripe CLI から取得）:**

1. Stripe CLI でリッスン開始:

   ```bash
   stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-billing-webhook
   ```

2. 出力に表示される `whsec_...` をコピー:

   ```text
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

### 5-3. Supabase Edge Functions に設定する環境変数

| 環境変数                    | 取得元                                                             |
| --------------------------- | ------------------------------------------------------------------ |
| `STRIPE_SECRET_KEY`         | Stripe Dashboard > APIキー > シークレットキー                      |
| `STRIPE_WEBHOOK_SECRET`     | Stripe Dashboard > Webhook > 署名シークレット（または Stripe CLI） |
| `SUPABASE_URL`              | Supabase Dashboard > Project Settings > API > Project URL          |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Project Settings > API > service_role key     |

---

## 6. テストモードと本番モードの運用注意

Stripe は Test と Live でデータが分離されます。

- Product / Price / Webhook はモードごとに個別作成が必要
- `price_...` は Test と Live で別ID
- Testの `price_...` を Live では使えない
- 切替時に `STRIPE_SECRET_KEY` と `STRIPE_WEBHOOK_SECRET` も Live 用へ差し替える

推奨順序:

1. Testモードで全導線を確認
2. Liveモードで同等設定を再作成
3. 環境変数をLive値へ更新
4. 本番フロー確認

---

## 7. 最低限の動作確認手順

1. `create-billing-checkout-session` を呼ぶ
   - Body: `priceId`, `successUrl`, `cancelUrl`
2. `checkoutUrl` が返ることを確認
3. Checkout 完了後、Webhook endpoint が 2xx を返すことを確認
4. DBが更新されることを確認
   - `billing_customers`
   - `billing_subscriptions`
   - `billing_webhook_events`
5. `create-billing-portal-session` を呼び、Portal URL が返ることを確認

---

## 8. 補足（実装依存の注意点）

- Checkout 作成時、未連携ユーザーは Stripe Customer を自動作成し、`supabase_user_id` を metadata に保持する実装
- Webhook 側は event の重複処理（idempotency）を `billing_webhook_events` で吸収する実装
- そのため、Webhook のイベント選択漏れや署名シークレット設定漏れがあると、サブスク状態同期が不完全になる
