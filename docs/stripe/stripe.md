# Stripe × Supabase 連携仕様（参考リファレンス）

以下は、外部テーブルの全リストです。

## Accounts（アカウント）

Stripe アカウントを表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Accounts     | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.accounts (
  id text,
  business_type text,
  country text,
  email text,
  type text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'accounts'
  );
```

### 注意事項

- WHERE 句では任意の列が使用可能ですが、`id` によるフィルタリングが最も効率的です
- `attrs` jsonb 列を使用して、追加のアカウント詳細にアクセスできます

## Balance（残高）

Stripe アカウントの現在の残高を表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Balance      | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.balance (
  balance_type text,
  amount bigint,
  currency text,
  attrs jsonb
)
  server stripe_server
  options (
    object 'balance'
  );
```

### 注意事項

- Balance は読み取り専用のオブジェクトで、Stripe アカウントの現在の資金を示します
- 残高はソースタイプ（例：カード、銀行口座）と通貨ごとに分類されます
- `attrs` jsonb 列を使用して、保留中の金額などの追加の残高詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、これはシングルトンオブジェクトのためフィルタリングオプションは制限されています

## Balance Transactions（残高取引）

Stripe アカウントを通じて移動する資金を表すオブジェクトです。残高取引は、Stripe アカウント残高に入金または出金されるすべてのタイプの取引に対して作成されます。

参照: Stripe ドキュメント

### 操作

| オブジェクト         | Select | Insert | Update | Delete | Truncate |
| -------------------- | ------ | ------ | ------ | ------ | -------- |
| Balance Transactions | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.balance_transactions (
  id text,
  amount bigint,
  currency text,
  description text,
  fee bigint,
  net bigint,
  status text,
  type text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'balance_transactions'
  );
```

### 注意事項

- 残高取引は、Stripe アカウントのすべての資金移動の読み取り専用レコードです
- 各取引には、金額、通貨、手数料、純額の情報が含まれます
- `attrs` jsonb 列を使用して、追加の取引詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `type`

## Charges（請求）

クレジットカードまたはデビットカードへの請求を表すオブジェクトです。個々の請求の取得や払い戻し、および全請求の一覧表示が可能です。請求は一意のランダム ID で識別されます。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Charges      | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.charges (
  id text,
  amount bigint,
  currency text,
  customer text,
  description text,
  invoice text,
  payment_intent text,
  status text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'charges'
  );
```

### 注意事項

- 請求は、Stripe アカウントの支払い取引の読み取り専用レコードです
- 各請求には、金額、通貨、顧客、支払いステータスの情報が含まれます
- `attrs` jsonb 列を使用して、追加の請求詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `customer`

## Checkout Sessions（チェックアウトセッション）

顧客が Checkout または Payment Links を通じて 1 回限りの購入やサブスクリプションの支払いを行う際のセッションを表すオブジェクトです。顧客が支払いを試みるたびに新しい Session を作成することを推奨します。

参照: Stripe ドキュメント

### 操作

| オブジェクト      | Select | Insert | Update | Delete | Truncate |
| ----------------- | ------ | ------ | ------ | ------ | -------- |
| Checkout Sessions | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.checkout_sessions (
  id text,
  customer text,
  payment_intent text,
  subscription text,
  attrs jsonb
)
  server stripe_server
  options (
    object 'checkout/sessions',
    rowid_column 'id'
  );
```

### 注意事項

- Checkout Sessions は、Stripe アカウントの顧客支払いセッションの読み取り専用レコードです
- 各セッションには、顧客、支払いインテント、サブスクリプションの情報が含まれます
- `attrs` jsonb 列を使用して、追加のセッション詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `customer`
  - `payment_intent`
  - `subscription`

## Customers（顧客）

Stripe の顧客を表すオブジェクトです。顧客の作成、取得、更新、削除が可能です。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Customers    | ✅     | ✅     | ✅     | ✅     | ❌       |

### 使用方法

```sql
create foreign table stripe.customers (
  id text,
  email text,
  name text,
  description text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'customers',
    rowid_column 'id'
  );
```

### 操作例

```sql
-- 新規顧客の作成
insert into stripe.customers(email, name, description)
values ('jane@example.com', 'Jane Smith', 'Premium customer');

-- 顧客の更新
update stripe.customers
set name = 'Jane Doe'
where email = 'jane@example.com';

