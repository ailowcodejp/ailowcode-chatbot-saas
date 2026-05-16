---
tags: [claude-code, security, ai-tools, configuration, env]
category: ガイドライン
related_tools: [claude-code, git]
difficulty: 初級者
estimated_read_time: 15分
last_updated: 2026-05-13
---

# Claude Code セキュリティ設定ガイドライン

> [!warning]
> Claude Code はデフォルトでホストマシンへのフルアクセス権を持ちます。適切なセキュリティ設定を行わない場合、認証情報やシークレットの漏洩リスクがあります。
> Claude Code はプロジェクトを開いた瞬間に `.env` ファイルを読み取り、その内容が会話ログに含まれる可能性があります。`settings.json` の deny ルールによるシステムレベルの保護が必須です。

---

## 1. 目的

このガイドラインは、Claude Code を安全に利用するためのセキュリティ設定を標準化し、認証情報漏洩のリスクを最小化することを目的とします。特に `.env` ファイル内の機密情報（API キー、データベースパスワード等）が漏洩することを防止するための設定手順を定めます。

全メンバーは、Claude Code のインストール後に本ガイドラインに従ってセキュリティ設定を完了してください。

---

## 2. デフォルト状態のリスク

Claude Code は未設定の状態で、以下のファイルやコマンドに無制限でアクセスできます。

| 対象                 | リスク                       |
| -------------------- | ---------------------------- |
| `~/.ssh/`            | サーバーへの SSH 秘密鍵      |
| `~/.aws/`            | クラウド認証情報             |
| `~/.npmrc`           | pnpm/npm レジストリトークン  |
| `.env` ファイル      | API キー等のシークレット     |
| `curl`, `wget`, `nc` | 外部へのデータ送信           |
| `~/.bashrc`          | シェル初期化スクリプトの改変 |

主な攻撃ベクター：

- クローンしたリポジトリ内の `CLAUDE.md` に仕込まれたプロンプトインジェクション
- ライブラリ依存関係内の悪意あるコメント
- 悪意のある MCP サーバー設定

---

## 3. CLAUDE.md のルールだけでは不十分な理由

`CLAUDE.md` に「.env ファイルを読まないこと」と記載しても、以下の理由で保護は不完全です。

- `CLAUDE.md` はあくまで「提案」であり、複雑なタスクや長いコンテキストでは無視される場合がある
- `settings.json` の deny ルールは **システムレベル** で適用され、Claude がファイルを見る前にブロックする

「読まないでください」と「物理的に読めない」の違いを理解し、必ず `settings.json` で deny ルールを設定してください。

---

## 4. 機密情報が漏洩する 3 つの経路

| 経路                 | 説明                                            | 対策                             |
| -------------------- | ----------------------------------------------- | -------------------------------- |
| 直接ファイル読み取り | Claude がプロジェクトをスキャンし `.env` を開く | deny ルールでブロック            |
| 実行時出力キャプチャ | テスト実行時のエラーログに認証情報が含まれる    | `.env.test`（ダミー値）を使用    |
| Grep・検索ツール     | コード検索が認証情報を含むファイルにヒットする  | deny ルール + ファイル配置の工夫 |

経路 1 のみの対策では不十分です。全 3 経路への対策を実施してください。

---

## 5. 必須設定（レベル 1）

所要時間：約 15 分。全メンバー必須。

### 5-1. サンドボックスの有効化

Claude Code セッション内で以下を実行します。

```bash
/sandbox
```

「Auto-allow mode」を選択してください。

サンドボックスにより、OS レベル（macOS: Seatbelt、Linux: bubblewrap）でファイルアクセスが制限されます。deny ルールだけでは Bash コマンドでバイパスされる可能性があるため、サンドボックスの有効化は必須です。

**Linux の場合：** 事前に以下をインストールしてください。

```bash
sudo apt-get install bubblewrap socat
```

### 5-2. settings.json の設定

`~/.claude/settings.json` を作成または編集します。

```json
{
	"permissions": {
		"allow": [
			"Bash(pnpm *)",
			"Bash(pnpm dlx prettier *)",
			"Bash(pnpm dlx eslint *)",
			"Bash(git status)",
			"Bash(git diff *)",
			"Bash(git log *)",
			"Bash(git commit *)",
			"Bash(ls *)",
			"Bash(cat *)",
			"Bash(grep *)"
		],
		"deny": [
			"Read(~/.ssh/**)",
			"Read(~/.gnupg/**)",
			"Read(~/.aws/**)",
			"Read(~/.azure/**)",
			"Read(~/.kube/**)",
			"Read(~/.npmrc)",
			"Read(~/.git-credentials)",
			"Read(~/.config/gh/**)",
			"Read(**/.env*)",
			"Read(**/.dev.vars*)",
			"Read(**/*.pem)",
			"Read(**/*.key)",
			"Read(**/secrets/**)",
			"Read(**/credentials/**)",
			"Read(**/config/database.yml)",
			"Read(**/config/credentials.json)",
			"Read(**/.pypirc)",
			"Edit(~/.bashrc)",
			"Edit(~/.zshrc)",
			"Bash(curl *)",
			"Bash(wget *)",
			"Bash(nc *)",
			"Bash(ssh *)",
			"Bash(git push *)",
			"Write(**/.env*)",
			"Write(**/secrets/**)",
			"Write(**/.ssh/**)"
		]
	},
	"enableAllProjectMcpServers": false,
	"sandbox": {
		"filesystem": {
			"denyRead": ["./.env", "./.env.*"]
		}
	}
}
```

