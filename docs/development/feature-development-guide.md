# 機能追加・修正開始手順

## 前提

このマニュアルは、初期セットアップ済みのプロジェクトで、日々の機能追加やバグ修正を行う際の標準的な作業フローです。

環境構築とプロジェクト初期化が完了していることを前提とします。

- プロジェクト初期化: `docs/new-project-setup-guide.md`
- フォルダ構成: `docs/coding-guide/11_nextjs-folder-structure-guide.md`

---

## 1. このマニュアルの目的

機能追加やバグ修正の作業を始めるたびに、手順のばらつきが起きないよう統一することを目的とします。

このマニュアルに沿うことで、以下を維持します。

- main が常に信頼できる状態であること
- 変更が小さく、レビューしやすいこと
- 秘密情報の混入やビルド破壊を防ぐこと

---

## 2. 作業開始前の確認

作業を始める前に、以下を確認してください。

- 担当するタスクや Issue が明確か
- 作業の影響範囲を把握しているか
- DB スキーマ変更が必要かどうか
- 環境変数の追加が必要かどうか
- 他メンバーの作業と競合しないか

---

## 3. main を最新化する

毎回の作業は、必ず最新の main を取得してから始めます。

```bash
git switch main
git pull origin main
```

依存関係が更新されている可能性があるため、以下も実行します。

```bash
pnpm install
```

---

## 4. 作業ブランチを作成する

main から作業内容に合ったブランチを作成します。

```bash
git switch -c feature/add-auth-pages
```

### ブランチ命名規則

- `feature/…` — 新機能追加
- `fix/…` — バグ修正
- `docs/…` — ドキュメント更新
- `chore/…` — 設定変更・依存更新など
- `refactor/…` — リファクタリング
- `test/…` — テスト追加・修正

### 命名ルール

- 英小文字を使う
- 単語区切りはハイフン `-` を使う
- スペースは使わない
- 日本語ブランチ名は使わない
- 何をするブランチか見て分かる名前にする

### ブランチ名の例

```text
feature/add-auth-pages
feature/create-dashboard
feature/add-supabase-storage
fix/login-redirect
fix/rls-policy-bug
docs/setup-manual
chore/update-env-example
refactor/split-supabase-client
test/add-auth-flow-test
```

---

## 5. 実装する

作業ブランチで実装を進めます。

### 意識すること

- 1つのブランチに変更を詰め込みすぎない
- UI 追加、DB スキーマ変更、認証処理追加、型更新を1コミットに全部混ぜない
- こまめにコミットし、コミット単位を小さく保つ

### Next.js / Supabase 案件での典型的な変更対象

- `src/app/` のページ・Route Handler 追加
- Server Component / Client Component の整理
- `src/lib/supabase/` の Supabase クライアント作成
- `src/features/` の業務機能単位の認証処理
- DB クエリ追加
- Storage 連携
- SQL マイグレーション追加
- 環境変数更新
- 型生成更新

フォルダ構成は、`docs/coding-guide/11_nextjs-folder-structure-guide.md` を正式な管理方針として確認してください。

---

## 6. DB スキーマ変更がある場合

DB に関わる変更がある場合は、マイグレーションと型更新をセットで行います。

### マイグレーション作成

```bash
pnpm exec supabase migration new create_profiles_table
```

作成後、生成された SQL ファイルに必要な変更を書きます。

### ローカル DB への反映

```bash
pnpm exec supabase db reset
```

### 型生成の更新

```bash
pnpm exec supabase gen types typescript --local > src/types/database.types.ts
```

### 確認ポイント

- 想定どおりにテーブルが作られるか
- RLS / policy が正しく動くか
- アプリコードが新スキーマと一致しているか
- 型生成が更新されているか

### 破壊的変更がある場合

以下のような変更は通常変更より慎重に扱います。

- カラム削除
- テーブル削除
- 制約変更
- データ形式変更
- 大幅な RLS / policy 変更

このような変更を含む場合は、PR 上で明示し、必要なら別途レビューや反映手順書を用意します。

---

## 7. 環境変数の追加がある場合

新しい環境変数が必要になった場合は、以下を行います。

### .env.example の更新

```env
NEW_VARIABLE=YOUR_NEW_VARIABLE
```

### .env.local の更新

実際の値を `.env.local` に追加します。

### 注意

- `.env.example` はダミー値のみ記載し、コミット対象にする
- `.env.local` は Git に含めない
- `NEXT_PUBLIC_` が付いた値はブラウザに公開される前提で扱う
- PR 本文に環境変数の追加があることを明記する

---

## 8. 変更内容を確認する

コミット前に、必ず状態と差分を確認します。

```bash
git status
git diff
```

### 特に確認すべきもの

- `.env.local` を誤って含めていないか
- `.next/` を含めていないか
- 一時デバッグコードを残していないか
- migration ファイルを入れ忘れていないか
- 型生成ファイルを更新し忘れていないか

