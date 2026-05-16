# pre-commit フック

## 目的

ソースコードの品質担保と修正忘れの防止を目的として、**husky** と **lint-staged** による pre-commit フックを導入しています。

コミットを実行すると、コードチェックが先に走ります。**コードに問題がある場合はコミットが強制的にキャンセル**されます。lint エラーなどを修正するまでコミットできません。

---

## 仕組み

- `husky` が Git の pre-commit フックを管理する
- `lint-staged` がステージングされたファイルのみに対してチェックを実行する
- チェックに失敗するとコミットがキャンセルされる

---

## セットアップ手順

### 1. インストール

```bash
pnpm add -D husky lint-staged
```

### 2. husky を初期化する

```bash
pnpm exec husky init
```

これにより `.husky/pre-commit` ファイルと `package.json` の `prepare` スクリプトが自動生成されます。

### 3. `.husky/pre-commit` を編集する

```bash
pnpm exec lint-staged
```

### 4. `package.json` に lint-staged の設定を追加する

```json
{
	"lint-staged": {
		"*.{ts,tsx}": ["eslint --fix", "prettier --write"],
		"*.{css,md}": "prettier --write"
	}
}
```

チェック対象のファイルや実行コマンドは案件に合わせて調整してください。

---

## GUI ツール（Fork など）を使う場合の注意事項

GUI ツールはターミナルを経由せずに Git 操作を行うため、Node.js のパスが認識されず、フックが実行されないことがあります。

### 対処方法

ホームディレクトリに `~/.config/husky/init.sh` を作成し、Node.js のパスを明示的に設定します。

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

husky はフック実行前にこのファイルを自動的に読み込みます。

---

## フックを一時的にスキップする場合

単一コミットでスキップ：

```bash
git commit -m "..." -n
```

複数のコマンドにわたってスキップ：

```bash
export HUSKY=0
git ...
unset HUSKY
```
