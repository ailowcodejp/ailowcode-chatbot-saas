# 検証とテスト

## 基本方針

このプロジェクトでは、コード品質の担保と事故防止を目的として、以下の3段階で検証を行います。

1. **コミット時**：pre-commit フックによる自動チェック
2. **PR 前**：ローカルでの手動確認
3. **マージ前**：CI による自動チェック

---

## コミット時の自動チェック（pre-commit フック）

`husky` と `lint-staged` による pre-commit フックを導入しています。

コミット実行時にステージングされたファイルに対してチェックが走り、**問題がある場合はコミットがキャンセル**されます。

詳細は `docs/version-control/05_pre-commit-hooks.md` を参照してください。

---

## PR 前のローカル確認

PR を出す前に、最低限以下を確認します。

```bash
pnpm install
pnpm run lint
pnpm run build
pnpm exec opennextjs-cloudflare build
```

### Next.js / Supabase 案件で追加確認したいもの

- ログイン / ログアウトを実装した場合、SSR Auth の cookie 更新とリダイレクトを確認する
- チャットを実装した場合、LLM Gateway の成功・失敗・タイムアウト・クレジット不足を確認する
- Stripe を実装した場合、checkout、webhook、サブスクリプション状態同期、重複イベントを確認する
- Supabase のテーブルを追加した場合、migration 適用、RLS、型生成後の型エラーを確認する
- 環境変数を追加した場合、`.env.example`、`.dev.vars.example`、CI / Cloudflare 側の設定要否を確認する
- Cloudflare Workers で動かす処理は `pnpm run preview` で runtime 上の挙動を確認する

---

## CI による自動チェック

main にマージする前提として、CI 通過を必須にします。

### 最低限の標準項目

- `pnpm install --frozen-lockfile`
- `pnpm run lint`
- `pnpm run build`
- `pnpm exec opennextjs-cloudflare build`

### 実装時に追加する項目

- テストランナーを導入した場合は `pnpm run test`
- 型チェック専用スクリプトを追加した場合はそのスクリプト
- E2E テストを導入した場合は Playwright などの E2E 実行
- DB migration を追加した場合は `pnpm run db:reset` または同等の migration 検証

---

## Cloudflare Workers プレビュー

`pnpm run preview` を実行すると Workers ランタイム上でローカルプレビューできます。レビュアーはその確認結果をもとにブラウザ確認を行ってください。

詳細は `docs/version-control/03_branch-and-test-site.md` を参照してください。
