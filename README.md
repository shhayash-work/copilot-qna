# Jira Copilot Q&A ガジェット

Jira Forgeを使用したカスタムダッシュボードガジェットです。Jiraに関する質問に答える機能を提供します。

## 必要な環境

- Docker & Docker Compose
- Visual Studio Code Dev Tunnels（開発時）

## Docker環境での開発セットアップ

### 1. 初回セットアップ

```bash
# プロジェクトディレクトリに移動
cd /home/user/Projects/dtu_dac/jira-agent/claude_hands2/workspace/copilot-qna

# 環境設定ファイルを作成
cp .env.example .env

# 必要に応じて.envファイルを編集
# DEV_TUNNEL_URLとDEV_TUNNEL_TOKENを適切な値に変更してください
```

### 2. Docker環境の構築

```bash
# Docker環境をセットアップ
./setup_docker_env.sh
```

### 3. 開発作業

```bash
# 開発環境を起動
./docker-dev.sh start

# コンテナのシェルに接続
./docker-dev.sh shell

# 初回のみ：Forgeにログイン（コンテナ内で実行）
# メールアドレスを入力
read FORGE_EMAIL
# APIトークンを入力（画面に表示されません）
read -s FORGE_API_TOKEN
# 環境変数として設定
export FORGE_EMAIL FORGE_API_TOKEN

# Forgeトンネルを起動（コンテナ内で実行）
forge tunnel

# 開発環境を停止
./docker-dev.sh stop
```

## Docker開発環境の詳細

### 環境構成

- **Python**: 3.12
- **Node.js**: 20.x
- **Forge CLI**: 最新版
- **開発ツール**: pytest, black, flake8, mypy
- **Jira API**: jira, atlassian-python-api

### 便利なコマンド

```bash
# Forgeコマンドを実行
./docker-dev.sh forge install
./docker-dev.sh forge deploy

# NPMコマンドを実行
./docker-dev.sh npm install
./docker-dev.sh npm run build

# Pythonコマンドを実行
./docker-dev.sh python script.py

# ログを確認
./docker-dev.sh logs

# 環境を再ビルド
./docker-dev.sh rebuild
```

## ファイル構成

```
copilot-qna/
├── Dockerfile              # Docker環境設定
├── docker-compose.yml      # Docker Compose設定
├── docker-dev.sh           # 開発用便利スクリプト
├── .dockerignore           # Docker除外ファイル設定
├── .env.example            # 環境変数のテンプレート
├── .env                    # 環境変数ファイル（手動作成）
├── setup_docker_env.sh      # Docker環境セットアップスクリプト
├── requirements.txt        # Python依存関係
├── package.json            # Node.js依存関係
├── manifest.yml            # Forgeアプリ設定
├── src/                    # ソースコード
│   └── index.js           # メインResolver（プロンプト拡張機能付き）
└── static/                 # 静的ファイル
```

## 環境変数の説明

### .envファイル

- `DEV_TUNNEL_URL`: 開発用トンネルのURL
- `DEV_TUNNEL_TOKEN`: 開発用トンネルの認証トークン

これらの値は開発環境に応じて適切に設定してください。

## プロンプト拡張機能

`src/index.js`にプロンプト拡張機能が実装されています。ガジェットからの質問に以下のガイドラインが自動で追加されます：

- 簡潔で分かりやすい回答
- 初心者向けの技術的説明
- Jira操作手順の詳細説明
- Slackエージェントとの連携指示

## 開発コマンド

### Forge認証設定（初回のみ、コンテナ内）

```bash
# Forgeにログインするための認証情報を設定
read FORGE_EMAIL
# Enter your Atlassian email address

read -s FORGE_API_TOKEN
# Enter your API token (will not be displayed)

export FORGE_EMAIL FORGE_API_TOKEN

# 認証確認
forge whoami
```

### Forgeアプリの操作（コンテナ内）

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

### コード変更時の必須手順

#### 1. static/qna/内のフロントエンドコードを変更した場合

```bash
# フロントエンドをビルド
cd static/qna/
npm run build
cd -

# アプリをデプロイ
forge deploy -e development

# アプリをアップグレード
forge install --upgrade -e development --site https://exec-dashboard-demo.atlassian.net/
```

#### 2. src/内のバックエンドコードを変更した場合

```bash
# アプリをデプロイ（ビルドは不要）
forge deploy -e development

# アプリをアップグレード
forge install --upgrade -e development --site https://exec-dashboard-demo.atlassian.net/
```

**重要**: コード変更後は必ずデプロイとアップグレードを実行してください。変更が反映されない場合があります。

### 環境変数の確認（コンテナ内）

```bash
# 現在のForge変数を確認
forge variables list

# 特定の変数を設定
forge variables set VARIABLE_NAME value
```

## トラブルシューティング

### Docker環境の問題

```bash
# コンテナの状態確認
docker-compose ps

# コンテナのログ確認
./docker-dev.sh logs

# 環境の完全リセット
docker-compose down -v
./docker-dev.sh rebuild
```

### .envファイルが見つからない場合

```bash
# .env.exampleをコピーして.envを作成
cp .env.example .env
```

### Forge認証エラーが発生する場合

```bash
# コンテナ内でForge認証を再設定
./docker-dev.sh shell

# 認証情報を設定
read FORGE_EMAIL
read -s FORGE_API_TOKEN
export FORGE_EMAIL FORGE_API_TOKEN

# 認証情報を確認
forge whoami
```

## 注意事項

- `.env`ファイルには機密情報が含まれるため、バージョン管理システムにコミットしないでください
- `DEV_TUNNEL_TOKEN`は定期的に更新される可能性があります
- Docker環境を使用することで、ホストシステムに影響を与えずに開発できます

## サポート

問題が発生した場合は、以下を確認してください：

1. Dockerが正しくインストールされているか
2. `.env`ファイルが正しく設定されているか
3. Docker環境が正常に起動しているか
4. コンテナ内でForge CLIが正しくログインされているか