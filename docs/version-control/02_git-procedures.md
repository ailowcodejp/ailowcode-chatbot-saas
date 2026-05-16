# Git 操作手順

この手順書は、正規ガイドラインである `Git_GitHub_運用ガイドライン.md` に従い、このプロジェクトで日常的に使う Git / GitHub 操作をまとめたものです。

このプロジェクトでは、**`main` を唯一の基準ブランチ**として扱います。`develop` や `dev` などの長期運用ブランチは作成せず、すべての変更は `main` から作成した短命ブランチで行い、Pull Request（PR）経由で `main` にマージします。

---

## 1. 基本ルール

- `main` への直接 push は禁止する
- 作業は必ず `main` から作成した作業ブランチで行う
- 変更は Pull Request 経由で `main` にマージする
- 作業ブランチは短命にし、PR マージ後に削除する
- コミットメッセージは **プレフィックスは英語、説明は日本語** で書く
- `.env.local` や秘密情報は絶対にコミットしない
- DB スキーマ変更は migration と型更新を同じ PR に含める

---

## 2. 作業開始

作業を始める前に、必ず `main` を最新化します。

```bash
git switch main
git pull origin main
```

次に、作業内容に合ったブランチを作成します。

```bash
git switch -c feature/add-auth-pages
```

### ブランチ名の例

```bash
feature/add-auth-pages
fix/session-refresh-bug
refactor/auth-server-actions
chore/update-eslint-config
docs/update-setup-guide
test/add-auth-flow-test
```

### ブランチプレフィックス

- `feature/`: 機能追加
- `fix/`: バグ修正
- `refactor/`: リファクタリング
- `chore/`: 雑務、設定変更、依存更新
- `docs/`: ドキュメント更新
- `test/`: テスト追加・修正

---

## 3. 実装中の確認

現在の状態を確認します。

```bash
git status
```

未ステージの差分を確認します。

```bash
git diff
```

不要なファイル、秘密情報、意図しない変更が含まれていないか確認してください。

---

## 4. ステージング

原則として、必要なファイルを明示的に追加します。

```bash
git add app/login/page.tsx
git add components/auth/login-form.tsx
git add lib/supabase/server.ts
```

複数ファイルをまとめて追加する場合でも、ステージ後の差分を必ず確認します。

```bash
git add .
git diff --cached
```

`git add .` を使う場合は、不要ファイルや秘密情報が含まれていないことを確認してからコミットしてください。

---

## 5. コミット

コミットメッセージは、英語プレフィックスと日本語説明で書きます。

```bash
git commit -m "feat: Supabase認証ページを追加"
```

### コミットメッセージ例

```bash
feat: ログイン画面を追加
fix: セッション更新処理の不具合を修正
refactor: 認証処理を server action に整理
chore: ESLint 設定を更新
docs: README に初期設定手順を追記
test: 認証フローのテストを追加
```

---

## 6. PR 作成前チェック

PR を作成する前に、ローカルで最低限以下を確認します。

```bash
git status
git diff
git diff --cached
pnpm install
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build
```

### 確認内容

- `git status`: コミット漏れや不要ファイルがないか
- `git diff`: 未ステージ変更が残っていないか
- `git diff --cached`: コミット予定の内容が正しいか
- `pnpm run lint`: コード品質に問題がないか
- `pnpm run build`: Next.js の本番ビルドが通るか
- `pnpm exec opennextjs-cloudflare build`: Cloudflare Workers 向けの OpenNext 変換が通るか

型チェック専用スクリプトが必要になった場合は、`package.json` に `type-check` を追加し、CI と docs も同じ変更で更新します。

```json
{
	"scripts": {
		"type-check": "tsc --noEmit"
	}
}
```

---

## 7. push

確認が完了したら、作業ブランチをリモートへ push します。

```bash
git push -u origin feature/add-auth-pages
```

2 回目以降の push は以下で実行できます。

```bash
git push
```

---

## 8. Pull Request 作成

GitHub 上で `main` 向けの Pull Request を作成します。

### PR の原則

- 1 PR 1 目的にする
- 関係ない変更を混ぜない
- できるだけ小さく保つ
- レビューしやすい単位で提出する
- CI が失敗している PR はマージしない

