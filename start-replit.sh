#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== [1/3] Frontend: install ==="
cd "$ROOT/frontend"
npm install

echo "=== [2/3] Frontend: build ==="
npm run build

echo "=== [3/3] Backend: install & run ==="
cd "$ROOT/backend"
pip install -r requirements.txt -q
exec python main.py