### 5-3. 各設定項目の説明

| 設定項目                            | 役割                                                                 |
| ----------------------------------- | -------------------------------------------------------------------- |
| `allow`                             | 安全な読み取り専用操作を許可。確認ポップアップを削減する             |
| `deny (Read)`                       | 認証情報ファイルへのアクセスを遮断する                               |
| `deny (Bash)`                       | 外部へのデータ持ち出しコマンドを阻止する                             |
| `deny (Read *.env)`                 | 環境ファイル経由のシークレット流出を防止する                         |
| `enableAllProjectMcpServers: false` | クローンしたリポジトリの悪意ある MCP 設定の自動読込を防止する        |
| `sandbox (denyRead)`                | `.env` に対する二重保護。Claude が起動したプロセスからもブロックする |

### 5-4. Claude Code のアップデート

```bash
claude update
```

既知の脆弱性に対するパッチを適用するため、月に 1 回以上実行してください。

---

## 6. 実行時の漏洩対策

deny ルールは直接のファイル読み取りをブロックしますが、コマンド実行時の出力に含まれる認証情報は防げません。

### 6-1. テスト用 .env.test の作成

ダミー値を持つテスト専用ファイルを用意します。

```text
# .env.test — ダミー値のみ。漏洩しても安全
STRIPE_SECRET_KEY=sk_test_not_a_real_key
DATABASE_URL=postgres://test:test@localhost:5432/testdb
OPENAI_API_KEY=sk-test-dummy-key-for-mocking
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

テストフレームワークは `.env` ではなく `.env.test` を参照するよう設定してください。Claude がテストを実行した際に出力される認証情報はすべてダミー値になります。

---

## 7. pre-commit フックによるシークレット検出

deny ルールに加え、コミット前に機密情報を検出する git pre-commit フックを設定します。

### 7-1. フックスクリプト

`.git/hooks/pre-commit` に以下を配置します。

```bash
#!/bin/bash
# .git/hooks/pre-commit — blocks commits containing secrets

PATTERNS=(
  'sk-ant-'           # Anthropic API keys
  'sk-live-'          # Stripe live keys
  'sk_live_'          # Stripe live keys (alt format)
  'ghp_'              # GitHub personal tokens
  'gho_'              # GitHub OAuth tokens
  'AKIA'              # AWS access keys
  'xox[bpors]-'       # Slack tokens
  'SG\.'              # SendGrid keys
  'eyJ'               # JWTs
  'BEGIN.*PRIVATE KEY' # Private key material
)

BLOCKED_FILES=('.env' 'credentials.json' 'id_rsa' '*.pem' '*.key')

for pattern in "${PATTERNS[@]}"; do
  if git diff --cached --diff-filter=ACM | grep -qE "$pattern"; then
    echo "BLOCKED: Found potential secret matching '$pattern'"
    echo "Remove the secret and try again."
    exit 1
  fi
done

for file in "${BLOCKED_FILES[@]}"; do
  if git diff --cached --name-only | grep -q "$file"; then
    echo "BLOCKED: Attempted to commit sensitive file: $file"
    exit 1
  fi
done

echo "Pre-commit security check passed."
exit 0
```

### 7-2. フックの有効化

```bash
chmod +x .git/hooks/pre-commit
```

---

## 8. 推奨設定（レベル 2）：Trail of Bits 構成

所要時間：約 30 分。セキュリティを重視するプロジェクト向け。

Trail of Bits 社が公開している、セキュリティ監査で使用される Claude Code 設定を導入します。

参照：[github.com/trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config)

### 8-1. インストール手順

```bash
claude plugin marketplace add trailofbits/skills
```

Claude Code セッション内で以下を実行します。

```bash
/trailofbits:config
```

アップデート後には再度実行してください。

### 8-2. 追加される機能

- **ワークフロー・フック** — コーディング前の計画立案、構造化されたデバッグ、出荷前の検証を強制
- **セキュリティ・スキル** — 脆弱性パターンの検出、分析チェックリストの自動適用
- **CLAUDE.md テンプレート** — 憶測による機能追加の禁止、依存関係の正当化を強制

---

## 9. 高度な隔離（レベル 3）：Devcontainer

所要時間：約 1 時間。信頼できないリポジトリを扱う場合に推奨。

Claude Code をコンテナ内で動作させ、ホストマシンへのアクセスをゼロにします。

参照：[github.com/trailofbits/claude-code-devcontainer](https://github.com/trailofbits/claude-code-devcontainer)

### 9-1. インストール手順

```bash
pnpm add -g @devcontainers/cli

