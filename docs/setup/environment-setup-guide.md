# 環境構築ガイドライン

## 前提

このガイドラインは、Next.js / TypeScript / App Router / Tailwind CSS / Supabase を利用する案件に参加する新人エンジニアが、開発を始める前にローカル環境を整えるための手順です。

### 関連ドキュメント

- 新規プロジェクト開始: `docs/new-project-setup-guide.md`
- 機能追加・修正フロー: `docs/feature-development-guide.md`
- フォルダ構成: `docs/coding-guide/11_nextjs-folder-structure-guide.md`

このプロジェクトでは、以下を標準とします。

- GitHub 接続方式: HTTPS
- GitHub 認証: GitHub CLI
- エディター: Visual Studio Code
- Node.js: 22.13.0以上
- パッケージマネージャー: pnpm
- 基準ブランチ: main
- 作業方式: main から作業ブランチを作成し、Pull Request 経由で main に反映

---

## pnpm を使う理由

このプロジェクトで pnpm を標準とする理由は以下の通りです。

- **ディスク容量の節約**: pnpm はハードリンクを使用し、パッケージをグローバルストアに一元管理するため、ディスク容量を大幅に節約できます。複数プロジェクトで同じパッケージを使用する場合、重複して保存されません。
- **インストール速度の高速化**: ハードリンクによるコピーの回避と、効率的な依存関係解決により、npm や yarn よりも高速にインストールできます。
- **厳格な依存関係管理**: pnpm は phantom dependencies（実際には依存関係にないパッケージが参照できる問題）を防ぎ、package.json に明示的に記述された依存関係のみを使用できるため、予期せぬバグを防げます。
- **シンプルな node_modules 構造**: シンボリックリンクを使用したフラットな構造により、node_modules の階層が深くならず、理解しやすくなります。
- **npm との互換性**: npm と同じコマンドインターフェースを持ち、既存のワークフローを変更せずに移行できます。

これらの理由から、プロジェクト間で一貫した環境を維持し、効率的な開発を実現するために pnpm を採用しています。

---

## 1. このガイドラインの目的

新人エンジニアが開発開始前に迷いやすい、次の内容を統一することを目的とします。

- 必要なツールを正しくインストールする
- GitHub に正しい方法で認証する
- プロジェクトをローカルに取得する
- pnpm / Next.js / Supabase の基本動作を確認する
- 秘密情報を誤って Git に含めない
- 開発開始前に最低限の品質確認ができる状態にする

このガイドラインに沿って環境構築を行い、個人ごとの手順差異をできるだけ減らしてください。

---

## 2. 最初に確認すること

環境構築を始める前に、担当者またはプロジェクト責任者へ以下を確認してください。

- 参加する GitHub organization / repository
- GitHub アカウントが招待済みか
- 利用する Supabase project
- `.env.local` に設定する値の受け取り方法
- ローカル Supabase を使うか
- Node.js の推奨バージョン
- 作業開始時に切るブランチ名

> [!warning]
> `.env.local` や Supabase の secret key は Slack やメールにそのまま貼らず、チームで決められた安全な方法で共有してください。

---

## 3. インストールするツール

開発開始前に、最低限以下をインストールします。

- Git
- Node.js
- pnpm
- Visual Studio Code
- GitHub CLI
- Docker Desktop または Docker 互換環境

Supabase CLI は、原則としてプロジェクトごとの `devDependencies` として管理します。グローバルインストールではなく、プロジェクト内で `pnpm dlx` または pnpm scripts 経由で実行します。

---

## 4. 各ツールの確認

ターミナルで以下を実行し、バージョンが表示されることを確認します。

```bash
git --version
node -v
pnpm -v
gh --version
docker --version
docker compose version
```

Node.js は **22.13.0以上** を推奨します。

```bash
node -v
```

表示されたバージョンが `v22.13.0` 以上でない場合は、担当者に確認してから更新してください。

このプロジェクトでは `package.json` の `packageManager` で pnpm のバージョンを固定します。pnpm の新しいバージョンは Node.js の最低バージョンも引き上げることがあるため、Node.js と pnpm はセットで確認してください。

---

## 5. pnpm のインストール

まだ pnpm をインストールしていない場合は、以下のコマンドでインストールします。

### npm を使ってインストールする場合

```bash
npm install -g pnpm
```

### インストール後の確認

インストール後、バージョンが表示されることを確認します。

```bash
pnpm -v
```

