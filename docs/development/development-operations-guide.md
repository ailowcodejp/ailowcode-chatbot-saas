# 制作環境

**Next.js / TypeScript / App Router / Tailwind CSS / Supabase 案件向け**
**main 単一ブランチ運用版**

## 関連ドキュメント

- 環境構築: `docs/environment-setup-guide.md`
- 新規プロジェクト開始: `docs/new-project-setup-guide.md`
- 機能追加・修正フロー: `docs/feature-development-guide.md`
- フォルダ構成: `docs/coding-guide/11_nextjs-folder-structure-guide.md`

---

## **1. このマニュアルの目的**

このマニュアルは、Next.js と Supabase を利用する案件において、開発開始から日常開発、レビュー、マージ、リリースまでの基本運用を統一するためのものです。

このプロジェクトでは、**main を唯一の基準ブランチ**として扱います。

長く生きる develop ブランチは作らず、すべての変更は main から作業ブランチを切って進め、**Pull Request（PR）** を通して main に統合します。

この運用の目的は、変更を小さく保ち、レビューしやすくし、常に main を信頼できる状態に保つことです。

---

## **2. 前提技術スタック**

- フロントエンド: **Next.js**
- 言語: **TypeScript**
- ルーティング: **App Router**
- スタイリング: **Tailwind CSS**
- BaaS: **Supabase**
- デプロイ:**Cloudflare**

### **Next.js デプロイの補足**

Next.js は静的出力にも対応していますが、Supabase Auth やサーバー側処理を利用する案件では、**サーバー実行可能な Next.js デプロイ**を前提に考えるほうが安全です。

---

## **3. この案件の基本ルール**

この案件では、以下を基本ルールとします。

- main が唯一の基準ブランチ
- 作業は必ず main からブランチを切る
- main へ直接 push しない
- 変更は PR を通して main にマージする
- 作業ブランチは短命に保つ
- 1つの PR に変更を詰め込みすぎない
- 口頭ルールではなく、GitHub のブランチ保護設定で main への直接 push を禁止する
- CI を通過していない変更は main に入れない

### **初回セットアップ時の重要事項**

このマニュアルでは、**初回セットアップ時も main へ直接 push しません**。

最初のアプリ生成や初期設定も、必ず作業ブランチを切って PR 経由で main に統合します。

これにより、以下のルールを初回から例外なく一貫して運用できます。

- main へ直接 push しない
- main は常にレビュー済み・確認済みの状態を保つ

---

## **4. 使用ツールの標準方針**

この案件では、チーム内の手順差異を減らすため、以下を標準とします。

- GitHub 接続方式: **HTTPS**
- GitHub 認証: **GitHub CLI**
- エディター: **Visual Studio Code**
- Node.js: **22.13.0以上**
- パッケージマネージャー: **pnpm**

### **package manager 方針**

このマニュアルでは、**pnpm を標準パッケージマネージャー**として扱います。

pnpm / yarn / npm を混在させないでください。

pnpm のバージョンは `package.json` の `packageManager` で固定します。

```json
{
	"packageManager": "pnpm@11.1.1"
}
```

pnpm 自体の実行要件も合わせて固定するため、Node.js の最低バージョンは `engines.node` に明示します。

```json
{
	"engines": {
		"node": ">=22.13.0"
	}
}
```

理由は以下のとおりです。

- 新人が手順を追いやすい
- lockfile の混在を防げる
- CI / 本番環境の再現性が上がる
- 手順書を単純化できる

---

## **5. 開発開始前に準備するもの**

この案件では、最低限以下をローカル PC に入れてから作業を開始します。

- **Git**
- **Node.js**
- **Visual Studio Code**
- **GitHub CLI**
- **Docker Desktop または Docker 互換環境**
- **Supabase CLI**

### **Supabase CLI の補足**

Supabase CLI は、ローカル開発環境、マイグレーション、型生成、接続確認などに使います。

ローカル Supabase を起動する場合、CLI は Docker コンテナを使ってローカルスタックを立ち上げます。

### **Supabase CLI の方針**

このマニュアルでは、**Supabase CLI をアプリの pnpm dev dependency としてプロジェクトごとに管理します**。

つまり、Supabase CLI は開発者マシンにグローバルインストールするのではなく、各プロジェクトの `package.json` の `devDependencies` に含めます。

```bash
pnpm install supabase --save-dev
```

インストール後、以下のコマンドでCLIが利用できることを確認します。

```bash
pnpm exec supabase --help
```

このとき、Supabase CLIのインストールを求められず、CLIのヘルプ情報が表示されれば正常にインストールできています。

---

#### **この方針を採用する理由**

Supabase CLIはアプリ本体の実行依存ではありませんが、ローカル開発・DBマイグレーション・型生成・Edge Functions・リモート環境との同期など、プロジェクトの開発体験に強く関わるツールです。

そのため、チーム開発では開発者マシンごとのグローバル環境に依存させるより、**プロジェクト単位でCLIのバージョンを固定する**方が安全です。