-- 顧客の削除
delete from stripe.customers
where id = 'cus_xxx';
```

### 注意事項

- 顧客は SQL 操作を通じて作成、取得、更新、削除が可能です
- 各顧客にはメールアドレス、名前、説明を設定できます
- `attrs` jsonb 列を使用して、追加の顧客詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `email`

## Disputes（異議申立）

顧客がカード発行会社に対して請求に疑問を呈した場合に発生する異議申立を表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Disputes     | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.disputes (
  id text,
  amount bigint,
  currency text,
  charge text,
  payment_intent text,
  reason text,
  status text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'disputes'
  );
```

### 注意事項

- Disputes は、Stripe アカウントの顧客支払い異議申立の読み取り専用レコードです
- 各異議申立には、金額、通貨、請求、支払いインテントの情報が含まれます
- `attrs` jsonb 列を使用して、追加の異議申立詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `charge`
  - `payment_intent`

## Events（イベント）

Stripe アカウントで発生するイベントを表すオブジェクトです。何か興味深いことが起こったときに通知します。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Events       | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.events (
  id text,
  type text,
  api_version text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'events'
  );
```

### 注意事項

- Events は、Stripe アカウントのアクティビティの読み取り専用レコードです
- 各イベントには、タイプ、API バージョン、タイムスタンプの情報が含まれます
- `attrs` jsonb 列を使用して、追加のイベント詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `type`

## Files（ファイル）

Stripe のサーバー上でホストされているファイルを表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Files        | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.files (
  id text,
  filename text,
  purpose text,
  title text,
  size bigint,
  type text,
  url text,
  created timestamp,
  expires_at timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'files'
  );
```

### 注意事項

- Files は、Stripe サーバー上でホストされているファイルの読み取り専用レコードです
- 各ファイルには、ファイル名、目的、サイズ、タイプ、URL の情報が含まれます
- ファイルには `expires_at` で指定された有効期限が設定される場合があります
- `attrs` jsonb 列を使用して、追加のファイル詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `purpose`

## File Links（ファイルリンク）

File オブジェクトの内容を Stripe 以外のユーザーと共有するために使用できるリンクを表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| File Links   | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.file_links (
  id text,
  file text,
  url text,
  created timestamp,
  expired bool,
  expires_at timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'file_links'
  );
```

### 注意事項

- File Links は、Stripe ファイルへの共有可能なアクセスを提供する読み取り専用レコードです
- 各リンクにはファイルへの参照と公開 URL が含まれます
- リンクは特定の時間に期限切れになるように設定できます
- `expired` ブール値を使用して、リンクが期限切れかどうかを確認できます
- `attrs` jsonb 列を使用して、追加のリンク詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `file`

## Invoices（請求書）

顧客が支払うべき金額を示す明細書を表すオブジェクトです。1 回限り、またはサブスクリプションから定期的に生成されます。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Invoices     | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.invoices (
  id text,
  customer text,
  subscription text,
  status text,
  total bigint,
  currency text,
  period_start timestamp,
  period_end timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'invoices'
  );
```

### 注意事項

- Invoices は、顧客が支払うべき金額の読み取り専用レコードです
- 各請求書には、顧客、サブスクリプション、ステータス、金額の情報が含まれます
- 請求書は `period_start` と `period_end` のタイムスタンプで請求期間を追跡します
- `attrs` jsonb 列を使用して、追加の請求書詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `customer`
  - `status`
  - `subscription`

## Mandates（マンデート）

顧客が支払い方法の引き落としを許可したことの記録を表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Mandates     | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.mandates (
  id text,
  payment_method text,
  status text,
  type text,
  attrs jsonb
)
  server stripe_server
  options (
    object 'mandates'
  );
```

### 注意事項

- Mandates は、顧客の支払い許可の読み取り専用レコードです
- 各マンデートには、支払い方法、ステータス、タイプの情報が含まれます
- `attrs` jsonb 列を使用して、追加のマンデート詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`

## Meters（メーター）

特定のイベントの使用量を追跡できる請求メーターを表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Meters       | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.billing_meter (
  id text,
  display_name text,
  event_name text,
  event_time_window text,
  status text,
  attrs jsonb
)
  server stripe_server
  options (
    object 'billing/meters'
  );