> [!note]
> このプロジェクトでは pnpm を標準とします。npm や yarn は使用しないでください。

---

## 6. Visual Studio Code の準備

VS Code には、最低限以下の拡張機能を入れてください。

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitHub Pull Requests and Issues
- EditorConfig
- Git Graph

VS Code でプロジェクトを開いたあと、以下を確認します。

- ターミナルが使える
- Source Control タブで Git 差分が見える
- TypeScript のエラーが表示される
- ESLint のエラーが表示される
- Tailwind CSS の補完が効く

---

## 7. GitHub CLI でログインする

このプロジェクトでは、GitHubへの接続方式をHTTPSに統一します。

SSHは使わず、GitHub CLIで認証してください。

```bash
gh auth login
```

`gh auth login` では、基本的に以下を選択します。

- GitHub.com
- HTTPS
- ブラウザ認証

認証後、以下でログイン状態を確認します。

```bash
gh auth status
```

---

## 8. リポジトリをローカルに取得する

### GitHub CLI を使う場合（推奨）

```bash
gh repo clone your-org/your-project
cd your-project
```

HTTPS URL を手動でコピーする必要がなく、GitHub CLI の認証情報が使われます。

### git clone を使う場合

GitHubのHTTPS URLを使ってcloneします。

```bash
git clone https://github.com/your-org/your-project.git
cd your-project
```

SSH URLは使いません。

clone後、現在の状態を確認します。

```bash
git branch
git status
```

通常は`main`ブランチにいる状態です。

---

## 9. 依存関係をインストールする

プロジェクト直下で以下を実行します。

```bash
pnpm install
```

このプロジェクトではpnpmを標準とします。pnpm / yarn / npmを混在させないでください。

### pnpm install と pnpm install --frozen-lockfile の使い分け

ローカル開発では、基本的に以下を使います。

```bash
pnpm install
```

CI やクリーン環境で厳密に再現したい場合は、以下を使います。

```bash
pnpm install --frozen-lockfile
```

### .npmrc の設定

プロジェクト直下に `.npmrc` ファイルを作成し、以下の設定を含めてください。

```ini
minimum-release-age=1440
```

この設定は、パッケージの最小リリース年齢を1440分（24時間）に設定するもので、リリース直後の不安定なパッケージのインストールを防ぐために重要です。すべてのプロジェクトで必ずこの設定を含めてください。

### ESLint と Prettier のインストール

まだインストールされていない場合は、以下を実行して ESLint と Prettier をインストールします。

```bash
pnpm add -D typescript eslint prettier eslint-config-next eslint-config-prettier eslint-plugin-import prettier-plugin-tailwindcss
```

> [!important]
> ESLint 10 以降は flat config（`eslint.config.mjs`）が必須です。従来の `.eslintrc.json` は使用できません。

インストール後、プロジェクト直下に `eslint.config.mjs`、`.prettierrc`、`.prettierignore` を作成します。

#### eslint.config.mjs の例

```js
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
const config = [
	{
		ignores: [
			"node_modules/**",
			".next/**",
			"out/**",
			"public/**",
			".wrangler/**",
			"dist/**",
		],
	},
	...nextCoreWebVitals,
	...nextTypescript,
	{
		files: ["**/*.{ts,tsx}"],
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/consistent-type-imports": "error",
		},
	},
	prettierConfig,
];

export default config;
```

> [!note]
> `eslint-config-next` v16 はフラット config を直接エクスポートするため、`FlatCompat` は不要です。`eslint-config-next/core-web-vitals` と `eslint-config-next/typescript` を直接スプレッドして使用します。`eslint-config-prettier` を末尾に配置することで、ESLint と Prettier のルール競合を防いでいます。

#### .prettierrc の例

```json
{
	"semi": true,
	"singleQuote": false,
	"tabWidth": 2,
	"useTabs": true,
	"trailingComma": "all",
	"printWidth": 80,
	"bracketSpacing": true,
	"arrowParens": "always",
	"endOfLine": "lf",
	"plugins": ["prettier-plugin-tailwindcss"]
}
```

> [!note]
> `prettier-plugin-tailwindcss` を使用して、Tailwind CSS のクラス名を自動的にソートします。

#### .prettierignore の例

```text
node_modules
.next
out
dist
public
.wrangler
pnpm-lock.yaml
```

#### package.json に追加するスクリプト

