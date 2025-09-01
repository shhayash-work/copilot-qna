#!/bin/bash

# Jira Forge Copilot Q&A ガジェット用 Docker環境セットアップスクリプト

echo "=== Docker環境セットアップ開始 ==="

# Dockerが利用可能かチェック
if ! command -v docker &> /dev/null; then
    echo "❌ エラー: Dockerがインストールされていません"
    echo "   Dockerをインストールしてから再実行してください"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ エラー: docker-composeがインストールされていません"
    echo "   docker-composeをインストールしてから再実行してください"
    exit 1
fi

echo "✅ Docker環境が利用可能です"

# 必要ファイルの確認
echo ""
echo "=== 必要ファイルの確認 ==="

# .env.exampleファイルの確認
if [ ! -f ".env.example" ]; then
    echo "❌ エラー: .env.exampleファイルが見つかりません"
    echo "   プロジェクトが正しくセットアップされていない可能性があります"
    exit 1
fi

# .envファイルの確認
if [ ! -f ".env" ]; then
    echo "❌ .envファイルが見つかりません"
    echo ""
    echo "📋 以下の手順で.envファイルを作成してください："
    echo "   1. cp .env.example .env"
    echo "   2. .envファイルを編集してDEV_TUNNEL_URLとDEV_TUNNEL_TOKENを設定"
    echo "   3. 再度このスクリプトを実行"
    echo ""
    echo "💡 .envファイルを自動作成しますか？ (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cp .env.example .env
        echo "✅ .envファイルを作成しました"
        echo "⚠️  .envファイルを編集してDEV_TUNNEL_URLとDEV_TUNNEL_TOKENを設定してください"
        echo "   編集後、再度このスクリプトを実行してください"
        exit 0
    else
        echo "セットアップを中断しました"
        exit 1
    fi
fi

# .envファイルの内容確認
echo "✅ .envファイルが見つかりました"

# 重要な環境変数の確認
if ! grep -q "DEV_TUNNEL_URL=" .env || ! grep -q "DEV_TUNNEL_TOKEN=" .env; then
    echo "⚠️  警告: .envファイルにDEV_TUNNEL_URLまたはDEV_TUNNEL_TOKENが設定されていない可能性があります"
    echo "   .envファイルを確認してください"
fi

# 空の値をチェック
if grep -q "DEV_TUNNEL_URL=$" .env || grep -q "DEV_TUNNEL_TOKEN=$" .env; then
    echo "❌ エラー: DEV_TUNNEL_URLまたはDEV_TUNNEL_TOKENが空です"
    echo "   .envファイルを編集して適切な値を設定してください"
    exit 1
fi

echo "✅ 環境変数の設定を確認しました"

# Dockerイメージをビルド
echo ""
echo "=== Docker環境の構築 ==="
echo "Dockerイメージをビルド中..."

# 古いdocker-composeに問題があるため、直接dockerコマンドを使用
docker build -t copilot-qna-dev .

if [ $? -eq 0 ]; then
    echo "✅ Dockerイメージのビルドが完了しました"
else
    echo "❌ エラー: Dockerイメージのビルドに失敗しました"
    echo "   Dockerfileを確認してください"
    exit 1
fi

echo ""
echo "=== セットアップ完了 ==="
echo "🎉 Docker環境のセットアップが完了しました！"
echo ""
echo "📋 次のステップ："
echo "   1. 開発環境を起動: ./docker-dev.sh start"
echo "   2. コンテナに接続: ./docker-dev.sh shell"
echo "   3. Forgeトンネル起動: forge tunnel"
echo ""
echo "💡 便利なコマンド："
echo "   - 環境停止: ./docker-dev.sh stop"
echo "   - ログ確認: ./docker-dev.sh logs"
echo "   - 環境再構築: ./docker-dev.sh rebuild"