理由は以下のとおりです。

- チームメンバー間でSupabase CLIのバージョン差分を減らせる
- 複数プロジェクトを扱う場合でも、プロジェクトごとに適切なCLIバージョンを使える
- CI環境でもローカル開発環境と同じCLIバージョンを使いやすい
- `supabase db diff` / `supabase db reset` / `supabase db push` などの挙動を揃えやすい
- 新しいメンバーの環境構築手順をシンプルにできる
- `pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` により、CLIのバージョンを明示的に管理できる

**同様に、pnpm自体もプロジェクトごとの管理を推奨します**:

```bash
# プロジェクトごとにpnpmをインストール（推奨）
pnpm install

# Supabase CLIをプロジェクトに追加
pnpm add -D supabase

# 実行
pnpm exec supabase --help
```

これにより、開発ツール全体をプロジェクト単位で一貫して管理できます。

---

#### **事前に必要なもの**

Supabase CLIを利用する前に、以下が利用できることを確認してください。

```bash
node -v
```

Node.js は **22.13.0以上** を推奨します。

また、ローカルのSupabaseインスタンスを起動するにはDockerが必要です。

```bash
docker --version
docker compose version
```

---

#### **推奨する使い方**

CLIを直接実行する場合は、以下のように `pnpm exec` 経由で実行します。

```bash
pnpm exec supabase init
pnpm exec supabase start
pnpm exec supabase db reset
```

チーム開発では、よく使うコマンドを `package.json` の `scripts` にまとめることを推奨します。

```json
{
	"scripts": {
		"supabase": "supabase",
		"db:start": "supabase start",
		"db:stop": "supabase stop",
		"db:reset": "supabase db reset",
		"db:diff": "supabase db diff",
		"db:push": "supabase db push",
		"gen:types": "supabase gen types typescript --local > src/types/database.types.ts"
	},
	"devDependencies": {
		"supabase": "^2.x.x"
	}
}
```

実行例：

```bash
pnpm db:start
pnpm db:reset
pnpm gen:types
```

## **6. GitHub 認証方針**

この案件では、GitHub への接続方法を **HTTPS** に統一します。

認証は **GitHub CLI** を標準とします。

### **標準手順**

```bash
gh auth login
gh auth status
```

### **禁止事項**

- SSH で GitHub 接続する
- メンバーごとに認証方式を変える
- GitHub のパスワードで Git 認証しようとする
- 手元の場当たり的な認証方法を各自で増やす

---

## **7. 新規プロジェクト開始手順**

この案件では、先に GitHub 上で空のリポジトリを作成し、その後ローカルへ clone し、clone 済みディレクトリ直下に Next.js アプリを作成します。

### **7-1. GitHub で空リポジトリを作成する**

### **手順**

1. GitHub にログインする
2. **New repository** を押す
3. リポジトリ名を入力する
4. 通常案件では **Private** を選ぶ
5. README / .gitignore / License は追加しない
6. **Create repository** を押す

### **空リポジトリで始める理由**

最初に GitHub 側で README を入れると、ローカル初期化時に不要な競合が起きやすくなるため、特別な理由がなければ空リポジトリで始めます。

### **7-2. GitHub CLI でログインする**

```bash
gh auth login
gh auth status
```

### **7-3. リポジトリをローカルに clone する**

```bash
git clone <https://github.com/your-org/your-project.git>
cd your-project
```

この案件では SSH URL は使いません。

必ず HTTPS URL を使います。

### **7-4. 現在のブランチを確認する**

```bash
git branch
git status
```

通常は main が既定ブランチです。

このマニュアルでは、organization 側で既定ブランチ名を main に統一している前提で運用します。

### **7-5. Next.js プロジェクトを作成する**

新規の Next.js + Supabase 案件では、原則としてチーム標準のスターター、または実運用に耐える初期構成を利用します。

このとき、with-supabase テンプレートは**参考開始手順の1つ**として扱います。

つまり、必須ではありません。

### **実運用で優先すべき考え方**

新規案件の開始時は、単に画面が立ち上がることだけでなく、以下の観点を最初から意識してください。

- App Router 前提の構成になっているか
- ESLint / TypeScript が有効か
- 環境変数管理がしやすいか
- Supabase 接続の責務分離がしやすいか
- CI に乗せやすい構成か
- 将来の認証・RLS・型生成を組み込みやすいか
- 不要なサンプルコードが多すぎないか

### **参考開始手順の例**

clone 済みリポジトリ直下で、次のように実行できます。

```bash
pnpm dlx create-next-app@latest -e with-supabase .
```

### **create-next-app の重要事項**

末尾の . を付けて、現在のディレクトリにアプリを作成します。

これを書かないと、別ディレクトリが作られ、clone 済み repo 配下の構成がずれやすくなります。

### **テンプレート選定の補足**

社内標準スターターや既存テンプレートがある場合は、それを優先して構いません。

このマニュアルでは、with-supabase を新規案件の参考開始手順として位置づけますが、実運用では次の条件を満たすことのほうが重要です。

