#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_PYTHON="$BACKEND_DIR/.venv/bin/python"
BACKEND_PORT="${SOP_PORT:-8091}"
FRONTEND_PORT="${SOP_FRONTEND_PORT:-5173}"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  trap - INT TERM EXIT
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  wait "$FRONTEND_PID" "$BACKEND_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

if [[ ! -x "$BACKEND_PYTHON" ]]; then
  echo "Error: no existe el entorno virtual en backend/.venv" >&2
  echo "Créalo e instala las dependencias siguiendo README.md." >&2
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Error: faltan las dependencias del frontend." >&2
  echo "Ejecuta: cd frontend && npm install" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm no está disponible." >&2
  exit 1
fi

echo "Iniciando backend en http://127.0.0.1:$BACKEND_PORT"
(
  cd "$BACKEND_DIR"
  SOP_PORT="$BACKEND_PORT" "$BACKEND_PYTHON" run.py
) &
BACKEND_PID=$!

echo "Iniciando frontend en http://127.0.0.1:$FRONTEND_PORT"
(
  cd "$FRONTEND_DIR"
  VITE_API_TARGET="http://127.0.0.1:$BACKEND_PORT" npm run dev -- --port "$FRONTEND_PORT"
) &
FRONTEND_PID=$!

echo "Aplicación disponible en http://127.0.0.1:$FRONTEND_PORT"
echo "Presiona Ctrl+C para detener backend y frontend."

while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  wait -n "$BACKEND_PID" "$FRONTEND_PID" || true
done

echo "Uno de los servicios se detuvo; cerrando la aplicación." >&2
exit 1