---

## 9. ステージングとコミット

### ステージング

```bash
git add .
```

`git add .` を使う場合でも、必ず事前に `git status` / `git diff` を確認してください。

重要ファイルは個別に追加するほうが安全です。

```bash
git add src/app/login/page.tsx
git add src/lib/supabase/client.ts
git add src/types/database.types.ts
git add supabase/migrations/20260401_create_profiles.sql
```

### コミット

```bash
git commit -m "feat: add Supabase auth pages"
```

### コミットメッセージの prefix

- `feat:` — 新機能追加
- `fix:` — バグ修正
- `docs:` — ドキュメント更新
- `chore:` — 設定変更・依存更新など
- `refactor:` — リファクタリング
- `test:` — テスト追加・修正
- `style:` — コードスタイル修正（動作に影響しない変更）

---

## 10. ローカル確認

PR を出す前に、最低限以下を確認します。

```bash
pnpm install
pnpm run dev
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build
```

### Next.js / Supabase 案件で追加確認したいもの

- ログイン / ログアウトが正常に動くか
- リダイレクトが正しいか
- サーバー側データ取得が動くか
- 環境変数の読み込みが正しいか
- 本番 build が通るか
- RLS で意図どおりにアクセス制御されるか
- migration 適用後に動作するか
- 型更新後に型エラーが出ていないか

---

## 11. 作業ブランチを push する

```bash
git push -u origin feature/add-auth-pages
```

---

## 12. Pull Request を作成する

GitHub の画面、または GitHub CLI で作業ブランチから main への PR を作成します。

### GitHub CLI で作成する場合

```bash
gh pr create --base main --head feature/add-auth-pages --title "feat: add auth pages" --body "認証ページを追加します。"
```

### PR に書くとよい内容

- 何を追加・変更したか
- DB 変更があるか
- 環境変数追加があるか
- 動作確認項目
- migration 適用が必要か
- レビューで見てほしいポイント

### Next.js / Supabase 案件では特に書くべきこと

- RLS policy の追加有無
- Storage bucket の追加有無
- Edge Function の有無
- `.env.example` 更新有無
- 型生成更新有無
- 破壊的変更の有無

### セルフチェック

PR を出す前に、以下を確認します。

- `pnpm run lint` 実行済み
- `pnpm run build` 実行済み
- `pnpm exec opennextjs-cloudflare build` 実行済み
- migration 追加漏れなし
- 型生成更新漏れなし
- `.env.local` など秘密情報の混入なし

---

## 13. レビュー対応

レビューで指摘を受けたら、同じ作業ブランチで修正してコミット・push します。

```bash
# 修正を実施
git status
git diff
git add .
git commit -m "fix: address review feedback"
git push
```

---

## 14. マージ後の作業

PR が main にマージされたら、ローカルを更新します。

### main を最新化する

```bash
git switch main
git pull origin main
```

### 依存関係を更新する

```bash
pnpm install
```

### 不要になったブランチを削除する

ローカルブランチを削除します。

```bash
git branch -d feature/add-auth-pages
```

GitHub 側のブランチを削除します（GitHub の PR 画面で **Delete branch** を押すか、CLI で実行）。

```bash
git push origin --delete feature/add-auth-pages
```

---

## 15. 最小フローまとめ

日常作業の基本はこの流れです。

```bash
# 1. main を最新化
git switch main
git pull origin main
pnpm install

# 2. 作業ブランチを作成
git switch -c feature/add-auth-pages

# 3. 実装

# 4. 変更を確認
git status
git diff

# 5. ステージングとコミット
git add .
git commit -m "feat: add Supabase auth pages"

# 6. ローカル確認
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build

# 7. push
git push -u origin feature/add-auth-pages

# 8. PR を作成して main にマージ

# 9. マージ後にローカルを更新
git switch main
git pull origin main
pnpm install

# 10. ブランチ削除
git branch -d feature/add-auth-pages
```

---

## 16. 作業開始前チェックリスト

作業を始めるたびに、以下を確認してください。

- main を最新化した
- `pnpm install` を実行した
- 作業ブランチを main から作成した
- ブランチ名が命名規則に沿っている
- 担当タスクの影響範囲を把握している

---

## 17. PR 提出前チェックリスト

PR を出す前に、以下を確認してください。

- `git status` / `git diff` で差分を確認した
- `.env.local` や秘密情報が含まれていない
- `pnpm run lint` が成功した
- `pnpm run build` が成功した
- `pnpm exec opennextjs-cloudflare build` が成功した
- DB スキーマ変更がある場合、migration を作成した
- DB スキーマ変更がある場合、型生成を更新した
- 環境変数追加がある場合、`.env.example` を更新した
- PR 本文に変更内容・確認事項を記載した