### PR タイトル例

```text
feat: Supabase認証画面を追加
fix: ログイン状態判定の不具合を修正
refactor: middleware の認証処理を整理
```

### PR 本文に書く内容

- 変更の目的
- 主な変更内容
- 確認方法
- 影響範囲
- 未対応事項
- DB 変更がある場合は migration / 型更新の有無
- UI 変更がある場合はスクリーンショット

---

## 9. レビューとマージ

- PR は少なくとも 1 名の承認を得てからマージする
- CI が成功してからマージする
- 指摘対応後は必要に応じて再レビューを依頼する
- 作成者本人のみの判断でマージしない
- 緊急対応を除き、レビューなしマージは行わない

マージ方式は **Squash merge** を基本とします。

---

## 10. PR マージ後の後処理

PR が `main` にマージされたら、ローカルの `main` を最新化します。

```bash
git switch main
git pull origin main
```

次に、マージ済みのローカルブランチを削除します。

```bash
git branch -d feature/add-auth-pages
```

リモートブランチも不要であれば削除します。

```bash
git push origin --delete feature/add-auth-pages
```

通常は `git branch -d` を使用します。`git branch -D` は強制削除のため、マージ状況を確認したうえで必要な場合のみ使用してください。

---

## 11. DB / Supabase 変更時

DB スキーマ変更がある場合は、コード変更だけでなく migration と型更新も同じ PR に含めます。

### 必須対応

- migration file を作成する
- 型定義を更新する
- ローカルで migration 適用を確認する
- 破壊的変更がある場合は PR に明記する
- RLS ポリシー、function、trigger の変更も DB 変更として扱う

### PR で確認すること

- ローカル環境で migration を適用できるか
- アプリ側の型エラーが解消されているか
- 既存データへの影響がないか
- 本番適用時のリスクがないか

---

## 12. 秘密情報の扱い

- `.env.local` はコミットしない
- 秘密情報をコードに直書きしない
- `SUPABASE_SERVICE_ROLE_KEY` をクライアントサイドで使用しない
- サーバー専用の秘密情報はサーバー側のみで扱う
- 漏えいが疑われる場合は、すぐにキーをローテーションする

コミット前に必ず差分を確認してください。

```bash
git diff
git diff --cached
```

---

## 13. リリース手順

このプロジェクトでは、`main` を常にリリース可能な状態に保ちます。

リリース前に `main` を最新化し、チェックを実行します。

```bash
git switch main
git pull origin main
pnpm install
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build
```

問題がなければ、リリース対象の `main` のコミットにタグを付けます。

```bash
git tag v1.0.0
git push origin v1.0.0
```

日付ベースで運用する場合は、チーム内で命名規則を統一します。

```bash
git tag release-2026-04-17
git push origin release-2026-04-17
```

---

## 14. stash の使い方

`git stash` は、コミット前の変更を一時退避するための補助手段です。常用せず、できるだけ小さくコミットすることを優先します。

現在の変更を退避します。

```bash
git stash push -m "auth-page-wip"
```

未追跡ファイルも含める場合:

```bash
git stash push -u -m "auth-page-wip"
```

stash 一覧を確認します。

```bash
git stash list
```

最新の stash を復元して削除します。

```bash
git stash pop
```

特定の stash を削除せず復元します。

```bash
git stash apply stash@{1}
```

不要な stash を削除します。

```bash
git stash drop stash@{0}
```

---

## 15. トラブル時の確認

認証、push、pull で問題が出た場合は、まず以下を確認します。

```bash
gh auth status
git remote -v
git status
git branch
git branch -vv
```

このプロジェクトでは、GitHub 接続は HTTPS、認証は GitHub CLI を標準とします。

---

## 16. 日常作業の最小ワークフロー

```bash
git switch main
git pull origin main
git switch -c feature/add-auth-pages
```

実装後:

```bash
git status
git diff
git add app/login/page.tsx
git add components/auth/login-form.tsx
git diff --cached
git commit -m "feat: Supabase認証ページを追加"
```

PR 作成前:

```bash
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build
git push -u origin feature/add-auth-pages
```

その後、GitHub 上で PR を作成し、レビュー承認と CI 通過後に `main` へ Squash merge します。
