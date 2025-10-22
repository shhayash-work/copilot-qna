# Jira Copilot Q&A ガジェット (A2Aプロトコル対応)

Jira Forgeを使用したカスタムダッシュボードガジェットです。**A2A (Agent-to-Agent) プロトコル**を使用してエージェントと通信し、Jiraに関する質問に答える機能を提供します。

## 🎯 特徴

- **A2Aプロトコル対応**: 標準的なAgent-to-Agentプロトコルで通信
- **リアルタイム応答**: ストリーミング通信による即座のレスポンス
- **思考プロセス表示**: エージェントの処理過程を可視化
- **エージェントプラットフォーム互換**: arise_agentなどのA2A対応エージェントと接続可能

## 📋 必要な環境

- Node.js 20.x 以上
- npm
- Forge CLI (`npm install -g @forge/cli`)
- A2A対応エージェント（例: arise_agent）
- DevTunnel（開発時）

## 🏗️ アーキテクチャ

```
Jiraガジェット (Forge)
  ↓ A2Aプロトコル
  ↓ (DevTunnel経由)
  ↓
A2Aエージェント (arise_agent/worker)
  ↓ Claude Agent SDK
  ↓
AWS Bedrock Claude
```

### A2Aプロトコルフロー

1. **エージェントカード取得**: `GET /.well-known/agent.json`
2. **メッセージ送信**: `POST /a2a/v1/messages/streaming`
3. **ストリーミング受信**: Server-Sent Events (SSE) 形式
4. **イベント処理**: task, status-update, artifact-update

## 🚀 セットアップ

### 1. リポジトリのクローンと依存関係のインストール

```bash
# Git clone
git clone https://github.com/shhayash-work/copilot-qna.git

# プロジェクトディレクトリへ移動
cd copilot-qna

# 依存関係のインストール（Forge CLI含む）
npm install

# フロントエンド依存関係のインストール
cd static/qna/
npm install --legacy-peer-deps
cd -
```

### 2. Forge CLI認証

```bash
# 環境変数ファイルを作成
cp .env.sample .env
nano .env  # FORGE_EMAILとFORGE_API_TOKENを入力

# 認証確認
npm run forge:whoami
```

> **💡 APIトークンの取得**: https://id.atlassian.com/manage/api-tokens

### 3. 外部アクセス許可の設定（必要に応じて）

`manifest.yml`の`permissions.external.fetch.backend`で、アクセス可能なドメインを指定します：

```yaml
permissions:
  external:
    fetch:
      backend:
        - '*.devtunnels.ms'  # DevTunnel全般を許可
        - 'localhost:*'      # ローカル開発用（オプション）
```

デフォルトでDevTunnelドメインが許可されているため、通常は変更不要です。本番環境では具体的なドメインを指定することを推奨します。

### 4. ビルドとデプロイ

```bash
# デプロイ（フロントエンドのビルド + Forgeデプロイを自動実行）
npm run forge:deploy

# Jiraサイトにインストール
npm run forge:install -- -e development --site https://your-site.atlassian.net/

# または既存アプリをアップグレード
npm run forge:install -- --upgrade -e development --site https://your-site.atlassian.net/
```

### 5. ガジェット設定

デプロイ後、Jiraダッシュボード上でガジェットを設定します。

1. Jiraダッシュボードにガジェットを追加
2. ガジェットの設定ボタン（⚙️）をクリック
3. 以下を入力：
   - **A2A Agent URL**: `https://your-agent-url.devtunnels.ms`
   - **DevTunnel Token**: `your-tunnel-token`（オプション）
4. 「接続テスト」ボタンでエージェントとの接続を確認
5. 「保存」をクリック

## 🔧 環境変数の設定

### Forge CLI認証用環境変数

`.env`ファイルを使用してForge CLIの認証を行います：

| 変数名 | 説明 | 必須 | 例 |
|--------|------|------|-----|
| `FORGE_EMAIL` | Atlassianアカウントのメールアドレス | ✅ | `user@example.com` |
| `FORGE_API_TOKEN` | Atlassian APIトークン | ✅ | `ATATT3xFfGF0...` |

```bash
# .envファイルを作成
cp .env.sample .env
nano .env  # FORGE_EMAILとFORGE_API_TOKENを入力

# 環境変数を読み込んで認証確認
export $(grep -v '^#' .env | xargs) && npx forge whoami
```

> **💡 APIトークンの取得方法**: https://id.atlassian.com/manage/api-tokens

### A2Aエージェント接続設定

A2AエージェントのURLとトークンは、Jiraダッシュボード上のガジェット設定画面で入力します。

詳細は「3. ガジェット設定」セクションを参照してください。

## 📁 ファイル構成

