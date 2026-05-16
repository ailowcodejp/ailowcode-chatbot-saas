---
tags: [git, gitignore, security, best-practices]
category: ガイドライン
related_tools: [git, npm, pnpm, pypi]
difficulty: 初級者
estimated_read_time: 10分
last_updated: 2026-05-03
---

# .gitignore 設定ガイドライン

> `.gitignore` の適切な設定は、シークレット漏洩を防ぐ最も基本的かつ重要なセキュリティ対策です。

---

## 1. 目的

このガイドラインは、プロジェクトにおける `.gitignore` の設定基準を定め、認証情報やシークレットの漏洩を防止することを目的とします。

GitHub のデフォルトテンプレート（`node_modules`、`__pycache__`、`.DS_Store` 等）だけでは不十分です。AI コーディングツールの普及により、新たに除外すべきファイルが増えています。

---

## 2. 除外必須ファイルの分類

### 2-1. ティア 1：即座に金銭的損失を招くシークレット

| 対象                                                        | 説明                               |
| ----------------------------------------------------------- | ---------------------------------- |
| `.env`, `.env.local`, `.env.production`, `.env.development` | 環境変数（API キー等）             |
| `.claude/settings.json`                                     | API トークンを含む承認済みコマンド |
| `*.pem`, `*.key`                                            | SSL 証明書・秘密鍵                 |
| `credentials.json`, `service-account.json`                  | クラウドプロバイダーの認証情報     |
| `.npmrc`, `.pypirc`                                         | パッケージレジストリのトークン     |

### 2-2. ティア 2：アカウント乗っ取りを可能にするシークレット

| 対象                           | 説明                               |
| ------------------------------ | ---------------------------------- |
| `.aws/credentials`             | AWS 認証情報                       |
| `.ssh/id_rsa`, `.ssh/config`   | SSH 秘密鍵・設定                   |
| `.docker/config.json`          | Docker レジストリ認証              |
| `.kube/config`                 | Kubernetes クラスターアクセス      |
| `.terraform/terraform.tfstate` | パスワードを平文で含むインフラ状態 |

### 2-3. ティア 3：公開すべきではない情報

| 対象                    | 説明                               |
| ----------------------- | ---------------------------------- |
| `.vscode/settings.json` | トークンを含む場合がある           |
| `.idea/`                | DB パスワードを含む JetBrains 設定 |
| `*.sqlite`, `*.db`      | ユーザーデータを含むローカル DB    |
| `coverage/`             | 内部ファイルパスが露出する         |
| `.claude/memory/`       | プロジェクトに関する AI のメモ     |

---

## 3. AI ツール設定の除外

AI コーディングツールのディレクトリは、API トークンやプロジェクト情報を含む可能性があるため、必ず除外してください。

```text
# AIツール設定
.claude/
.cursor/
.aider*
.continue/
.cody/
.codex/
```

特に `.claude/` ディレクトリは、`settings.json` に API トークンを含む bash コマンドが保存される場合があります。これが `.gitignore` にない場合、パッケージ公開時にパブリックレジストリへ送信されるリスクがあります。

---

## 4. 環境ファイルの除外

```text
# 環境ファイル（すべてのバリアント）
.env
.env.*
!.env.example
```

`!.env.example` の例外により、テンプレートファイル（ダミー値付き）はコミット可能です。新しいチームメンバーがどの環境変数を設定すべきかを把握できるようにしてください。

---

## 5. クラウド認証情報の除外

```text
# クラウド認証情報
.aws/
.azure/
.gcloud/
.terraform/terraform.tfstate
.terraform/terraform.tfstate.backup
```

Terraform ステートファイルは、データベースパスワードや API キーを平文で保存します。特に注意が必要です。

---

## 6. 既にコミットされたファイルの対処

**重要：** `.gitignore` への追加は将来のコミットのみを防ぎます。既にコミット済みのファイルは git 履歴に残ります。

### 6-1. 追跡から除外する（ローカルファイルは保持）

```bash
git rm --cached .env
git commit -m "chore: remove .env from tracking"
```

### 6-2. git 履歴全体から削除する

