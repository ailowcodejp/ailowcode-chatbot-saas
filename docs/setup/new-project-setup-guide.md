# 新規プロジェクト開始手順

## 前提

このマニュアルは、GitHub 上で新規プロジェクトを作成し、ローカルへ clone して、初回の Next.js プロジェクト初期構成を `chore/init` ブランチで作成し、Pull Request 経由で `main` にマージするまでの手順です。

このプロジェクトでは、以下を標準とします。

- GitHub 接続方式: HTTPS
- GitHub 認証: GitHub CLI
- 基準ブランチ: main
- 初回作業ブランチ: chore/init
- main への直接 push はしない
- すべての変更は Pull Request 経由で main に反映する

---

## 1. このマニュアルの目的

初回のプロジェクト作成時に、担当者ごとの手順差異を減らし、最初から main を安全に運用することを目的とします。

初回セットアップでは、まだアプリケーションコードが存在しない場合でも、main へ直接 push しません。

`chore/init` ブランチで初回のプロジェクト構成を作成し、Pull Request を作成してレビューまたは確認後に main へマージします。

---

## 2. 作業前に確認すること

作業を始める前に、以下を確認してください。

- GitHub organization 名
- 作成する repository 名
- repository を Public / Private のどちらにするか
- main ブランチを基準ブランチにすること
- GitHub CLI でログイン済みか
- README に記載するプロジェクト名
- 初回 PR の確認者

通常の案件では、repository は **Private** で作成します。

---

## 3. GitHub CLI のログイン確認

このプロジェクトでは、GitHub への接続方式を HTTPS に統一します。

SSH は使わず、GitHub CLI で認証してください。

```bash
gh auth login
gh auth status
```

`gh auth status` でログイン済みのアカウントが表示されることを確認します。

---

## 4. GitHub で空の repository を作成する

GitHub の画面から新しい repository を作成します。

### 手順

1. GitHub にログインする
2. 対象の organization を開く
3. **New repository** を押す
4. repository 名を入力する
5. 通常案件では **Private** を選ぶ
6. README / .gitignore / License は追加しない
7. **Create repository** を押す

### 重要

GitHub 側で README を追加せず、空の repository として作成してください。

最初から GitHub 側に README を作ると、ローカルで初回コミットを作る際に履歴のずれや不要な conflict が起きやすくなります。

---

## 5. repository の HTTPS URL を確認する

repository 作成後、GitHub の画面で HTTPS URL をコピーします。

例:

```text
https://github.com/your-org/your-project.git
```

SSH URL は使いません。

> [!note]
> 次のセクションで `gh repo clone` を使う場合は、この手順は不要です。

---

## 6. ローカルに clone する

作業用ディレクトリへ移動して、repository を clone します。

### GitHub CLI を使う場合（推奨）

```bash
gh repo clone your-org/your-project
cd your-project
```

HTTPS URL を手動でコピーする必要がなく、GitHub CLI の認証情報が使われます。

### git clone を使う場合

```bash
git clone https://github.com/your-org/your-project.git
cd your-project
```

clone 後、remote URL が HTTPS になっていることを確認します。

```bash
git remote -v
```

表示例:

```text
origin  https://github.com/your-org/your-project.git (fetch)
origin  https://github.com/your-org/your-project.git (push)
```

---

## 7. 現在の状態を確認する

clone 直後の状態を確認します。

```bash
git status
git branch
```

空 repository の場合、まだ commit が存在しないため、branch 表示が通常の repository と異なる場合があります。

### 空の repository で main ブランチを作成する

完全に空の repository を clone した場合、GitHub 上に `main` ブランチはまだ存在しません。

後続の Pull Request で base branch として `main` を指定するために、ここで `main` ブランチを作成して push します。

```bash
git switch -c main
git commit --allow-empty -m "chore: initialize repository"
git push -u origin main
```

`--allow-empty` を使うことで、ファイルがなくても空の commit を作成できます。

この空コミットは、PR の base branch を作るための例外的な初期化です。アプリケーションコード、設定ファイル、README などの実作業は後続の `chore/init` ブランチで行います。

push 後、GitHub の repository 画面で `main` ブランチが表示されていることを確認してください。

> [!note]
> 組織の標準テンプレートや管理者による初期化で `main` が作成済みの場合は、この手順は不要です。そのまま次のステップへ進んでください。

---

## 8. chore/init ブランチを作成する

初回作業用の `chore/init` ブランチを作成します。

```bash
git switch -c chore/init
```

ブランチを確認します。

```bash
git branch
git status
```

`* chore/init` と表示されていれば、`chore/init` ブランチで作業できています。

---

## 9. セットアップする

> [!important]
> 手順の実行順序が重要です。`pnpm create cloudflare` は `package.json` を含むプロジェクト全体を生成するため、**必ず最初に実行**してください。ESLint/Prettier や husky などの設定は、プロジェクト作成の実行後に追加します。順序を誤ると、設定ファイルが上書きされます。

