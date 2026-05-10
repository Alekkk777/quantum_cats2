#!/usr/bin/env bash
set -e

REPO="$(cd "$(dirname "$0")" && pwd)"
VENV="$REPO/.venv"
PYTHON="$VENV/bin/python3"

echo "🧠 Braynr / Schrodinger — avvio locale"
echo "======================================="

# ── Backend ──────────────────────────────────────────────────────────
echo ""
echo "▶ Avvio backend (FastAPI su :8000)..."
cd "$REPO/backend"
"$PYTHON" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Aspetta che il backend sia pronto
echo "  Attendo che il backend sia pronto..."
for i in $(seq 1 20); do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "  ✅ Backend pronto!"
    break
  fi
  sleep 0.5
done

# ── Frontend ─────────────────────────────────────────────────────────
echo ""
echo "▶ Avvio frontend (Vite su :5173)..."
cd "$REPO/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "======================================="
echo "✅ App avviata!"
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://localhost:8000"
echo "   API docs → http://localhost:8000/docs"
echo ""
echo "Premi Ctrl+C per fermare tutto."
echo "======================================="

# Aspetta e gestisci l'uscita
trap "echo ''; echo 'Arresto...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
