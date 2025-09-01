# Python 3.12ベースの開発環境
FROM python:3.12-slim

# 作業ディレクトリを設定
WORKDIR /workspace

# システムパッケージの更新と必要なツールをインストール
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20.xをインストール（Forge CLIに必要）
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Forge CLIと必要な依存関係をグローバルにインストール
RUN npm install -g @forge/cli ts-node typescript

# Pythonの依存関係をコピーしてインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# プロジェクトファイルをコピー
COPY . .

# 環境変数を設定
ENV PYTHONPATH=/workspace
ENV FORGE_USER_DIRECTORY=/workspace/.forge

# ポート3000を公開（開発サーバー用）
EXPOSE 3000

# デフォルトコマンド
CMD ["/bin/bash"]