```

### 注意事項

- Meters は、請求におけるイベント使用量追跡のための読み取り専用レコードです
- 各メーターには、表示名、イベント名、時間枠の情報が含まれます
- `status` フィールドはメーターがアクティブかどうかを示します
- `attrs` jsonb 列を使用して、追加のメーター詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`

## Payment Intents（支払いインテント）

顧客からの支払いを収集するプロセスをガイドするオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト    | Select | Insert | Update | Delete | Truncate |
| --------------- | ------ | ------ | ------ | ------ | -------- |
| Payment Intents | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.payment_intents (
  id text,
  customer text,
  amount bigint,
  currency text,
  payment_method text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'payment_intents'
  );
```

### 注意事項

- Payment Intents は、支払い収集プロセスをガイドする読み取り専用レコードです
- 各インテントには、顧客、金額、通貨、支払い方法の情報が含まれます
- `created` タイムスタンプは支払いインテントが開始された日時を追跡します
- `attrs` jsonb 列を使用して、追加の支払いインテント詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `customer`

## Payouts（ payout）

Stripe から受け取った資金、または接続された Stripe アカウントの銀行口座やデビットカードへの payout を表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Payouts      | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.payouts (
  id text,
  amount bigint,
  currency text,
  arrival_date timestamp,
  description text,
  statement_descriptor text,
  status text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'payouts'
  );
```

### 注意事項

- Payouts は、資金移動の読み取り専用レコードです
- 各 payout には、金額、通貨、ステータスの情報が含まれます
- `arrival_date` は資金が利用可能になる日時を示します
- `statement_descriptor` は銀行の明細書に表示されます
- `attrs` jsonb 列を使用して、追加の payout 詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `status`

## Prices（価格）

複数の通貨と価格オプションを容易にするための製品の価格設定を表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Prices       | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.prices (
  id text,
  active bool,
  currency text,
  product text,
  unit_amount bigint,
  type text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'prices'
  );
```

### 注意事項

- Prices は、製品の価格設定を定義する読み取り専用レコードです
- 各価格には、通貨、単価、製品参照が含まれます
- `active` ブール値は価格が使用可能かどうかを示します
- `type` フィールドは価格モデル（例：1 回限り、定期）を指定します
- `attrs` jsonb 列を使用して、追加の価格詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `active`

## Products（製品）

Stripe で利用可能なすべての製品を表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Products     | ✅     | ✅     | ✅     | ✅     | ❌       |

### 使用方法

```sql
create foreign table stripe.products (
  id text,
  name text,
  active bool,
  default_price text,
  description text,
  created timestamp,
  updated timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'products',
    rowid_column 'id'
  );
```

### 注意事項

- 製品は作成、読み取り、更新、削除が可能です
- 各製品には、名前、説明、アクティブステータスが含まれます
- `default_price` は製品のデフォルトの Price オブジェクトにリンクします
- `updated` タイムスタンプは最終更新時刻を追跡します
- `attrs` jsonb 列を使用して、追加の製品詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `active`

## Refunds（払い戻し）

以前に作成されたがまだ払い戻されていない請求に対する払い戻しを表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Refunds      | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.refunds (
  id text,
  amount bigint,
  currency text,
  charge text,
  payment_intent text,
  reason text,
  status text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'refunds'
  );
```

### 注意事項

- Refunds は、請求の取り消しに関する読み取り専用レコードです
- 各払い戻しには、金額、通貨、ステータスの情報が含まれます
- `charge` および `payment_intent` フィールドは元の取引にリンクします
- `reason` フィールドは払い戻しの理由を提供します
- `attrs` jsonb 列を使用して、追加の払い戻し詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `charge`
  - `payment_intent`

## SetupAttempts（セットアップ試行）

SetupIntent の確認試行を表すオブジェクトで、成功と失敗の両方の試行を追跡します。

参照: Stripe ドキュメント

### 操作

| オブジェクト  | Select | Insert | Update | Delete | Truncate |
| ------------- | ------ | ------ | ------ | ------ | -------- |
| SetupAttempts | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.setup_attempts (
  id text,
  application text,
  customer text,
  on_behalf_of text,
  payment_method text,
  setup_intent text,
  status text,
  usage text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'setup_attempts'
  );