git clone https://github.com/trailofbits/claude-code-devcontainer \
  ~/.claude-devcontainer

~/.claude-devcontainer/install.sh self-install
```

### 9-2. 信頼できないリポジトリでの使用方法

```bash
git clone <対象リポジトリ>
cd <リポジトリ名>
devc .         # テンプレートのインストール＋コンテナ起動
devc shell     # コンテナ内のシェルを開く
claude         # ホストへのアクセス権ゼロで動作
```

コンテナ内では `bypassPermissions` が有効になります。コンテナ自体がサンドボックスとして機能するため、追加の権限設定は不要です。

### 9-3. コンテナ分離（高セキュリティ環境向け）

本番認証情報を扱うプロジェクトでは、`.env` ファイルがコンテナ内に存在しない環境で Claude Code を実行します。

```bash
docker run -v /dev/null:/app/.env:ro your-dev-container
```

Claude から見た `.env` は空ファイルとなり、機密情報はコンテナ内に一切入りません。

---

## 10. 完全な settings.json（推奨設定）

allow ルールと deny ルールを組み合わせた完全な設定例です。

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "LS",
      "Edit",
      "MultiEdit",
      "Write(src/**)",
      "Write(tests/**)",
      "Bash(pnpm *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)"
    ],
    "deny": [
      "Read(**/.env*)",
      "Read(**/.dev.vars*)",
      "Read(**/*.pem)",
      "Read(**/*.key)",
      "Read(**/secrets/**)",
      "Read(**/credentials/**)",
      "Read(**/.aws/**)",
      "Read(**/.ssh/**)",
      "Read(**/config/database.yml)",
      "Read(**/config/credentials.json)",
      "Read(**/.npmrc)",  # .npmrcはpnpmでも使用されます
      "Read(**/.pypirc)",
      "Write(**/.env*)",
      "Write(**/secrets/**)",
      "Write(**/.ssh/**)",
      "Write(.github/workflows/*)",
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(git push *)",
      "Bash(pnpm publish *)",
      "Bash(curl * | sh)",
      "Bash(wget *)",
      "Bash(chmod *)"
    ],
    "defaultMode": "acceptEdits"
  }
}
```

---

## 11. 対応レベルの選択基準

| レベル                    | 所要時間 | 対象                         | カバー範囲                       |
| ------------------------- | -------- | ---------------------------- | -------------------------------- |
| レベル 1（settings.json） | 15 分    | 全メンバー必須               | 攻撃ベクターの約 90%             |
| レベル 2（Trail of Bits） | 30 分    | セキュリティ重視プロジェクト | 完全なセキュリティワークフロー   |
| レベル 3（Devcontainer）  | 1 時間   | 信頼できないコード           | ホストマシンへのアクセス完全遮断 |

---

## 12. セッション開始前チェックリスト

Claude Code を使用する前に、以下を確認してください。

- [ ] `settings.json` に `.env` ファイルの deny ルールが設定されているか
- [ ] サンドボックスが有効化されているか
- [ ] テストはダミー値を持つ `.env.test` を使用しているか
- [ ] 機密パターンをスキャンする pre-commit フックが設定されているか
- [ ] 本番認証情報は平文ファイルではなくシークレット管理ツールに保存されているか
- [ ] `.env` は `.gitignore` に含まれているか
- [ ] `.env` ファイルはプロジェクトディレクトリ外に配置されているか（推奨）

---

## 13. まとめ

全メンバーはレベル 1 の設定を必ず完了してください。

- Claude Code インストール直後に `/sandbox` を有効化し、`settings.json` を設定する
- `CLAUDE.md` のルールだけに頼らず、必ず `settings.json` の deny ルールを設定する
- テスト環境では `.env.test`（ダミー値）を使用し、実行時出力への漏洩を防止する
- pre-commit フックを導入し、コミット前の最終防衛線とする
- `claude update` を月 1 回以上実行する
- 信頼できないリポジトリをクローンする際は、レベル 3（Devcontainer）の使用を検討する
- 本番認証情報を扱う場合は、コンテナ分離を検討する
- セキュリティ上の懸念がある場合は、チーム内で即座に共有する
