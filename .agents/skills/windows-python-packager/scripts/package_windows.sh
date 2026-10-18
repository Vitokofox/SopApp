#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=""
APP_NAME=""
SPEC=""
REQ=""
ENTRY=""
MODE="onedir"
PREFIX=""

usage() {
  cat <<'USAGE'
Uso:
  package_windows.sh --project-root RUTA --name NOMBRE [opciones]

Opciones:
  --spec RUTA             Archivo .spec existente
  --requirements RUTA     requirements.txt
  --entry RUTA            Entrypoint .py si no hay .spec
  --mode onedir|onefile    Modo PyInstaller para builds sin spec (default: onedir)
  --wineprefix RUTA        WINEPREFIX a usar
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-root) PROJECT_ROOT="$2"; shift 2 ;;
    --name) APP_NAME="$2"; shift 2 ;;
    --spec) SPEC="$2"; shift 2 ;;
    --requirements) REQ="$2"; shift 2 ;;
    --entry) ENTRY="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --wineprefix) PREFIX="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Argumento desconocido: $1" >&2; usage; exit 2 ;;
  esac
done

[[ -n "$PROJECT_ROOT" && -n "$APP_NAME" ]] || { usage; exit 2; }
[[ "$MODE" == "onedir" || "$MODE" == "onefile" ]] || { echo "--mode debe ser onedir o onefile" >&2; exit 2; }

PROJECT_ROOT="$(cd "$PROJECT_ROOT" && pwd)"
cd "$PROJECT_ROOT"

if ! command -v wine >/dev/null 2>&1; then
  echo "ERROR: Wine no está instalado." >&2
  exit 1
fi

if [[ -z "$PREFIX" ]]; then
  slug="$(printf '%s' "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')"
  PREFIX="$HOME/.wine-${slug%-}"
fi
export WINEPREFIX="$PREFIX"

if [[ ! -d "$WINEPREFIX/drive_c" ]]; then
  echo "ERROR: WINEPREFIX no inicializado: $WINEPREFIX" >&2
  echo "Cree/inicialice el prefix e instale Python Windows x64 antes de continuar." >&2
  exit 1
fi

mapfile -t PY_CANDIDATES < <(find "$WINEPREFIX/drive_c" -type f -iname python.exe -not -path '*/Lib/venv/*' 2>/dev/null | sort)
if [[ ${#PY_CANDIDATES[@]} -eq 0 ]]; then
  echo "ERROR: No se encontró python.exe de Windows en $WINEPREFIX" >&2
  exit 1
fi

WIN_PY="${PY_CANDIDATES[0]}"
echo "Python Windows: $WIN_PY"
wine "$WIN_PY" --version

if [[ -n "$REQ" ]]; then
  [[ -f "$REQ" ]] || { echo "ERROR: No existe requirements: $REQ" >&2; exit 1; }
  wine "$WIN_PY" -m pip install -r "$REQ"
fi

wine "$WIN_PY" -m pip install --upgrade pyinstaller
wine "$WIN_PY" -m PyInstaller --version

if [[ -n "$SPEC" ]]; then
  [[ -f "$SPEC" ]] || { echo "ERROR: No existe spec: $SPEC" >&2; exit 1; }
  wine "$WIN_PY" -m PyInstaller --clean --noconfirm "$SPEC"
else
  [[ -n "$ENTRY" && -f "$ENTRY" ]] || { echo "ERROR: Debe indicar --spec o --entry válido." >&2; exit 1; }
  args=(--clean --noconfirm "--$MODE" --name "$APP_NAME" "$ENTRY")
  wine "$WIN_PY" -m PyInstaller "${args[@]}"
fi

echo
echo "Ejecutables generados:"
find dist -maxdepth 3 -type f -iname '*.exe' -printf '  %p\n' | sort || true