```bash
# BFG Repo-Cleaner を使用
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### 6-3. 対処後の必須アクション

- 対象ファイルに含まれていた **すべての認証情報をローテーション** する
- ボットはプッシュから数分以内にパブリックリポジトリをスキャンするため、漏洩した認証情報は既にスクレイプされたものと想定する

---

## 7. パッケージ公開時の注意事項

`.gitignore` は git リポジトリのみを保護します。パッケージ公開時には、別途以下の無視ファイルを設定してください。

| パッケージマネージャー | 無視ファイル                                               |
| ---------------------- | ---------------------------------------------------------- |
| npm                    | `.npmignore` または `package.json` の `"files"` フィールド |
| PyPI                   | `MANIFEST.in` または `pyproject.toml` の除外設定           |
| Ruby                   | `.gemspec` のファイルリスト                                |

### 公開前のドライラン確認（必須）

```bash
# npm - パッケージ化されるものを確認
npm pack --dry-run

# Python - sdist を確認
python -m build --sdist
tar -tzf dist/*.tar.gz | grep -E '\.env|\.claude|secret'
```

---

## 8. 言語別 .gitignore テンプレート

### 8-1. Node.js / TypeScript

```text
# 依存関係
node_modules/
.pnp.*

# ビルド
dist/
build/
.next/
out/

# 環境
.env
.env.*
!.env.example

# AIツール
.claude/
.cursor/
.aider*
.continue/
.cody/
.codex/

# シークレットと認証情報
*.pem
*.key
*.p12
*.pfx
credentials.json
service-account*.json
.npmrc
.aws/
.ssh/
.docker/config.json

# IDE
.vscode/settings.json
.idea/

# OS
.DS_Store
Thumbs.db

# ログとカバレッジ
*.log
coverage/
.nyc_output/

# Terraform
.terraform/
*.tfstate
*.tfstate.backup
```

### 8-2. Python

```text
# 仮想環境
venv/
.venv/
env/

# ビルド
__pycache__/
*.py[cod]
*.egg-info/
dist/
build/

# 環境
.env
.env.*
!.env.example

# AIツール
.claude/
.cursor/
.aider*
.continue/
.cody/

# シークレットと認証情報
*.pem
*.key
credentials.json
service-account*.json
.pypirc
.aws/
.ssh/

# IDE
.vscode/settings.json
.idea/

# OS
.DS_Store

# Jupyter
.ipynb_checkpoints/

# ログとカバレッジ
*.log
htmlcov/
.coverage

# Terraform
.terraform/
*.tfstate
*.tfstate.backup
```

### 8-3. Go

```text
# バイナリ
bin/
*.exe

# 環境
.env
.env.*
!.env.example

# AIツール
.claude/
.cursor/
.aider*
.continue/

# シークレット
*.pem
*.key
credentials.json
service-account*.json
.aws/
.ssh/

# IDE
.vscode/settings.json
.idea/

# OS
.DS_Store

# Vendor（オプション）
# vendor/

# カバレッジ
coverage.out
*.prof
```

---

## 9. プッシュ前チェックリスト

コードをプッシュする前に、以下を確認してください。

- [ ] `.claude/` が `.gitignore` に含まれているか
- [ ] すべての `.env` バリアントがカバーされているか（`.env`、`.env.*`、`!.env.example`）
- [ ] 以前にコミットされたシークレットについて git 履歴を確認したか
- [ ] パッケージを公開する場合：`.npmignore` / `MANIFEST.in` が設定されているか
- [ ] `npm pack --dry-run` で実際に送信されるファイルを確認したか
- [ ] クラウド認証情報ディレクトリ（`.aws/`、`.ssh/`）が除外されているか
- [ ] `.terraform/terraform.tfstate` が除外されているか

---

## 10. まとめ

`.gitignore` の適切な設定は、最も低コストかつ効果的なセキュリティ対策です。

全メンバーは以下を遵守してください。

- プロジェクト作成時に、本ガイドラインのテンプレートを基に `.gitignore` を設定する
- AI ツールを新たに導入した場合は、即座に `.gitignore` を更新する
- パッケージ公開前は必ずドライランで確認する
- 漏洩が疑われる場合は、直ちに認証情報をローテーションする