### Next.js プロジェクトを作成する（Cloudflare Workers）

Cloudflare Workers へのデプロイを前提とした Next.js プロジェクトを作成します。

プロジェクトディレクトリの中で以下を実行します。

```bash
pnpm create cloudflare@latest . --framework=next
```

> [!note]
> このコマンドは Supabase テンプレートをサポートしていません。Supabase を使用するプロジェクトの場合は、プロジェクト作成後に別途 Supabase 関連のライブラリと設定を追加してください。

### プロジェクト作成後の追加設定

作成直後に、Cloudflare関連ファイルが生成されていることを確認します。

```bash
ls wrangler.jsonc open-next.config.ts cloudflare-env.d.ts public/_headers
```

`wrangler.jsonc` の `name` と `compatibility_date` がplaceholderのままになっている場合は、実際のプロジェクト名と作業時点の日付に更新します。

`package.json` に、Cloudflare向けのscriptが含まれていることも確認します。

```json
{
	"scripts": {
		"dev": "next dev",
		"build": "next build",
		"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
		"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
		"upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
		"cf-typegen": "wrangler types --env-interface CloudflareEnv ./cloudflare-env.d.ts"
	}
}
```

#### Supabase を使用する場合のみ

Cloudflare コマンドで作成したプロジェクトで Supabase を使用する場合は、以下の手順で追加設定を行います。

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

その後、Supabase CLI のインストールと `supabase init` を行い、Supabase クライアントの設定ファイルを作成してください。

#### 通常のWebサイトの場合

この手順はスキップしてください。

### pnpm-workspace.yaml の作成

pnpm v11 では、認証・registry 以外の pnpm 設定は `.npmrc` ではなく `pnpm-workspace.yaml` に記載します。

プロジェクト直下に `pnpm-workspace.yaml` を作成し、以下の設定を含めてください。

```yaml
packages:
  - "."

minimumReleaseAge: 1440
```

この設定は、パッケージの最小リリース年齢を 1440 分（24時間）に設定するもので、リリース直後の不安定なパッケージのインストールを防ぐために重要です。pnpm v11 では 1440 分が既定値ですが、プロジェクトの方針として明示しておきます。

> [!note]
> `.npmrc` は registry や認証トークンなど、npm registry への接続設定が必要な場合のみ使用します。通常の新規プロジェクトでは、この手順では `.npmrc` を作成しません。

### Supabase CLI のインストール（Supabase プロジェクトの場合）

Supabase CLI は、プロジェクトごとの `devDependencies` として管理します。

**推奨理由**:

- プロジェクトごとにツールのバージョンを固定できる
- チーム全体で同じバージョンを使用できる
- CI環境とローカル環境で同じバージョンを使える

まだ入っていない場合は、担当者に確認したうえで以下を実行します。

```bash
pnpm add -D supabase
```

### build スクリプトの実行許可

pnpm v10 以降、セキュリティ強化のため、ネイティブビルドを伴うパッケージの build スクリプトがデフォルトでブロックされます。インストール時に以下のようなエラーが出た場合：

```text
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.25.4, sharp@0.34.5, workerd@1.20260508.1, ...

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

#### 解決方法（推奨）

`pnpm-workspace.yaml` に `allowBuilds` を追加して、許可するパッケージを宣言的に指定します。

```yaml
packages:
  - "."

minimumReleaseAge: 1440

allowBuilds:
  esbuild: true
  sharp: true
  unrs-resolver: true
  workerd: true
```

> [!important]
> この設定は**新規インストール時**にのみ適用されます。すでに `node_modules` が存在する環境では、設定追加後に `rm -rf node_modules && pnpm install` で再インストールしてください。

Supabase を使用するプロジェクトの場合は、上記に加えて `supabase` も許可リストに追加してください。

```yaml
packages:
  - "."

minimumReleaseAge: 1440

allowBuilds:
  esbuild: true
  sharp: true
  supabase: true
  unrs-resolver: true
  workerd: true
```

#### 解決方法（対話式・単発）

以下のコマンドで対話的に許可することも可能です。選択結果は `pnpm-workspace.yaml` の `allowBuilds` に反映されます。

```bash
pnpm approve-builds
```

#### トラブルシューティング: `pnpm install` や `pnpm run lint` 等が `ERR_PNPM_IGNORED_BUILDS` で失敗する

`allowBuilds` を `pnpm-workspace.yaml` に追加済みでも、キャッシュされた `node_modules` には遡及適用されないため、`pnpm install` の再実行や、`pnpm run lint` / `pnpm run format:check` などのスクリプト実行時に pnpm が内部で走らせるインストールが同じエラーで失敗する場合があります。

**確認すること**: `pnpm-workspace.yaml` の `allowBuilds` に、エラーに表示されたパッケージが `true` で含まれているか確認します。

```yaml
allowBuilds:
  esbuild: true
  sharp: true
  unrs-resolver: true
  workerd: true