- チーム全員が同じ開始構成を再現できる
- 不要な差分が少ない
- 本番運用へ無理なく拡張できる
- 認証・DB・型生成・CI を組み込みやすい

### **7-6. VS Code でプロジェクトを開く**

```bash
code .
```

最低限、次を確認してください。

- プロジェクトフォルダが開けている
- ターミナルが使える
- Source Control タブで Git 差分が見える
- TypeScript / ESLint のエラーが見える
- 必要な拡張機能が入っている

### **推奨拡張**

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitHub Pull Requests and Issues
- EditorConfig（必要なら）

### **7-7. 初回セットアップ用ブランチを作成する**

初回セットアップも main へ直接 push せず、作業ブランチを作成して進めます。

```bash
git switch -c chore/initial-setup
```

### **7-8. 初回コミット**

初期生成と最低限の初期設定が終わったら、最初のコミットを行います。

```bash
git add .
git commit -m "chore: initialize Next.js project"
git push -u origin chore/initial-setup
```

その後、chore/initial-setup → main の PR を作成し、レビュー後にマージします。

---

## **8. main ブランチの保護設定**

この運用では main が本番基準ブランチです。

### **推奨設定**

- main への直接 push を禁止
- PR 経由でのみマージ可能にする
- レビュー必須にする
- CI 成功を必須にする

### **推奨する追加方針**

- 原則として **1件以上の承認** を必須にする
- 重要変更では **作成者以外の承認** を必須にする
- Draft PR を活用し、レビュー準備前の PR を明確にする

### **なぜ必要か**

口頭ルールだけでは防げません。

GitHub 側の設定で強制することが重要です。

---

## **9. CI の標準項目**

この案件では、main にマージする前提として CI 通過を必須にします。

CI では、ローカルと同じ pnpm を使うために `package.json` の `packageManager` を必ず設定します。`pnpm/action-setup@v4` は `version` 指定または `packageManager` がないと失敗します。

また、pnpm のバージョンによって必要な Node.js バージョンが変わります。このプロジェクトでは `pnpm@11.1.1` を使うため、GitHub Actions では Node.js 22 系を使います。

### **最低限の標準項目**

- pnpm install --frozen-lockfile
- pnpm run lint
- pnpm run build
- pnpm exec opennextjs-cloudflare build

### **GitHub Actions の最低構成**

```yaml
- uses: pnpm/action-setup@v4
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: "pnpm"
- run: pnpm install --frozen-lockfile
- run: pnpm run lint
- run: pnpm run build
- run: pnpm exec opennextjs-cloudflare build
```

### **CI 失敗時に最初に見るポイント**

- `Error: No pnpm version is specified.` が出ていないか
- `package.json` に `packageManager` があるか
- `This version of pnpm requires at least Node.js v22.13` が出ていないか
- `.github/workflows/ci.yml` の `node-version` が pnpm の要求を満たしているか
- ローカルで `pnpm install --frozen-lockfile` / `pnpm run lint` / `pnpm run build` / `pnpm exec opennextjs-cloudflare build` が通るか

### **実装時に追加する項目**

- テストランナーを導入した場合は `pnpm run test`
- 型チェック用スクリプトを追加した場合はそのスクリプト
- E2E テストを導入した場合は E2E 実行
- DB migration を追加した場合は migration 整合性チェック

### **build を標準採用する理由**

このマニュアルでは、CI 必須にするなら **build は標準採用** とします。

理由は、Next.js 案件ではローカル開発中に見えない問題が build 時に初めて表面化することが多いためです。

たとえば以下のような問題は、build で初めて検出されやすいです。

- App Router の構成不備
- サーバー実行時の import 問題
- 環境変数の不足
- Server Component / Client Component の不整合
- 本番ビルド時だけ発生する型・参照エラー

---

## **10. 依存関係インストールの基本方針**

pnpm install と pnpm install --frozen-lockfile は使いどころを分けます。

### **開発者ローカルで使うもの**

- 初回セットアップ
- 新しい依存追加後
- package-lock.json が更新された後の通常作業

```bash
pnpm install
```

### **CI や再現性重視の確認で使うもの**

- CI
- クリーン環境での検証
- lockfile ベースで依存を厳密に再現したいとき

```bash
pnpm install --frozen-lockfile
```

### **基本方針**

- **ローカルの日常作業では pnpm install**
- **CI では pnpm install --frozen-lockfile**
- lockfile を壊さないことを優先する

---

## **11. Supabase クラウドプロジェクトとローカル開発環境の初期セットアップ**

この案件では、Next.js 側の Supabase 連携用ひな形だけではなく、クラウド側のプロジェクト作成・ローカル開発環境・マイグレーション管理・型生成運用まで含めて整備することを前提にします。

この章では、次の内容を扱います。

