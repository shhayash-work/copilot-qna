#!/bin/bash

# Jira Forge Copilot Q&A ガジェット用 Python環境セットアップスクリプト

echo "=== Python仮想環境セットアップ開始 ==="

# 仮想環境が存在しない場合は作成
if [ ! -d "venv" ]; then
    echo "Python仮想環境を作成中..."
    python -m venv venv
    if [ $? -eq 0 ]; then
        echo "仮想環境の作成が完了しました"
    else
        echo "python3で再試行中..."
        python3 -m venv venv
        if [ $? -ne 0 ]; then
            echo "エラー: 仮想環境の作成に失敗しました"
            exit 1
        fi
    fi
else
    echo "仮想環境は既に存在します"
fi

# 仮想環境をアクティベート
echo "仮想環境をアクティベート中..."
source venv/bin/activate

# pipをアップグレード
echo "pipをアップグレード中..."
pip install --upgrade pip

# requirements.txtが存在する場合はライブラリをインストール
if [ -f "requirements.txt" ]; then
    echo "requirements.txtからライブラリをインストール中..."
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo "ライブラリのインストールが完了しました"
    else
        echo "警告: 一部のライブラリのインストールに失敗しました"
    fi
else
    echo "requirements.txtが見つかりません。基本ライブラリのみインストールします"
    pip install requests python-dotenv
fi

# .envファイルの確認と読み込み
if [ -f ".env" ]; then
    echo ".envファイルから環境変数を読み込み中..."
    export $(grep -v '^#' .env | xargs)
    echo "環境変数の読み込みが完了しました"
    echo "DEV_TUNNEL_URL: ${DEV_TUNNEL_URL}"
    echo "DEV_TUNNEL_TOKEN: ${DEV_TUNNEL_TOKEN:0:20}..."
else
    echo "警告: .envファイルが見つかりません"
    echo ".env.exampleファイルをコピーして.envファイルを作成してください"
    echo "コマンド: cp .env.example .env"
    exit 1
fi

# Forge環境変数を設定
echo "Forge環境変数を設定中..."
export FORGE_EMAIL="shota.hayashida@ariseanalytics.com"
export FORGE_API_TOKEN="ATATT3xFfGF0QseNlWcKjAJbyYMmKrtOtMNfAY9CaaJWGUwX3qvMOb2nWix95aTqlZ-C1yIwD-k6eYCm3TMkm0v96JmMPgW0cUcPY3p5yY8y4yZxGNJBMtDsskLhIsNuM5cC1ALZbcs0mzPeSecg53z6TP8jp5NBEKQ7xl2WbXGx4ajFWQSsIsc=088CB1B4"
export CHOKIDAR_USEPOLLING=true

# Forge変数を設定
echo "Forge変数を設定中..."
forge variables set DEV_TUNNEL_URL ${DEV_TUNNEL_URL}
forge variables set DEV_TUNNEL_TOKEN ${DEV_TUNNEL_TOKEN}

echo "=== 設定完了 ==="
echo "現在のForge変数一覧:"
forge variables list

echo ""
echo "次回からは以下のコマンドで仮想環境をアクティベートできます:"
echo "source venv/bin/activate"