```

**根本解決**: `node_modules` を削除して再インストールします。

```bash
rm -rf node_modules && pnpm install
```

以降、`pnpm run lint` 等のスクリプトが正常に動作するようになります。

#### トラブルシューティング: `allowBuilds` が数値キーや説明文のままになっている

`pnpm approve-builds` の選択結果や手作業の修正が不完全な場合、`pnpm-workspace.yaml` が次のような壊れた形式になることがあります。

```yaml
allowBuilds:
  "0": esbuild
  "1": sharp
  esbuild: set this to true or false
  sharp: set this to true or false
```

この状態では build script の許可対象が正しく解釈されません。以下のように、パッケージ名をキー、許可状態を boolean として明示してください。

```yaml
allowBuilds:
  esbuild: true
  sharp: true
  supabase: true
  unrs-resolver: true
  workerd: true
```

修正後、現在の解釈結果を確認します。

```bash
pnpm config get allow-builds
```

`.npmrc` に `ignore-build-scripts=false` を置いて全 build script を許可する運用は避け、このガイドでは `pnpm-workspace.yaml` の `allowBuilds` で必要なパッケージだけを許可します。既に `node_modules` がある場合は、修正後に再インストールしてください。

```bash
rm -rf node_modules && pnpm install
```

#### トラブルシューティング: `pnpm add` 中に Supabase CLI の bin 作成警告が出る

`pnpm add` や再インストール中に、次のような警告が一時的に表示される場合があります。

```text
Failed to create bin at .../node_modules/.bin/supabase
```

その後の postinstall で Supabase CLI のダウンロードと検証が完了し、コマンド自体が成功している場合は、まず以下で利用できるか確認します。

```bash
pnpm exec supabase --help
```

この確認が通れば追加対応は不要です。失敗する場合は、`node_modules` を作り直してから再確認してください。

```bash
rm -rf node_modules && pnpm install
pnpm exec supabase --help
```

#### Supabase CLI の動作確認（Supabase プロジェクトの場合）

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

記載内容は、初回時点では最低限で構いません。

プロジェクト名や概要は、実際の案件に合わせて変更してください。

### ESLint と Prettier のインストール

C3 が内部で起動する Next.js テンプレートでは、通常 ESLint はすでにインストールされています。したがって、ドキュメントにある「まだインストールされていない場合は」という条件付きの記述の通り、既存のインストール状況に応じて対応します。

まず、現在のインストール状況を確認します。

```bash
pnpm list eslint prettier
```

または、`package.json` を直接確認します。

```bash
cat package.json | grep -A 20 "devDependencies"
```

まだインストールされていない場合は、以下を実行して ESLint と Prettier をインストールします。

```bash
pnpm add -D typescript eslint prettier eslint-config-next eslint-config-prettier eslint-plugin-import prettier-plugin-tailwindcss
```

> [!important]
> ESLint v9 以降は flat config（`eslint.config.mjs`）が標準です。新規プロジェクトでは従来の `.eslintrc.json` は作成せず、`eslint.config.mjs` に統一してください。

インストール後、プロジェクト直下に `eslint.config.mjs`、`.prettierrc`、`.prettierignore` を作成します。

### 設定ファイルの作成手順

#### 1. 既存ファイルの確認

まず、設定ファイルが既に存在するか確認します。

```bash
ls -la | grep -E "eslint.config.mjs|.prettierrc|.prettierrc.json|.prettierignore"
```

#### 2. eslint.config.mjs の作成

C3 / Next.js テンプレートで作成された `eslint.config.mjs` は、Next.js 16 の新しい形式を使用しています。ドキュメントの推奨設定に合わせる場合は、以下の手順で置き換えます。

**既存ファイルがある場合:**

```bash
# 現在の内容を確認
cat eslint.config.mjs
```

確認後、ドキュメントの推奨設定に完全に置き換えるか、必要な部分のみ追加修正します。

**推奨設定の eslint.config.mjs:**

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
			".open-next/**",
			"out/**",
			"public/**",
			".wrangler/**",
			"dist/**",
			"cloudflare-env.d.ts",
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

#### トラブルシューティング: `pnpm run lint` が `.open-next/` 配下の生成物で失敗する

`pnpm exec opennextjs-cloudflare build` や `pnpm run preview` の後に `pnpm run lint` を実行すると、OpenNext が生成した `.open-next/` 配下のファイルまで ESLint の対象になり、次のようなエラーで失敗する場合があります。

```text
.open-next/.build/composable-cache.cjs
  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports

.open-next/server-functions/default/index.mjs
  error  Use "@ts-expect-error" instead of "@ts-ignore"  @typescript-eslint/ban-ts-comment
```

`.open-next/` はアプリケーションのソースコードではなく Cloudflare Workers 向けのビルド生成物です。ESLint の対象に含める必要はないため、`eslint.config.mjs` の `ignores` に `.open-next/**` が含まれているか確認してください。

```js
ignores: [
	"node_modules/**",
	".next/**",
	".open-next/**",
	"out/**",
	"public/**",
	".wrangler/**",
	"dist/**",
	"cloudflare-env.d.ts",
],
```

修正後、以下を実行して `.open-next/` が存在する状態でも lint が通ることを確認します。

```bash
pnpm run lint
```

#### トラブルシューティング: `cloudflare-env.d.ts` で unused eslint-disable 警告が出る

`pnpm run cf-typegen` で生成される `cloudflare-env.d.ts` には、Wrangler が付与する `eslint-disable` コメントが含まれます。ESLint のバージョンやルール構成によっては、次のような警告が出る場合があります。

```text
cloudflare-env.d.ts
  warning  Unused eslint-disable directive
```

`cloudflare-env.d.ts` はアプリケーションの手書きコードではなく生成ファイルなので、`eslint.config.mjs` の `ignores` に追加して lint 対象から外してください。Prettier も同様に、`.prettierignore` に追加して生成ファイルの再整形を避けます。

```text
cloudflare-env.d.ts
```

#### 3. .prettierrc の作成

Prettier の設定ファイルを作成します。

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

#### 4. .prettierignore の作成

Prettier の無視設定ファイルを作成します。

```text
node_modules
.next
.open-next
out
dist
public
.wrangler
pnpm-lock.yaml
cloudflare-env.d.ts
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
pnpm run lint
pnpm run format:check
```

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

### README.mdを確認・更新する

`pnpm create cloudflare@latest . --framework=next` を実行すると、通常はプロジェクト直下に `README.md` が自動生成されます。

ただし、自動生成されたREADMEはNext.js標準の内容です。プロジェクト固有の情報は入らないため、作成後に内容を確認し、必要な情報へ更新します。

README には、最低限以下を記載・更新します。

- プロジェクト名
- 何を作るプロジェクトか
- 使用する開発環境
- ブランチ運用のルール
- 開発時によく使うコマンド

以下は更新後の最小構成の例です。`your-project` は実際のプロジェクト名に置き換えてください。

````Markdown
# your-project

## 概要

この repository は、your-project の開発用 repository です。

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
````

### フォルダ構成を標準構成に整える

`pnpm create cloudflare@latest . --framework=next` で生成された初期構成を、社内標準のフォルダ構成に合わせて確認・調整します。

プロジェクト作成直後に、`docs/coding-guide/11_nextjs-folder-structure-guide.md` に合わせてフォルダ構成を整えてください。

#### なぜ最初に整えるのか

- 後から構成を変更すると、import パスの修正やコンフリクトが大量に発生する
- 最初に決めておけば、全員が同じ構成で開発を始められる
- PR レビュー時に「どこに何があるか」の議論が不要になる

#### 手順

##### 1. src/app の配置を確認する

標準構成では、App Router のファイルは `src/app/` に置きます。

C3 のテンプレートで既に `src/app/` が作成されている場合は、この手順は不要です。ルート直下に `app/` が作成されている場合のみ、`src/app/` へ移動します。

```bash
if [ -d app ] && [ ! -d src/app ]; then
  mkdir -p src
  mv app src/
fi
```

##### 2. 不要なファイルを削除する

テンプレートが生成するデモ用ファイルを削除します。

```bash
rm -f src/app/favicon.ico
rm -f src/app/page.module.css
rm -f public/file.svg
rm -f public/globe.svg
rm -f public/next.svg
rm -f public/window.svg
```

> [!warning]
> テンプレートのバージョンにより生成されるファイルは異なります。デモ用のスタイルやアセットを削除してください。ただし、`src/app/globals.css`、`public/_headers`、`public/favicon.svg` は標準構成で使うため削除しません。

##### 3. 標準ディレクトリを作成する

```bash
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/features
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/lib/cloudflare
mkdir -p src/config
mkdir -p src/types
mkdir -p tests
```

Cloudflare binding を使うプロジェクトでは、`src/lib/cloudflare/` に薄いアクセサを置きます。

```bash
touch src/lib/cloudflare/context.ts
```

##### 4. Supabase クライアントファイルを作成する（Supabase案件の場合）

Supabase を使用するプロジェクトの場合のみ、以下を実行します。

```bash
mkdir -p src/lib/supabase
touch src/lib/supabase/client.ts
touch src/lib/supabase/server.ts
touch src/lib/supabase/admin.ts
```

各ファイルの実装内容は `docs/coding-guide/11_nextjs-folder-structure-guide.md` を参照してください。

> [!note]
> 通常の Web サイトを作成する場合は、この手順をスキップします。

##### 5. 共通設定ファイルを作成する

```bash
touch src/config/app.ts
touch src/config/env.client.ts
touch src/config/env.server.ts
touch src/config/routes.ts
```

各ファイルには基本的な設定を記述します。詳細な実装内容はプロジェクトに合わせて調整してください。

##### 6. 型定義ファイルを作成する

```bash
touch src/types/app.ts
touch src/types/common.ts
```

Supabase を使用するプロジェクトの場合のみ、以下も作成します。

```bash
touch src/types/database.types.ts
```

##### 7. グローバルスタイルを確認する

標準構成では、グローバルCSSは `src/app/globals.css` に置きます。

```bash
touch src/app/globals.css
```

ファイルには Tailwind CSS v4 の import を追加します。

```css
@import "tailwindcss";
```

> [!note]
> Tailwind CSS 4 では従来の `@tailwind base / components / utilities` は不要です。`@import "tailwindcss"` のみで動作します。

##### 8. layout.tsx の import パスを確認する

`src/app/layout.tsx` の globals.css import パスを更新します。

```tsx
import "./globals.css";
```

##### 9. tsconfig.json の paths を更新する

`src/` ディレクトリを使用する構成にしたため、`tsconfig.json` の `paths` エイリアスを更新します。

C3 / Next.js テンプレートが生成するデフォルトの `@/*: ["./*"]` は、`src/` を使わない構成向けです。`src/` 配下にコードを配置する場合は、以下のように修正してください。

```json
{
	"compilerOptions": {
		"paths": {
			"@/*": ["./src/*"]
		}
	}
}
```

> [!warning]
> この修正を行わないと、`@/features/...` や `@/lib/...` などのエイリアスが解決できず、`pnpm run build` が失敗します。

##### 10. Cloudflare / OpenNext 生成ファイルを確認する

C3 で作成したプロジェクトでは、次のファイルがルート直下または `public/` に存在することを確認します。

```text
wrangler.jsonc
open-next.config.ts
cloudflare-env.d.ts
public/_headers
```

`wrangler.jsonc` では、少なくとも以下を確認します。

- `main` が `.open-next/worker.js` になっている
- `assets.directory` が `.open-next/assets` になっている
- `compatibility_flags` に `nodejs_compat` が含まれている
- `name` がplaceholderのままになっていない
- `compatibility_date` がplaceholderのままになっていない

bindingを追加・変更した場合は、型定義を更新します。

```bash
pnpm run cf-typegen
```

##### 11. 完了後の構成を確認する

以下のような構成になっていることを確認します。

```text
.
├── public/
│   ├── _headers
│   ├── favicon.svg
│   └── images/
├── tests/
├── supabase/  # Supabase案件の場合のみ
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   └── layout/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   │   ├── cloudflare/
│   │   │   └── context.ts
│   │   └── supabase/  # Supabase案件の場合のみ
│   │       ├── client.ts
│   │       ├── server.ts
│   │       └── admin.ts
│   ├── config/
│   │   ├── app.ts
│   │   ├── env.client.ts
│   │   ├── env.server.ts
│   │   └── routes.ts
│   ├── types/
│   │   ├── database.types.ts  # Supabase案件の場合のみ
│   │   ├── app.ts
│   │   └── common.ts
│   └── proxy.ts  # 必要な場合のみ
├── cloudflare-env.d.ts
├── open-next.config.ts
├── wrangler.jsonc
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

> [!important]
> フォルダ構成の詳細なルール（各ディレクトリの責務、配置の判断基準）は `docs/coding-guide/11_nextjs-folder-structure-guide.md` を参照してください。

### next.config.ts のセキュリティヘッダー設定

初回セットアップ時に、`next.config.ts` に基本的なセキュリティヘッダーを設定しておくことを推奨します。

Cloudflare向けにC3で作成したプロジェクトでは、`next.config.ts` に `initOpenNextCloudflareForDev()` が追加されている場合があります。これは `next dev` から Cloudflare binding を参照するための設定なので、削除せずに残します。

```ts
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const securityHeaders = [
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "X-DNS-Prefetch-Control", value: "on" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()",
	},
];

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
		];
	},
};

export default nextConfig;

initOpenNextCloudflareForDev();
```

> [!note]
> Content-Security-Policy (CSP) は外部スクリプトや埋め込みの追加時に個別調整が必要なため、ここでは基本ヘッダーのみ設定しています。問い合わせフォーム・ログイン・外部スクリプトを追加する際に CSP を検討してください。

> [!note]
> 静的アセットのキャッシュヘッダーは `public/_headers` で管理します。`next.config.ts` はアプリケーションルート向けの基本ヘッダー、`public/_headers` は Workers Static Assets 向けのヘッダー、と役割を分けてください。

---

## 10. .env.example / .env.local / .dev.vars.example を作成する

プロジェクト直下に `.env.example`、`.env.local`、`.dev.vars.example` を作成します。

Cloudflare Workers + OpenNext 構成では、Next.js が読む環境変数と、`preview` 時に使う `.dev.vars` の役割を分けます。

| ファイル            | 用途                                                       | Git管理 |
| ------------------- | ---------------------------------------------------------- | ------- |
| `.env.example`      | Next.js / build time env の共有サンプル                    | する    |
| `.env.local`        | ローカルの実値。`next dev`、`next build`、`preview` で使う | しない  |
| `.dev.vars.example` | `preview` 時に `NEXTJS_ENV=development` を指定するサンプル | する    |
| `.dev.vars`         | `preview` 用のローカル設定。原則 `NEXTJS_ENV=development`  | しない  |

### .env.example の作成

`.env.example` はリポジトリにコミットし、チームメンバーが必要な環境変数を把握できるようにします。

ダミー値のみを記載し、実際の秘密情報は含めません。

```env
# --- アプリケーション ---
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Supabase を使用するプロジェクトの場合は、以下も追加します。

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### .env.local の作成

`.env.example` をコピーして `.env.local` を作成し、実際の値を設定します。

```bash
cp .env.example .env.local
```

### .dev.vars.example の作成

OpenNext Cloudflare の `preview` では、Next.js の環境名を明示するために `.dev.vars` で `NEXTJS_ENV=development` を指定します。

共有用サンプルとして `.dev.vars.example` を作成します。

```env
NEXTJS_ENV=development
```

ローカルではコピーして `.dev.vars` を作成します。

```bash
cp .dev.vars.example .dev.vars
```

> [!warning]
> 通常のアプリ用環境変数を `.dev.vars` に寄せないでください。`.dev.vars` にだけ値を書くと、`next dev` から見えず、開発サーバーと `preview` で挙動がズレます。通常の環境変数は `.env.local` に置きます。

### .gitignore の確認

`.env.local` と `.dev.vars` が Git にコミットされないことを確認します。

C3 が生成する `.gitignore` では `.env*` や `.dev.vars*` が含まれている場合があります。`.env.example` と `.dev.vars.example` はコミット対象にし、Next.js / OpenNext / Wrangler の生成物はコミットしないため、以下のように確認・修正してください。

```gitignore
# dependencies
/node_modules
/.pnpm-store

# next.js
/.next/
/out/

# OpenNext
/.open-next/

# wrangler files
.wrangler
.dev.vars*
!.dev.vars.example

# env files
.env*
!.env.example

# supabase
!supabase/**/*.sql
```

### 注意

- `.env.local` は Git に含めない
- `.dev.vars` は Git に含めない
- `.next/`、`.open-next/`、`.wrangler/` は Git に含めない
- `.dev.vars` には原則として `NEXTJS_ENV=development` だけを書く
- `NEXT_PUBLIC_` が付いた値はブラウザに公開される前提で扱う
- `SUPABASE_SERVICE_ROLE_KEY` は Client Component で使わない
- secret key をコードに直接書かない

#### トラブルシューティング: `supabase/seed.sql` や migration SQL が Git に出てこない

端末や組織標準のグローバル gitignore で `*.sql` が設定されていると、`supabase/seed.sql` や `supabase/migrations/*.sql` が `git status` に表示されない場合があります。

原因を確認します。

```bash
git check-ignore -v supabase/seed.sql supabase/migrations/20260101000000_example.sql
```

Supabase の SQL はリポジトリで管理するため、プロジェクトの `.gitignore` に以下を追加して明示的に許可します。

```gitignore
!supabase/**/*.sql
```

---

## 11. Next.js の起動確認

環境変数の設定が終わったら、Next.js が正常に動作することを確認します。

### Next.js 開発サーバーの起動確認

```bash
pnpm install
pnpm run dev
```

ブラウザで `http://localhost:3000` にアクセスし、画面が表示されることを確認します。