- Supabase クラウドプロジェクトを作成する
- Supabase CLI を利用できるようにする
- Supabase CLI で認証する
- Supabase プロジェクトを link する
- ローカル Supabase を初期化する
- ローカル Supabase を起動する
- Project URL やキーを確認する
- .env.local を設定する
- 接続確認を行う
- 型生成を行う

### **11-1. Supabase クラウドプロジェクトを作成する**

まず Supabase で新しいプロジェクトを作成します。

### **Supabase クラウドプロジェクト作成手順**

1. Supabase にログインする
2. 新しいプロジェクトを作成する
3. 組織を選ぶ
4. プロジェクト名を入力する
5. リージョンを選ぶ
6. データベースパスワードを設定する

### **実務上の考え方**

新人や通常案件では、まず **Supabase ダッシュボードから手動作成** に統一したほうが分かりやすいです。

Management API を使った自動作成は、複数環境をコードでまとめて作りたくなった段階で検討します。

### **11-2. Supabase CLI を使える状態にする**

Supabase CLI はアプリ依存ではなく、開発用ツールとして利用します。

### **CLI 動作確認例**

```bash
pnpm exec supabase --help
```

または、チームの導入方法に応じた確認コマンドを使ってください。

### **CLI 導入方法の重要事項**

このマニュアルでは、CLI を使えることが重要であり、package.json に依存として含めることは前提にしません。

### **11-3. Supabase CLI でログインする**

クラウドプロジェクトとの連携や型生成で --linked を使う場合は、先に CLI 認証を行います。

```bash
pnpm exec supabase login
```

### **11-4. Supabase プロジェクトを link する**

既存のクラウドプロジェクトをこのローカルプロジェクトに紐付けます。

```bash
pnpm exec supabase link
```

### **supabase link の補足**

- supabase gen types … --linked を使う場合は、通常この link が前提になります
- どのクラウドプロジェクトに接続しているかを意識せず操作すると、誤った環境に対して操作する事故が起きやすくなります

### **11-5. ローカル Supabase を使う場合だけ supabase initを行う**

ここは誤解しやすいポイントです。

- create-next-app やテンプレート導入 → Next.js 側のアプリひな形を作る
- supabase init → ローカル Supabase 開発用の設定ファイルを作る

つまり、役割が別です。

### **結論**

- クラウド Supabase だけ使う場合は supabase init は必須ではない
- ローカル Supabase も使う場合は supabase init が必要

ローカル Supabase を使う場合は、プロジェクト内で次を実行します。

```bash
pnpm exec supabase init
```

これを実行すると、プロジェクト内に supabase/ フォルダが作成されます。

このフォルダには、Supabase CLI がローカル環境を管理するための設定が入ります。

### **例**

- supabase/config.toml
- supabase/migrations/
- その他ローカル実行用ファイル

### **supabase/ フォルダの重要事項**

この supabase/ フォルダは、リポジトリの一部としてコミット対象にします。

### **11-6. ローカル Supabase を起動する**

ローカル Supabase を使う場合は、初期化後に次を実行します。

```bash
supabase start
```

これで、ローカルマシン上に Supabase の各サービスが立ち上がります。

起動時の出力には、今後使う重要な情報が表示されます。

- API URL
- anon key / publishable key 相当の情報
- service role key
- Studio URL
- DB 接続情報

ローカルの接続情報は、あとから次のコマンドでも再確認できます。

```bash
pnpm exec supabase status
```

### **11-7. ローカル開発環境を使う理由**

Supabase のクラウドプロジェクトだけで開発を進めることも不可能ではありません。

しかし、実務ではローカル環境も持っておいたほうが安全です。

### **理由**

- デプロイ前にローカルで試せる
- テーブルやポリシー変更を先に検証できる
- 本番や共有環境を汚しにくい
- ネットワークや環境依存の問題を切り分けやすい

この案件では、クラウド Supabase とローカル Supabase の両方を使える状態にしておく考え方を推奨します。

### **11-8. 複数プロジェクトを扱うときの基本方針**

複数案件で Supabase を使う場合、ローカルインスタンスの扱いで迷いやすいです。

この案件では、基本的に **start-stop 方式** を推奨します。

プロジェクト A 側で停止:

```bash
pnpm exec supabase stop
```

プロジェクト B 側で起動:

```bash
pnpm exec supabase start
```

この方式なら、同時に複数インスタンスを常駐させずに済むので、PC リソースを無駄に使いにくいです。

### **11-9. .env.localに接続情報を設定する**

Supabase に接続するための環境変数を .env.local に設定します。

まずはクラウド Supabase を使う場合の例です。

```text
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

### **.env.local の補足**

新規案件では、まず **Publishable key ベース**で考える方針にします。

### **注意**

- NEXT*PUBLIC* が付いた値は公開前提
- クライアント側に出してはいけない値は入れない
- .env.local は Git に含めない

### **11-10. サーバー側専用キーの扱い**

サーバー側限定で強い権限が必要な場合は、別途サーバー専用の環境変数を設定します。

```text
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### **重要ルール**

