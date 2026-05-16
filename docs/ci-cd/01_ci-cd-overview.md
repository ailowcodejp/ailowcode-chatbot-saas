# CI/CD パイプライン

このガイドでは、AILowcode プロジェクトにおける CI/CD（継続的インテグレーション / 継続的デリバリー）のパイプライン構築と運用方針を定めます。

## 対象プロジェクト

- Next.js + Cloudflare Workers 構成のアプリケーション
- GitHub Actions を CI/CD 基盤として使用

## ドキュメント一覧

| No  | ドキュメント              | 内容                     |
| --- | ------------------------- | ------------------------ |
| 01  | 概要（本ドキュメント）    | CI/CD 全体の方針と構成   |
| 02  | GitHub Actions 設定       | ワークフローの構築手順   |
| 03  | テスト自動化              | CI 上でのテスト実行      |
| 04  | Cloudflare デプロイ自動化 | 本番環境への自動デプロイ |

## 基本方針

- Pull Request 作成時に CI を実行する
- 初期状態の CI は `pnpm install --frozen-lockfile`、`pnpm run lint`、`pnpm run build`、`pnpm exec opennextjs-cloudflare build` を必須チェックにする
- main ブランチへのマージ時の Cloudflare 自動デプロイは、デプロイ用 workflow を追加した段階で有効化する
- 環境変数やシークレットは GitHub Secrets / Cloudflare の環境変数管理に置き、リポジトリにはコミットしない

## 現在の CI 構成

現時点の `.github/workflows/ci.yml` は Pull Request 向けの検証のみを行います。

```yaml
on:
  pull_request:
    branches: [main]
```

実行項目は以下です。

- `pnpm install --frozen-lockfile`
- `pnpm run lint`
- `pnpm run build`
- `pnpm exec opennextjs-cloudflare build`

## 実装時の必須方針

- `test`、`type-check`、E2E、DB migration 検証のスクリプトを追加した場合は、CI にも追加する
- Stripe webhook、LLM Gateway、Supabase Auth、RLS、クレジット残高など、事故時の影響が大きい処理は CI か明示的な手動検証手順を用意する
- Cloudflare 自動デプロイを追加する場合は、PR CI と deploy job を分離し、deploy job には最小権限の secret だけを渡す
- 本番デプロイ用 workflow を追加した場合は、このドキュメントと `docs/deployment/nextjs-cloudflare-workers-deploy.md` を更新する