```
copilot-qna/
├── package.json            # Node.js依存関係（A2A SDK含む）
├── package-lock.json
├── manifest.yml            # Forgeアプリ設定
├── src/                    # バックエンドソースコード
│   └── index.js           # A2Aプロトコル対応Resolver
├── static/                 # フロントエンド
│   └── qna/
│       ├── package.json    # React依存関係
│       ├── package-lock.json
│       ├── public/         # 静的ファイル
│       ├── src/
│       │   ├── index.js    # エントリーポイント
│       │   └── App.js      # メインUIコンポーネント
│       └── build/          # ビルド済みファイル（自動生成）
├── README.md               # このファイル
├── MIGRATION_TO_A2A.md     # A2A移行ガイド
└── CHANGELOG.md            # 変更履歴
```

## 🔄 開発ワークフロー

### フロントエンド開発

```bash
cd static/qna/

# 開発サーバー起動（ホットリロード）
npm start

# コード編集...

# ビルド
npm run build
cd -
```

### バックエンド開発

```bash
# src/index.js を編集

# デプロイ（ビルド不要）
forge deploy -e development

# アップグレード
forge install --upgrade -e development --site https://your-site.atlassian.net/
```

### デバッグ

```bash
# Forgeログをリアルタイムで確認
forge logs --follow

# または
forge logs -f
```

### トンネル起動（開発時）

```bash
# Forgeトンネルを起動（ローカル開発）
forge tunnel

# 別ターミナルでコード変更を監視
# コード変更時に自動的にホットリロードされる
```

## 🐛 トラブルシューティング

### A2A接続エラー

```bash
# エージェントカードの確認
curl https://your-agent-url.devtunnels.ms/.well-known/agent.json

# 期待される出力:
# {
#   "name": "Agent Name",
#   "description": "...",
#   "url": "https://your-agent-url.devtunnels.ms/",
#   "capabilities": { "streaming": true }
# }
```

### Forge環境変数エラー

```bash
# 環境変数の確認
forge variables list

# A2A_AGENT_URLが設定されていない場合
forge variables set A2A_AGENT_URL "https://your-agent-url.devtunnels.ms"
```

### デプロイエラー

```bash
# ビルドエラーの場合
cd static/qna/
rm -rf node_modules/ build/
npm install
npm run build
cd -

# デプロイ
forge deploy -e development
```

### ログの確認

```bash
# Forgeログの確認
forge logs

# リアルタイムログ
forge logs -f

# 特定の環境のログ
forge logs -e development
```

## 📊 A2Aプロトコルの詳細

### エージェントカード

```json
{
  "name": "Agent Name",
  "description": "Agent Description",
  "url": "https://agent-url/",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true
  },
  "skills": [...]
}
```

### メッセージ送信

```javascript
POST /a2a/v1/messages/streaming
Content-Type: application/json

{
  "id": "request-uuid",
  "params": {
    "message": {
      "messageId": "message-uuid",
      "role": "user",
      "parts": [
        {
          "kind": "text",
          "text": "Your question here"
        }
      ],
      "kind": "message"
    }
  }
}
```

### ストリーミングレスポンス

```
event: task
data: {"kind":"task","id":"task-123","status":{"state":"working"}}

event: status-update
data: {"kind":"status-update","taskId":"task-123","status":{...}}

event: artifact-update
data: {"kind":"artifact-update","taskId":"task-123","artifact":{...}}
```

## 🔐 セキュリティ

- DevTunnelトークンは環境変数で管理
- Forge環境変数は暗号化されて保存
- manifest.ymlでアクセス可能なURLを制限
- 本番環境では適切な認証・認可を実装してください

## 📚 参考資料

- [A2Aプロトコル仕様](https://github.com/anthropics/anthropic-sdk-typescript/tree/main/packages/a2a)
- [Jira Forge Documentation](https://developer.atlassian.com/platform/forge/)
- [Forge CLI Reference](https://developer.atlassian.com/platform/forge/cli-reference/)

## 🆕 更新履歴

### v1.2.0 (2025-10-21)
- **A2Aプロトコル対応**: 独自APIからA2A標準プロトコルへ移行
- **ストリーミング通信**: リアルタイムレスポンス対応
- **思考プロセス表示**: エージェントの処理過程を可視化
- **Docker削除**: シンプルな構成に変更（Node.js直接実行）
- **不要ファイル削除**: View.js, Edit.js, App.jsbck, Docker関連ファイルを削除

### v1.1.x
- 独自API (`/submit`, `/result`) による通信
- ポーリングベースの結果取得
- Docker環境での開発

## 📞 サポート

問題が発生した場合は、以下の情報を含めてお問い合わせください：

- 実行環境（OS、Node.jsバージョン）
- エラーメッセージ
- Forgeログ（`forge logs`）
- A2Aエージェントのログ
- 環境変数設定（認証情報は除く）