- SUPABASE_SERVICE_ROLE_KEY はブラウザ側で使わない
- Client Component に渡さない
- フロントエンドから直接参照しない
- サーバー処理限定で使う

### **11-11. 接続確認の方針**

接続確認は、案件で利用予定の機能に合わせて行うことを基本とします。

### **Auth を使う案件**

以下を通して、認証フローが正常に動くかを確認します。

- サインアップ
- ログイン
- セッション取得
- ログアウト

### **Auth をまだ使わない案件**

以下など、案件で最初に使う機能に応じて確認します。

- サーバー側での接続確認
- 最小限の DB read/write
- Storage の一覧取得やアップロード確認

### **11-12. Auth の初期設定を確認する**

Auth を使う案件では、接続確認の前に Supabase 側で以下を見ておきます。

- Email 認証を使うか
- Confirm email を有効にするか
- 開発中はどこまで簡易化するか
- Redirect URL が正しいか
- Site URL が正しいか

### **11-13. 接続確認時に見るポイント**

### **新規登録**

- エラーなくユーザー作成できるか
- 期待どおりのレスポンスが返るか
- Email confirmation が必要な設定なら、その挙動が想定どおりか

### **ログイン**

- 正しいメールアドレスとパスワードでログインできるか
- セッションが作成されるか
- ログイン後の画面遷移が想定どおりか

### **ログアウト**

- セッションが破棄されるか
- 保護ページに未ログイン状態でアクセスできなくなるか

### **11-14. 接続トラブル時の確認ポイント**

### **1. .env.localの値が正しいか**

- URL を間違えていないか
- キーをコピーし間違えていないか
- 余計な空白や改行が入っていないか

### **2. ローカル Supabase を使うなら起動しているか**

```Bash
supabase status
```

必要なら再起動します。

```Bash
supabase start
```

### **3. RLS とポリシーが正しいか**

- RLS を有効にしただけで止まっていないか
- 必要な policy を追加したか

### **4. 接続先がクラウドなのかローカルなのか混ざっていないか**

- .env.local がクラウド URL なのか
- ローカル URL なのか
- チームでどちらを見ているのか

### **11-15. 型生成を標準運用に含める**

この案件では、Supabase の型生成を標準運用に含めることを推奨します。

DB スキーマ変更時は、マイグレーションだけでなく型も更新します。

### **型生成コマンドの例**

```bash
pnpm exec supabase gen types typescript --linked > src/types/database.types.ts
```

または、ローカル DB に対して生成する場合は、プロジェクト構成に応じて対象を調整します。

### **型生成を行う理由**

- TypeScript での型安全性を高める
- テーブル定義変更の影響をコード上で検知しやすくする
- フロントエンドとバックエンドの認識ずれを減らす

### **運用ルール**

- DB スキーマ変更時は migration と型更新をセットで扱う
- PR に型更新の有無を明記する
- 型生成ファイルの置き場所をチームで固定する

---

## **12. Supabase マイグレーション運用の基本**

Supabase 案件では、DB 変更をダッシュボード上の手作業だけで終わらせず、**migration として Git 管理する**ことを原則とします。

### **12-1. 基本方針**

- テーブル追加・変更・削除は migration で管理する
- RLS や policy 変更も migration に含める
- 本番 DB に手作業だけで差分を入れない
- 緊急対応で手作業変更した場合も、必ず後から migration に戻す

### **12-2. migration 作成の考え方**

DB に関わる変更を行うときは、変更内容を明確に分けて扱います。

### **migration 対象の例**

- テーブル新規作成
- カラム追加
- インデックス追加
- RLS 有効化
- policy 追加
- seed 更新

### **12-3. migration 作成例**

```bash
pnpm exec supabase migration new create_profiles_table
```

作成後、生成された SQL ファイルに必要な変更を書きます。

### **12-4. ローカルでの反映・確認**

ローカル Supabase を使っている場合は、migration 反映後に以下を確認します。

- 想定どおりにテーブルが作られるか
- RLS / policy が正しく動くか
- アプリコードが新スキーマと一致しているか
- 型生成が更新されているか

### **12-5. 破壊的変更の扱い**

以下のような変更は通常変更より慎重に扱います。

- カラム削除
- テーブル削除
- 制約変更
- データ形式変更
- 大幅な RLS / policy 変更

このような変更を含む場合は、PR 上で明示し、必要なら別途レビューや反映手順書を用意します。

---

## **13. 標準ディレクトリ方針**

Next.js App Router プロジェクトのフォルダ構成は、`docs/coding-guide/11_nextjs-folder-structure-guide.md` を正式な管理方針とします。

案件固有の事情で変更する場合も、同ガイドの基本方針を基準にして、変更理由をプロジェクトの管理ドキュメントに残してください。

### **標準ディレクトリ構成の例**

```text
public/
tests/
supabase/
  migrations/
  seed.sql
  config.toml
src/
  app/
  components/
    ui/
    layout/
  features/
  hooks/
  lib/
    supabase/
      client.ts
      server.ts
      admin.ts
  config/
  types/
  styles/
.env.example
```

