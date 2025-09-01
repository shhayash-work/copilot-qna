# Jira Copilot Q&A ガジェット

注意:tachikoma環境では環境設定がうまくいってないので注意。dockerを立ち上げた中なら必要パッケージをインストール＋Forge環境設定をすれば動くはず。ただし、以下のREADME.mdは作成途中のため参考にしないように！！

Jira Forgeを使用したカスタムダッシュボードガジェットです。Jiraに関する質問に答える機能を提供します。

## 必要な環境

- Node.js 20.x
- Python 3.x
- Atlassian Forge CLI
- Visual Studio Code Dev Tunnels（開発時）

## セットアップ手順

### 1. 初回セットアップ

```bash
# プロジェクトディレクトリに移動
cd /home/user/Projects/dtu_dac/jira-agent/claude_hands2/workspace/copilot-qna

# 環境設定ファイルを作成
cp .env.example .env

# 必要に応じて.envファイルを編集
# DEV_TUNNEL_URLとDEV_TUNNEL_TOKENを適切な値に変更してください
```

### 2. Python仮想環境の作成と設定

```bash
# セットアップスクリプトを実行可能にする
chmod +x setup_python_env.sh

# Python仮想環境を作成し、環境変数を設定
./setup_python_env.sh
```

### 3. 通常の開発作業

```bash
# Python仮想環境をアクティベート
source venv/bin/activate

# Forge環境変数を設定（必要に応じて）
source forge_env.sh
```

## ファイル構成

```
copilot-qna/
├── .env.example          # 環境変数のテンプレート
├── .env                  # 環境変数ファイル（手動作成）
├── setup_python_env.sh   # Python環境セットアップスクリプト
├── forge_env.sh          # Forge環境変数設定スクリプト
├── venv/                 # Python仮想環境（自動作成）
├── package.json          # Node.js依存関係
├── manifest.yml          # Forgeアプリ設定
├── src/                  # ソースコード
└── static/               # 静的ファイル
```

## 環境変数の説明

### .envファイル

- `DEV_TUNNEL_URL`: 開発用トンネルのURL
- `DEV_TUNNEL_TOKEN`: 開発用トンネルの認証トークン

これらの値は開発環境に応じて適切に設定してください。

### Forge環境変数

以下の環境変数は`forge_env.sh`で自動的に設定されます：

- `FORGE_EMAIL`: Atlassianアカウントのメールアドレス
- `FORGE_API_TOKEN`: Forge APIトークン
- `CHOKIDAR_USEPOLLING`: ファイル監視設定

## 開発コマンド

### Forgeアプリの操作

```bash
# アプリをインストール
forge install

# 開発サーバーを起動
forge tunnel

# アプリをデプロイ
forge deploy

# ログを確認
forge logs
```

### 環境変数の確認

```bash
# 現在のForge変数を確認
forge variables list

# 特定の変数を設定
forge variables set VARIABLE_NAME value
```

## トラブルシューティング

### .envファイルが見つからない場合

```bash
# .env.exampleをコピーして.envを作成
cp .env.example .env
```

### Python仮想環境が作成できない場合

```bash
# Python 3が正しくインストールされているか確認
python3 --version

# 手動で仮想環境を作成
python3 -m venv venv
source venv/bin/activate
```

### Forge認証エラーが発生する場合

```bash
# Forgeにログイン
forge login

# 認証情報を確認
forge whoami
```

## 注意事項

- `.env`ファイルには機密情報が含まれるため、バージョン管理システムにコミットしないでください
- `DEV_TUNNEL_TOKEN`は定期的に更新される可能性があります
- 開発時は必ずPython仮想環境をアクティベートしてから作業してください

## サポート

問題が発生した場合は、以下を確認してください：

1. 必要な環境がすべてインストールされているか
2. `.env`ファイルが正しく設定されているか
3. Python仮想環境がアクティベートされているか
4. Forge CLIが正しくログインされているか