```json
{
	"scripts": {
		"lint": "eslint .",
		"lint:fix": "eslint . --fix",
		"format": "prettier --write .",
		"format:check": "prettier --check ."
	}
}
```

設定後、以下で動作確認をします。

```bash
pnpm lint
pnpm format:check
```

---

## 10. Supabase CLI を確認する

Supabase CLI は、プロジェクトごとの `devDependencies` として管理します。

**推奨理由**:

- プロジェクトごとにツールのバージョンを固定できる
- チーム全体で同じバージョンを使用できる
- CI環境とローカル環境で同じバージョンを使える

まだ入っていない場合は、担当者に確認したうえで以下を実行します。

```bash
pnpm install supabase --save-dev
```

利用できることを確認します。

```bash
pnpm exec supabase --help
```

よく使うコマンドは、プロジェクトの `package.json` の `scripts` にまとめることを推奨します。

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
	}
}
```

---

## 11. Supabase にログインする

クラウド Supabase project と連携する場合は、Supabase CLI でログインします。

```bash
pnpm exec supabase login
```

既存の Supabase project とローカルプロジェクトを紐付ける場合は、担当者に確認してから実行します。

```bash
pnpm exec supabase link
```

> [!warning]
> 接続先の Supabase project を間違えると、別環境に対して操作してしまう可能性があります。`link` 前に必ず対象 project を確認してください。

---

## 12. ローカル Supabase を使う場合

ローカル Supabase を使う場合は、Docker が起動していることを確認してから進めます。

初期化されていないプロジェクトでは、以下を実行します。

```bash
pnpm exec supabase init
```

ローカル Supabase を起動します。

```bash
pnpm exec supabase start
```

起動状態や接続情報は以下で確認できます。

```bash
pnpm exec supabase status
```

ローカル Supabase を止める場合は、以下を実行します。

```bash
pnpm exec supabase stop
```

複数案件を扱う場合は、基本的に作業するプロジェクトだけを起動し、使わないプロジェクトは停止してください。

---

## 13. 環境変数を設定する

Supabase 接続情報などは `.env.local` に設定します。

`.env.local` は Git に含めてはいけません。

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

サーバー側限定で強い権限が必要な場合のみ、以下のような値を使います。

```env
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
LLM_GATEWAY_API_KEY=YOUR_LLM_GATEWAY_API_KEY
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_ALLOWED_PRICE_IDS=price_xxxxx
ALLOWED_REDIRECT_ORIGINS=http://localhost:3000
```

### 注意

- `NEXT_PUBLIC_` が付いた値はブラウザに公開される前提で扱う
- `SUPABASE_SERVICE_ROLE_KEY` は Client Component で使わない
- `STRIPE_SECRET_KEY` と `STRIPE_WEBHOOK_SECRET` はサーバー側・Supabase Edge Functions 側だけで使う
- `STRIPE_ALLOWED_PRICE_IDS` には Checkout 作成を許可する Price ID だけを設定する
- `ALLOWED_REDIRECT_ORIGINS` には Checkout / Customer Portal から戻してよい Origin だけを設定する
- secret key をコードに直接書かない
- `.env.local` をコミットしない
- `.env.example` にはダミー値だけを書く

---

## 14. .gitignore を確認する

最低限、以下が `.gitignore` に含まれていることを確認します。

```gitignore
.env
.env.local
.env.development.local
.env.production.local
node_modules/
.next/
.DS_Store
coverage/
```

誤って秘密情報をコミットしないよう、コミット前に必ず差分を確認してください。

```bash
git status
git diff
```

---

## 15. 開発サーバーを起動する

依存関係と環境変数の設定が終わったら、開発サーバーを起動します。

```bash
pnpm dev
```

通常は以下にアクセスします。

```text
http://localhost:3000
```

ブラウザで画面が表示されることを確認してください。

---

## 16. 初回の動作確認

開発を始める前に、最低限以下を確認します。

```bash
pnpm lint
pnpm build
```

`type-check` script がある場合は、以下も実行します。

```bash
pnpm type-check
```

`package.json` に `type-check` がない場合は、担当者に確認したうえで追加を検討します。

```json
{
	"scripts": {
		"type-check": "tsc --noEmit"
	}
}
```

---

## 17. 作業ブランチを作成する

作業を始める前に、必ず `main` を最新化します。

```bash
git switch main
git pull origin main
```

その後、作業内容に合ったブランチを作成します。

```bash
git switch -c feature/add-auth-pages
```

### ブランチ名の例

```text
feature/add-auth-pages
fix/session-refresh-bug
refactor/auth-server-actions
chore/update-eslint-config
docs/update-setup-guide
test/add-auth-flow-test
```

---

## 18. コミット前の確認

コミット前に、必ず現在の状態と差分を確認します。

```bash
git status
git diff
```

ステージング後は、コミット予定の差分も確認します。

```bash
git diff --cached
```

`git add .` を使う場合は、不要ファイルや秘密情報が含まれていないことを確認してください。

### pre-commitフックの設定（推奨）

コード品質を担保するため、huskyとlint-stagedによるpre-commitフックを導入することを推奨します。

#### 設定手順

```bash
# huskyとlint-stagedをインストール
pnpm add -D husky lint-staged