> [!warning]
> Next.js 16 では `middleware.ts` は非推奨です。新規プロジェクトでは作成せず、必要に応じて `proxy` を使用してください。

### **よくある役割**

- `src/app/` App Router のルーティング、layout、page、route handler
- `src/components/` 複数機能で使う共通 UI コンポーネント
- `src/features/` 認証、課金、ダッシュボードなどの業務機能単位の実装
- `src/lib/supabase/` Supabase クライアント生成処理
- `src/types/` 型生成ファイル、共通型定義
- `supabase/` ローカル開発やマイグレーション管理用

---

## **14. 環境変数の管理**

Next.js / Supabase 案件では、環境変数の扱いがかなり重要です。

### **14-1. .gitignore**

最低限、以下は入れておきます。

```PlainText
.env
.env.local
.env.development.local
.env.production.local
node_modules/
.next/
.DS_Store
coverage/
```

### **14-2. .env.example**

.env.example にはダミー値だけを書く運用にします。

```Bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### **.env.example の注意点**

本物のキーをコピーしてから伏字にする運用は、消し忘れ事故が起きやすいので避けます。

---

## **15. Supabase の基本方針**

Supabase を使う案件では、最初に以下をチームで固定しておくべきです。

### **決めておくこと**

- 認証を使うか
- Storage を使うか
- Edge Functions を使うか
- マイグレーションを Git 管理するか
- 型生成を行うか

### **実務上のおすすめ**

- DB スキーマ変更はマイグレーション管理する
- 型生成を使う
- RLS を前提に設計する
- service role key を通常画面実装に混ぜない

---

## **16. 日常の開発フロー**

毎回の作業は、必ず最新の main を取得してから始めます。

### **16-1. mainを最新化する**

```Bash
git switch main
git pull origin main
```

### **16-2. 作業ブランチを作成する**

```bash
git switch -c feature/add-auth-pages
```

### **ブランチ命名規則**

この案件では、ブランチ名を次のように整理します。

- feature/…
- fix/…
- docs/…
- chore/…
- refactor/…

### **命名ルール**

- 英小文字を使う
- 単語区切りはハイフン - を使う
- スペースは使わない
- 日本語ブランチ名は使わない
- 何をするブランチか見て分かる名前にする

### **ブランチ名の例**

- feature/add-auth-pages
- feature/create-dashboard
- feature/add-supabase-storage
- fix/login-redirect
- fix/rls-policy-bug
- docs/setup-manual
- chore/update-env-example
- refactor/split-supabase-client

---

## **17. 実装作業の進め方**

Next.js / Supabase 案件では、変更が複数レイヤーにまたがりやすいので、1つの作業ブランチに詰め込みすぎないことが大切です。

### **典型的な変更対象**

- `src/app/` のページ・Route Handler 追加
- Server Component / Client Component の整理
- `src/lib/supabase/` の Supabase クライアント作成
- `src/features/` の業務機能単位の認証処理
- DB クエリ追加
- Storage 連携
- SQL マイグレーション追加
- 環境変数更新
- 型生成更新

### **17-1. 変更内容を確認する**

```Bash
git status
git diff
```

特に確認すべきもの:

- .env.local を誤って含めていないか
- .next/ を含めていないか
- 一時デバッグコードを残していないか
- migration ファイルを入れ忘れていないか
- 型生成ファイルを更新し忘れていないか

### **17-2. ステージングする**

```Bash
git add .
```

必要に応じて個別追加にします。

```Bash
git add src/app/login/page.tsx
git add src/lib/supabase/client.ts
git add src/types/database.types.ts
git add supabase/migrations/20260401_create_profiles.sql
```

### **補足**

git add . を使う場合でも、**必ず事前に git status / git diff を確認**してください。

特に慣れないうちは、重要ファイルは個別に git add するほうが安全です。

### **17-3. コミットする**

```Bash
git commit -m "feat: add Supabase auth pages"
```

### **よい分け方**

以下を1コミットに全部混ぜないようにします。

- UI 追加
- DB スキーマ変更
- 認証処理追加
- 型更新
- ドキュメント更新

---

## **18. ローカル確認の基本**

PR を出す前に、最低限このあたりは確認します。

```bash
pnpm install
pnpm run dev
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build
```

### **Next.js / Supabase 案件で追加確認したいもの**

- ログイン / ログアウト
- リダイレクト
- サーバー側データ取得
- 環境変数読み込み
- 本番 build 通過
- RLS で意図どおりにアクセス制御されるか
- migration 適用後に動作するか
- 型更新後に型エラーが出ていないか

---

## **19. pre-commit フック**

この案件では、**husky** と **lint-staged** による pre-commit フックを導入しています。

コミットを実行すると、コードチェックが先に走ります。**コードに問題がある場合はコミットが強制的にキャンセル**されます。lint エラーなどを修正するまでコミットできません。

### **仕組み**

- `husky` が Git の pre-commit フックを管理する
- `lint-staged` がステージングされたファイルのみに対してチェックを実行する
- チェックに失敗するとコミットがキャンセルされる

### **設定手順**

#### 1. huskyとlint-stagedをインストール

```bash
pnpm add -D husky lint-staged
```

#### 2. huskyを初期化

```bash
pnpm exec husky init
```

これにより、`.husky/` ディレクトリと `pre-commit` フックが作成されます。

#### 3. pre-commitフックを設定

`.husky/pre-commit` ファイルを以下のように編集します。

```bash
pnpm exec lint-staged
```

> [!note]
> husky v9 以降では、シェルスクリプトのヘッダー（`#!/usr/bin/env sh` や `. "$(dirname -- "$0")/_/husky.sh"`）は不要です。コマンドのみを記述します。