### Cloudflare Workers 実行環境での preview 確認

Cloudflare Workers へデプロイするプロジェクトでは、Next.js の開発サーバーだけでなく、Workers の実行環境に近い preview でも確認します。

`.dev.vars` が未作成の場合は、先に作成します。

```bash
cp .dev.vars.example .dev.vars
```

```bash
pnpm run preview
```

`pnpm run preview` はビルド後にローカルで Workers ランタイムに近い環境を起動するため、開発サーバーでは見つからない実行時エラーを確認できます。

preview はローカルサーバーを起動したままにするコマンドです。確認が終わったら `Ctrl+C` で停止します。

CI では常駐する `preview` ではなく、OpenNext の変換まで確認する `opennextjs-cloudflare build` を使います。

### 確認ポイント

- Next.js の開発サーバーがエラーなく起動するか
- ブラウザで画面が表示されるか
- `pnpm run preview` で Cloudflare Workers 向けの実行確認ができるか
- コンソールに想定外のエラーが出ていないか

### ローカル Supabase を使う場合（Supabase 案件のみ）

Docker が起動していることを確認してから、ローカル Supabase を起動します。

```bash
pnpm exec supabase init
pnpm exec supabase start
```

起動後、接続情報を確認します。

```bash
pnpm exec supabase status
```

