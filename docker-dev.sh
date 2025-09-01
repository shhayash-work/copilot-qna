#!/bin/bash

# Docker開発環境の便利スクリプト

case "$1" in
    "start")
        echo "=== Docker開発環境を起動中 ==="
        # 古いdocker-composeの問題を回避して直接dockerコマンドを使用
        docker run -d \
            --name copilot-qna-dev \
            -v "$(pwd):/workspace" \
            -p 8080:8080 \
            --env-file .env \
            -e NODE_ENV=development \
            -w /workspace \
            -it \
            copilot-qna-dev /bin/bash
        echo "開発環境が起動しました"
        echo "コンテナに接続するには: ./docker-dev.sh shell"
        ;;
    
    "stop")
        echo "=== Docker開発環境を停止中 ==="
        docker stop copilot-qna-dev 2>/dev/null || true
        docker rm copilot-qna-dev 2>/dev/null || true
        echo "開発環境を停止しました"
        ;;
    
    "shell")
        echo "=== Docker開発環境に接続中 ==="
        docker exec -it copilot-qna-dev /bin/bash
        ;;
    
    "logs")
        echo "=== Docker開発環境のログを表示 ==="
        docker logs -f copilot-qna-dev
        ;;
    
    "rebuild")
        echo "=== Docker開発環境を再ビルド中 ==="
        docker stop copilot-qna-dev 2>/dev/null || true
        docker rm copilot-qna-dev 2>/dev/null || true
        docker build -t copilot-qna-dev .
        docker run -d \
            --name copilot-qna-dev \
            -v "$(pwd):/workspace" \
            -p 8080:8080 \
            --env-file .env \
            -e NODE_ENV=development \
            -w /workspace \
            -it \
            copilot-qna-dev /bin/bash
        echo "再ビルドが完了しました"
        ;;
    
    "forge")
        echo "=== Forge CLIコマンドを実行 ==="
        shift
        docker exec -it copilot-qna-dev forge "$@"
        ;;
    
    "npm")
        echo "=== NPMコマンドを実行 ==="
        shift
        docker exec -it copilot-qna-dev npm "$@"
        ;;
    
    "python")
        echo "=== Pythonコマンドを実行 ==="
        shift
        docker exec -it copilot-qna-dev python "$@"
        ;;
    
    *)
        echo "使用方法: $0 {start|stop|shell|logs|rebuild|forge|npm|python}"
        echo ""
        echo "コマンド:"
        echo "  start   - 開発環境を起動"
        echo "  stop    - 開発環境を停止"
        echo "  shell   - 開発環境のシェルに接続"
        echo "  logs    - 開発環境のログを表示"
        echo "  rebuild - 開発環境を再ビルド"
        echo "  forge   - Forge CLIコマンドを実行"
        echo "  npm     - NPMコマンドを実行"
        echo "  python  - Pythonコマンドを実行"
        echo ""
        echo "例:"
        echo "  $0 start"
        echo "  $0 shell"
        echo "  $0 forge tunnel"
        echo "  $0 npm install"
        exit 1
        ;;
esac