```

### 注意事項

- SetupAttempts は、支払い設定の確認試行に関する読み取り専用レコードです
- 各試行には、顧客、支払い方法、ステータスの情報が含まれます
- `setup_intent` フィールドは関連する SetupIntent にリンクします
- `usage` フィールドは意図された支払い方法の使用方法を示します
- `attrs` jsonb 列を使用して、追加の試行詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `setup_intent`

## SetupIntents（セットアップインテント）

将来の支払いのために顧客の支払い資格情報を設定および保存するプロセスをガイドするオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| SetupIntents | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.setup_intents (
  id text,
  client_secret text,
  customer text,
  description text,
  payment_method text,
  status text,
  usage text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'setup_intents'
  );
```

### 注意事項

- SetupIntents は、顧客の支払い資格情報を保存するための読み取り専用レコードです
- 各インテントには、顧客、支払い方法、ステータスの情報が含まれます
- `client_secret` はクライアント側の確認に使用されます
- `usage` フィールドは支払い方法の使用方法を示します
- `attrs` jsonb 列を使用して、追加のインテント詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `customer`
  - `payment_method`

## Subscriptions（サブスクリプション）

顧客の定期的な支払いスケジュールを表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト  | Select | Insert | Update | Delete | Truncate |
| ------------- | ------ | ------ | ------ | ------ | -------- |
| Subscriptions | ✅     | ✅     | ✅     | ✅     | ❌       |

### 使用方法

```sql
create foreign table stripe.subscriptions (
  id text,
  customer text,
  currency text,
  current_period_start timestamp,
  current_period_end timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'subscriptions',
    rowid_column 'id'
  );
```

### 注意事項

- サブスクリプションは作成、読み取り、更新、削除が可能です
- 各サブスクリプションには、顧客と通貨の情報が含まれます
- `current_period_start` と `current_period_end` は請求サイクルを追跡します
- `rowid_column` オプションにより変更操作が可能になります
- `attrs` jsonb 列を使用して、追加のサブスクリプション詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `customer`
  - `price`
  - `status`

## Tokens（トークン）

顧客から機密性の高いカード情報、銀行口座情報、または個人を特定できる情報（PII）を安全に収集する方法を表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Tokens       | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.tokens (
  id text,
  type text,
  client_ip text,
  created timestamp,
  livemode boolean,
  used boolean,
  attrs jsonb
)
  server stripe_server
  options (
    object 'tokens'
  );
```

### 注意事項

- Tokens は、安全なデータ収集のための読み取り専用の単回使用オブジェクトです
- 各トークンにはタイプ情報（card、bank_account、pii など）が含まれます
- `client_ip` フィールドはトークンが作成された場所を記録します
- `used` フィールドはトークンが使用済みかどうかを示します
- `attrs` jsonb 列を使用して、カードや銀行情報などのトークン詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `type`
  - `used`

## Top-ups（トップアップ）

Stripe 残高に資金を追加する方法を表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Top-ups      | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.topups (
  id text,
  amount bigint,
  currency text,
  description text,
  status text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'topups'
  );
```

### 注意事項

- Top-ups は、残高追加の読み取り専用レコードです
- 各トップアップには、金額と通貨の情報が含まれます
- `status` フィールドはトップアップの状態（例：succeeded、failed）を追跡します
- `attrs` jsonb 列を使用して、追加のトップアップ詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `status`

## Transfers（振替）

Connect の一部として Stripe アカウント間での資金移動を表すオブジェクトです。

参照: Stripe ドキュメント

### 操作

| オブジェクト | Select | Insert | Update | Delete | Truncate |
| ------------ | ------ | ------ | ------ | ------ | -------- |
| Transfers    | ✅     | ❌     | ❌     | ❌     | ❌       |

### 使用方法

```sql
create foreign table stripe.transfers (
  id text,
  amount bigint,
  currency text,
  description text,
  destination text,
  created timestamp,
  attrs jsonb
)
  server stripe_server
  options (
    object 'transfers'
  );
```

### 注意事項

- Transfers は、アカウント間の資金移動の読み取り専用レコードです
- 各振替には、金額、通貨、送金先の情報が含まれます
- `destination` フィールドは受取側の Stripe アカウントを識別します
- `attrs` jsonb 列を使用して、追加の振替詳細にアクセスできます
- WHERE 句では任意の列が使用可能ですが、以下によるフィルタリングが最も効率的です：
  - `id`
  - `destination`