Supabase への接続エラーが出る場合は、`.env.local` の値が正しいか、ローカル Supabase が起動しているかを確認してください。

#### トラブルシューティング: `supabase start` で `.gitkeep` migration が skip される

`supabase/migrations/` に `.gitkeep` を置いていると、`supabase start` や `supabase db reset` の実行時に次のような警告が出ます。

```text
Skipping migration .gitkeep... (file name must match pattern "<timestamp>_name.sql")
```

Supabase CLI は `supabase/migrations/` 配下のファイルを migration として扱うため、`.gitkeep` は置かないでください。初回時点で migration がない場合は、空ディレクトリのままにします。Git には空ディレクトリが残らないため、最初の migration を作成するタイミングで `supabase/migrations/<timestamp>_name.sql` を追加します。

```bash
rm -f supabase/migrations/.gitkeep
pnpm exec supabase migration new create_initial_schema
```

---

## 12. CI 設定を追加する

初回セットアップ時に、最低限の CI 設定を含めておくことを推奨します。

CI を追加する前に、`package.json` で Node.js と pnpm のバージョン方針を明示します。`pnpm/action-setup@v4` は pnpm のバージョンを推測できない場合があるため、`packageManager` は必須です。

```json
{
	"packageManager": "pnpm@11.1.1",
	"engines": {
		"node": ">=22.13.0"
	}
}
```