#### 4. lint-stagedを設定

`package.json` に `lint-staged` の設定を追加します。

```json
{
	"lint-staged": {
		"*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
		"*.{json,md}": ["prettier --write"]
	}
}
```

#### 5. フックを実行可能にする

```bash
chmod +x .husky/pre-commit
```

### **使用方法**

設定後、以下のコマンドでコミット時に自動チェックが実行されます。

```bash
git add .
git commit -m "feat: add new feature"
```

lintエラーがある場合、コミットがキャンセルされます。エラーを修正してから再度コミットしてください。

### **フックを一時的に無効化する**

フックを一時的に無効化してコミットしたい場合は、`--no-verify` オプションを使用します。

```bash
git commit --no-verify -m "feat: add new feature"
```

ただし、これは緊急時のみ使用してください。

### **GUI ツール（Fork など）を使う場合の注意**

GUI ツールはターミナルを経由しないため、Node.js のパスが認識されずフックが実行されないことがあります。

`~/.config/husky/init.sh` を作成し、Node.js のパスを明示的に設定することで解消できます。

nvm を使っている場合の例：

```bash
# ~/.config/husky/init.sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

シェルの設定ファイルをそのまま読み込む場合：

```bash
# ~/.config/husky/init.sh
. ~/.zshrc
```

---

## **20. Pull Request を作成する**

作業ブランチを push します。

```Bash
git push -u origin feature/add-auth-pages
```

その後、GitHub 上で feature/\* → main の PR を作成します。

### **PR プレビュー**

`pnpm run preview` を実行し、Cloudflare Workers ランタイム上でブラウザ確認を行ってください。

### **PR に書くとよい内容**

- 何を追加・変更したか
- DB 変更があるか
- 環境変数追加があるか
- 動作確認項目
- migration 適用が必要か
- レビューで見てほしいポイント

### **Next.js / Supabase 案件では特に書くべきこと**

- RLS policy の追加有無
- Storage bucket の追加有無
- Edge Function の有無
- .env.example 更新有無
- 型生成更新有無
- 破壊的変更の有無

### **推奨セルフチェック**

- pnpm run lint 実行済み
- pnpm run build 実行済み
- pnpm exec opennextjs-cloudflare build 実行済み
- migration 追加漏れなし
- 型生成更新漏れなし
- .env.local など秘密情報の混入なし

---

## **21. マージ後の作業**

PR が main にマージされたら、ローカルを更新します。

```Bash
git switch main
git pull origin main
```

不要になったブランチは削除します。

```Bash
git branch -d feature/add-auth-pages
git push origin --delete feature/add-auth-pages
```

---

## **22. リリース運用**

このマニュアルでは、常に main が本番基準です。

未マージの feature ブランチは本番対象ではありません。

### **22-1. リリース前にやること**

```Bash
git switch main
git pull origin main
pnpm install
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build
```

### **Supabase が関係する場合**

- 必要な migration が揃っているか確認
- 本番 Supabase プロジェクトの環境変数が設定済みか確認
- SUPABASE_SERVICE_ROLE_KEY の置き場所がサーバー側のみか確認
- 本番反映前に必要な DB 変更手順が明文化されているか確認

### **22-2. DB 変更を含むリリース時の基本方針**

Supabase 案件では、アプリ本体のデプロイだけでなく、DB 変更の反映手順を明確にしておくことが重要です。

### **原則**

- DB スキーマ変更は migration として管理する
- 本番 DB へ手作業だけで差分を入れない
- ダッシュボードで緊急修正した場合も、必ず後から migration に戻す
- 破壊的変更は通常変更と同じ温度感で入れない

### **本番反映前に確認すること**

- どの migration が今回の対象か
- 破壊的変更が含まれていないか
- 既存データへの影響がないか
- アプリ側コードが新スキーマ前提になっていないか
- 反映順序が整理されているか

### **基本的な反映順序**

1. 本番 DB 変更内容を確認する
2. migration を本番へ適用する
3. 必要な環境変数を確認する
4. アプリを本番反映する
5. 主要機能を確認する

### **rollback の考え方**

DB 変更は、単純に Git の commit を戻すだけでは復旧できません。

そのため、rollback が必要な可能性がある場合は、元に戻すための migration を別で用意する前提で考えます。

### **22-3. 本番反映**

プロジェクトのホスティング方式に応じて、main を本番に反映します。

### **代表例**

- Cloudflare Workers へ `pnpm run deploy` でデプロイ
- Node.js サーバーへデプロイ
- Docker イメージとしてデプロイ

### **22-4. リリースタグ**

リリース後はタグを付けます。

```Bash
git switch main
git pull origin main
git tag release-2026-04-06
git push origin release-2026-04-06
```

### **タグ形式**

このマニュアルでは、リリースタグ形式を以下に統一します。

```Bash
release-YYYY-MM-DD
```

### **タグ形式の例**

- release-2026-04-06
- release-2026-04-07

### **リリースタグの補足**

同日に複数回リリースする運用がある場合は、必要に応じて以下へ拡張します。

- release-2026-04-06-01
- release-2026-04-06-02

---

## **23. Supabase ローカル開発を使う場合の注意**

- ローカル確認だけで満足せず、本番相当の環境変数でも確認する
- migration の適用漏れを防ぐ
- ローカルだけ動いて本番で落ちる差をなくす
- Auth の redirect URL や Site URL の設定を環境ごとに確認する
- ローカル DB とクラウド DB を混同しない
- 型生成の更新対象がローカル基準かクラウド基準かをチームで統一する

---

## **24. AI 生成成果物の扱い**

AI で生成したコードも、そのまま無条件で入れずにレビュー前提で扱います。

### **特に確認すること**

- Client Component にしすぎていないか
- サーバーで持つべき処理をクライアントに置いていないか
- 秘密情報をコードに埋め込んでいないか
- NEXT*PUBLIC* の付け方が誤っていないか
- Supabase key の使い分けが正しいか
- 不要な依存が増えていないか
- RLS を無視した実装になっていないか
- use client の付けすぎがないか
- Server Action を無造作に増やしていないか
- 認可をフロント側の表示制御だけで済ませていないか
- 例外処理や最低限のエラーハンドリングがあるか

---

## **25. 新人が意識すべき習慣**

### **作業前に必ず mainを更新する**

```Bash
git switch main
git pull origin main
```

### **commit 前に git statusと git diffを見る**

```Bash
git status
git diff
```

### **PR 前に lint / build / OpenNext build を通す**

```bash
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build
```

### **必ず守ること**

- .env.local を絶対に push しない
- SUPABASE_SERVICE_ROLE_KEY をクライアント側に出さない
- migration をコード変更とセットで管理する
- DB スキーマ変更時は型も更新する
- 認証で困ったらまず確認する

```Bash
gh auth status
git remote -v
```

---

## **26. 最小フローまとめ**

日常作業の基本はこの流れです。

```Bash
git switch main
git pull origin main
git switch -c feature/add-auth-pages