# huskyを初期化
pnpm exec husky init

# pre-commitフックを設定
echo "pnpm exec lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit
```

#### package.jsonにlint-stagedの設定を追加

```json
{
	"lint-staged": {
		"*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
		"*.{json,md}": ["prettier --write"]
	}
}
```

設定後、コミット時に自動でlintとフォーマットが実行されます。エラーがある場合はコミットがキャンセルされます。

---

## 19. PR 作成前チェック

Pull Request を作成する前に、最低限以下を実行します。

```bash
git status
git diff
pnpm install
pnpm lint
pnpm build
```

`type-check` がある場合は、以下も実行します。

```bash
pnpm type-check
```

Supabase の DB スキーマを変更した場合は、以下も確認してください。

- migration を作成したか
- 型生成を更新したか
- RLS / policy の影響を確認したか
- PR 本文に DB 変更内容を書いたか

---

## 20. よくあるトラブルと確認ポイント

### GitHub に push できない

以下を確認します。

```bash
gh auth status
git remote -v
```

remote URL が SSH になっている場合は、HTTPS に直してください。

### pnpm install が失敗する

以下を確認します。

```bash
node -v
pnpm -v
```

Node.js のバージョンが古い場合は、担当者に確認してから更新してください。

### GitHub Actions で pnpm/action-setup が失敗する

以下のようなエラーが出る場合があります。

```text
Error: No pnpm version is specified.
```

この場合は、`package.json` に `packageManager` が設定されているか確認してください。

```json
{
	"packageManager": "pnpm@11.1.1"
}
```

また、以下のようなエラーが出る場合は、CI の Node.js バージョンが pnpm の要求バージョンを満たしていません。

```text
This version of pnpm requires at least Node.js v22.13
No such built-in module: node:sqlite
```

`.github/workflows/ci.yml` の `actions/setup-node` で Node.js 22 系を使うようにしてください。

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: "pnpm"
```

### pnpm dev で Supabase 接続エラーが出る

以下を確認します。

- `.env.local` が存在するか
- URL や key にコピー漏れがないか
- ローカル Supabase を使う場合は起動しているか
- クラウド Supabase とローカル Supabase の接続先が混ざっていないか

```bash
pnpm exec supabase status
```

### Docker 関連で Supabase が起動しない

以下を確認します。

- Docker Desktop が起動しているか
- 他プロジェクトの Supabase が起動したままになっていないか
- 必要なポートが使用中でないか

使っていないプロジェクトでは、以下を実行して停止します。

```bash
pnpm exec supabase stop
```

---

## 21. 環境構築完了チェックリスト

環境構築が完了したら、以下を確認してください。

- Git / Node.js / pnpm / GitHub CLI / Docker のバージョンを確認できた
- Node.js が `package.json` の `engines.node` を満たしている
- pnpm が `package.json` の `packageManager` と一致している
- GitHub CLI でログインできた
- HTTPS URL で repository を clone できた
- `pnpm install` が成功した
- `.npmrc` を作成し、`minimum-release-age=1440` を設定した
- `.env.local` を設定した
- `.env.local` が Git 管理対象外になっている
- `pnpm dev` で画面を表示できた
- `pnpm lint` が成功した
- `pnpm build` が成功した
- 必要に応じて `pnpm type-check` が成功した
- Supabase CLI を `pnpm exec supabase --help` で確認できた
- ローカル Supabase を使う場合、`pnpm exec supabase start` と `pnpm exec supabase status` を確認できた
- `main` を最新化して作業ブランチを作成できた

このチェックリストを満たした状態を、開発開始可能な最低ラインとします。