### GitHub Actions の設定例

`.github/workflows/ci.yml` を作成します。

```yaml
name: CI

on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
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

> [!important]
> `permissions: contents: read` を明示することで、`GITHUB_TOKEN` の権限を最小限に制限しています。これを省略すると、リポジトリ設定によっては不要に広い権限で CI が実行される可能性があります。

> [!warning]
> `packageManager` がない状態で `pnpm/action-setup@v4` を使うと、`No pnpm version is specified.` で CI が失敗します。また、pnpm のバージョンが Node.js 22.13.0 以上を要求しているのに CI が Node.js 20 系だと、`node:sqlite` が見つからず失敗することがあります。

### CI で最低限チェックする項目

- `pnpm install --frozen-lockfile` — 依存関係の再現性確認
- `pnpm run lint` — コード品質チェック
- `pnpm run build` — Next.js の通常ビルド確認
- `pnpm exec opennextjs-cloudflare build` — Cloudflare Workers 向けのOpenNext変換確認

### 必要に応じて追加する項目

- `pnpm run type-check` — 型チェック（`tsc --noEmit`）
- `pnpm run test` — テスト実行
- E2E テスト
- `pnpm exec wrangler deploy --dry-run` 相当のデプロイ前検証

### 注意

- CI 設定ファイルは初回コミットに含めてください
- main ブランチの保護設定で CI 通過を必須にすることを推奨します

---

## 13. 変更内容を確認する

commit 前に、必ず状態と差分を確認します。

```bash
git status
git diff
```

不要なファイルが含まれていないことを確認してください。

> [!warning]
> **`.pnpm-store/` がステージングされていないか確認する**
>
> pnpm v10 以降、`node_modules/.pnpm` とは別に `.pnpm-store/` ディレクトリがプロジェクト直下に作成される場合があります。このディレクトリには pnpm の内部データベース（`index.db` などのバイナリファイル）が含まれており、Git 管理すべきではありません。
>
> `git status` で `.pnpm-store/` が表示された場合は、以下を実施してください。
>
> ```bash
> # ステージングから外す
> git rm --cached -r .pnpm-store/
>
> # .gitignore に追加（未追加の場合）
> echo '/.pnpm-store' >> .gitignore
> ```
>
> `.gitignore` に `/.pnpm-store` が含まれていることを確認してから、再度 `git add .` してください。

---

## 14. 初回 commit を作成する

初回プロジェクト構成一式をステージングして commit します。

```bash
git add .
git status
git diff --cached
git commit -m "chore: initialize Next.js project"
```

commit 後、履歴を確認します。

```bash
git log --oneline
```

---

## 15. chore/init ブランチを push する

`chore/init` ブランチを GitHub へ push します。

```bash
git push -u origin chore/init
```

`-u` を付けることで、以後 `git push` / `git pull` の対象 branch が `origin/chore/init` に紐付きます。

---

## 16. Pull Request を作成する

GitHub の画面、または GitHub CLI で `chore/init` から `main` への Pull Request を作成します。

### GitHub 画面から作成する場合

1. GitHub の repository を開く
2. `Compare & pull request` を押す
3. base branch が `main` になっていることを確認する
4. compare branch が `chore/init` になっていることを確認する
5. title と description を入力する
6. reviewer を設定する
7. **Create pull request** を押す

### GitHub CLI で作成する場合

```bash
gh pr create --base main --head chore/init --title "chore: initialize Next.js project" --body "初回プロジェクト構成を追加します。"
```

### main を base に選べない場合

GitHub 上に `main` ブランチが存在しない可能性があります。

「7. 現在の状態を確認する」の「空の repository で main ブランチを作成する」の手順を実施したか確認してください。

実施済みでも `main` が選べない場合は、自己判断で `chore/init` を既定ブランチにしたり、main へ直接 push したりせず、repository 管理者に確認してください。

> [!note]
> **`gh pr view` で `Projects (classic) is being deprecated` と表示される場合**
>
> これは GitHub 側の Classic Projects 機能の廃止に伴う警告であり、PR 自体は正常に作成されています。PR の URL が出力されていれば問題ありません。ブラウザで URL を開いて PR の内容を確認してください。

---

## 17. PR 作成後に確認すること

PR 作成後、以下を確認します。

- base が `main` になっている
- compare が `chore/init` になっている
- 変更ファイルが初回プロジェクト構成として必要な範囲に収まっている
- 不要なファイルや秘密情報が含まれていない
- reviewer が設定されている
- CI がある場合は成功している

初回のプロジェクト初期化でも、PR 経由で確認してから main に取り込みます。

---

## 18. PR をマージする

レビューまたは確認が完了したら、PR を `main` にマージします。

### 推奨

通常は GitHub 画面から **Squash and merge** または **Merge pull request** を選択します。

チームでマージ方式が決まっている場合は、その方式に従ってください。

### マージ前の確認

- reviewer の承認または確認がある
- CI がある場合は成功している
- base branch が `main` である
- 変更内容が初回プロジェクト構成として妥当である

---

## 19. ローカルの main を最新化する

PR をマージしたら、ローカルの `main` を最新化します。

```bash
git switch main
git pull origin main
```

最新の情報が取得できていることを確認します。

```bash
ls
git log --oneline
```

---

## 20. chore/init ブランチを削除する

マージ済みの `chore/init` ブランチは削除します。

### ローカルブランチを削除する

```bash
git branch -d chore/init
```

### GitHub 側のブランチを削除する

GitHub の PR 画面で **Delete branch** を押します。

CLI で削除する場合は以下を実行します。

```bash
git push origin --delete chore/init
```

---

## 21. 完了チェックリスト

初回プロジェクト作成が完了したら、以下を確認してください。

- GitHub に空の repository を作成した
- repository は必要に応じて Private になっている
- README / .gitignore / License を GitHub 側で自動追加していない
- HTTPS URL で clone した
- 空の repository の場合、`main` ブランチを作成して push した
- GitHub CLI で認証できている
- `chore/init` ブランチを作成した
- `pnpm create cloudflare@latest . --framework=next` でNext.jsプロジェクトを作成した
- `wrangler.jsonc`、`open-next.config.ts`、`cloudflare-env.d.ts`、`public/_headers` が存在することを確認した
- `wrangler.jsonc` の `name` と `compatibility_date` をplaceholderのままにしていない
- `pnpm-workspace.yaml` を作成し、`minimumReleaseAge: 1440` を設定した
- フォルダ構成を `docs/coding-guide/11_nextjs-folder-structure-guide.md` に合わせた
- `README.md` を作成した
- `.env.example` を作成し、必要な環境変数のダミー値を記載した
- `.env.local` を作成し、実際の接続情報を設定した
- `.dev.vars.example` を作成し、`NEXTJS_ENV=development` を記載した
- `.dev.vars` を作成した
- `.env.local` が `.gitignore` に含まれていることを確認した
- `.dev.vars` が `.gitignore` に含まれていることを確認した
- Next.js の起動確認ができた
- Cloudflare Workers 向けの `pnpm run preview` 確認ができた
- Supabase 案件の場合、ローカル Supabase の起動確認ができた
- `.github/workflows/ci.yml` を作成し、CI 設定を追加した
- CI で `pnpm run lint`、`pnpm run build`、`pnpm exec opennextjs-cloudflare build` を実行するようにした
- `chore: initialize Next.js project` で commit した
- `chore/init` ブランチを push した
- `chore/init` から `main` への PR を作成した
- PR の base が `main` であることを確認した
- PR をマージした
- ローカルの `main` を最新化した
- マージ済みの `chore/init` ブランチを削除した

この状態になっていれば、初回のプロジェクト作成は完了です。