# 実装

git status
git diff
git add .
git commit -m "feat: add Supabase auth pages"
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build
git push -u origin feature/add-auth-pages
```

その後、PR を作成して main にマージします。

---

## **27. リリース時の最小フローまとめ**

```Bash
git switch main
git pull origin main
pnpm install
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build
git tag release-2026-04-06
git push origin release-2026-04-06
```

---

## **28. 新人向けの推奨スタート手順まとめ**

この案件で新人が最初に開発を始めるときは、以下の流れに統一します。

```bash
gh auth login
gh auth status

git clone <https://github.com/your-org/your-project.git>
cd your-project

# 参考開始手順の一例
pnpm dlx create-next-app@latest -e with-supabase .

code .

pnpm install

# クラウド Supabase と連携する場合
supabase login
supabase link

# ローカル Supabase を使う場合のみ
supabase init
supabase start

git switch -c chore/initial-setup
git add .
git commit -m "chore: initialize Next.js project"
git push -u origin chore/initial-setup
```

その後、chore/initial-setup から main への PR を作成します。

---

## **29. この案件の認証運用ルールまとめ**

- GitHub 接続は HTTPS
- 認証は GitHub CLI
- エディターは Visual Studio Code
- Node.js は 22.13.0以上
- パッケージマネージャーは pnpm
- pnpm のバージョンは `package.json` の `packageManager` で固定する
- git push / git pull の不具合時は、まず gh auth status と git remote -v を確認する
- SSH や PAT の説明は標準マニュアルには載せない
- 認証方式を個人ごとに変えない

---

## **30. 最後に**

このマニュアルの目的は、ルールを増やして開発しづらくすることではありません。

事故を減らし、レビューしやすくし、main を常に信頼できる状態に保つことが目的です。

とくに Next.js / Supabase 案件では、以下の事故が起きやすいです。

- 環境変数の誤 push
- service role key の誤利用
- migration の入れ忘れ
- ローカルでは動くが本番で動かない
- RLS や認証設定の見落とし
- 型更新漏れによる実装ずれ

このマニュアルに沿って進めることで、そうした事故を減らし、チーム全体で同じ前提で安全に開発を進められる状態を目指します。