## クエリプッシュダウンサポート

この FDW は WHERE 句のプッシュダウンをサポートしています。WHERE 句でフィルターを指定すると、Stripe API 呼び出しに渡されます。

例えば、以下のクエリ：

```sql
select * from stripe.customers where id = 'cus_xxx';
```

は、次の Stripe API 呼び出しに変換されます：`https://api.stripe.com/v1/customers/cus_xxx`

各オブジェクトでサポートされているフィルター列については、上記の外部テーブルドキュメントを参照してください。

## 制限事項

このセクションでは、この FDW を使用する際の重要な制限事項と考慮事項について説明します。

- 大量の結果セットでは、全データ転送が必要なためパフォーマンスが低下する可能性があります
- Webhook イベントとリアルタイム更新はサポートされていません
- API バージョンの不一致により、予期しないデータ形式の問題が発生する可能性があります
- これらの外部テーブルを使用したマテリアライズドビューは、論理バックアップ中に失敗する可能性があります

## 使用例

Stripe 外部テーブルの使用例をいくつか紹介します。

### 基本例

```sql
-- Stripe への API 呼び出しを減らすために、常にレコード数を制限してください
select * from stripe.customers limit 10;
select * from stripe.invoices limit 10;
select * from stripe.subscriptions limit 10;
```

### JSON 属性のクエリ

```sql
-- 請求書のアカウント名を抽出
select id, attrs->>'account_name' as account_name
from stripe.invoices where id = 'in_xxx';

-- 請求書の明細項目を抽出
select id, attrs#>'{lines,data}' as line_items
from stripe.invoices where id = 'in_xxx';

-- サブスクリプションのアイテムを抽出
select id, attrs#>'{items,data}' as items
from stripe.subscriptions where id = 'sub_xxx';
```

### データ変更

```sql
-- 挿入
insert into stripe.customers(email,name,description)
values ('test@test.com', 'test name', null);

-- 更新
update stripe.customers
set description='hello fdw'
where id = 'cus_xxx';

update stripe.customers
set attrs='{"metadata[foo]": "bar"}'
where id = 'cus_xxx';

-- 削除
delete from stripe.customers
where id = 'cus_xxx';
```

サブフィールドを持つオブジェクトに挿入するには、列名を API が要求するものと完全に一致させて外部テーブルを作成する必要があります。例えば、サブスクリプションオブジェクトを挿入するには、Stripe API ドキュメントに従って外部テーブルを次のように定義します。

```sql
-- データ挿入用のサブスクリプションテーブルを作成します。
-- 'customer' と 'items[0][price]' フィールドは必須です。
create foreign table stripe.subscriptions (
  id text,
  customer text,
  "items[0][price]" text  -- 列名は API POST リクエストで使用されます
)
  server stripe_server
  options (
    object 'subscriptions',
    rowid_column 'id'
  );
```

そして、以下のようにサブスクリプションを挿入できます：

```sql
insert into stripe.subscriptions(customer, "items[0][price]")
values ('cus_Na6dX7aXxi11N4', 'price_1MowQULkdIwHu7ixraBm864M');
```

この外部テーブルはデータ挿入専用であり、SELECT 文では使用できないことに注意してください。

---

_このページを GitHub で編集する_

### 役に立ちましたか？

- いいえ
- はい

## AI ツール

- Markdown としてコピー
- ChatGPT に質問
- Claude に質問

## このページの内容

- 準備
- Wrappers の有効化
- Stripe Wrapper の有効化
- 認証情報の保存（オプション）
- Stripe への接続
- スキーマの作成
- エンティティ
  - Accounts
  - Balance
  - Balance Transactions
  - Charges
  - Checkout Sessions
  - Customers
  - Disputes
  - Events
  - Files
  - File Links
  - Invoices
  - Mandates
  - Meters
  - Payment Intents
  - Payouts
  - Prices
  - Products
  - Refunds
  - SetupAttempts
  - SetupIntents
  - Subscriptions
  - Tokens
  - Top-ups
  - Transfers
- クエリプッシュダウンサポート
- 制限事項
- 使用例
  - 基本例
  - JSON 属性のクエリ
  - データ変更

### サポートが必要ですか？

- サポートに問い合わせる
- 最新の製品アップデートを見る（Changelog を参照）
- 何かがおかしい？（システムステータスを確認）
