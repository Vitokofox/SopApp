---
name: windows-python-packager
description: Empaqueta proyectos Python como ejecutables Windows .exe desde Ubuntu o Linux usando Wine, Python para Windows y PyInstaller; reutilizable en VS Code y Codex para proyectos Python, FastAPI y proyectos con frontend compilado.
---

# Windows Python Packager

Usa esta skill cuando el usuario pida empaquetar, compilar, construir o generar un `.exe` de Windows desde Linux/Ubuntu para un proyecto Python.

## Objetivo

Automatizar un flujo seguro y repetible:

Linux/Ubuntu → Wine prefix dedicado → Python Windows x64 → dependencias Windows → PyInstaller → `.exe` Windows → prueba opcional con Wine.

## Reglas obligatorias

1. No ejecutar PyInstaller con el Python nativo de Linux cuando el objetivo sea Windows.
2. Usar siempre un `WINEPREFIX` dedicado por proyecto o por entorno de compilación.
3. Comprobar que `python.exe` dentro de Wine funciona antes de instalar dependencias.
4. Instalar `requirements.txt` dentro del Python Windows de Wine.
5. Si el proyecto usa `zoneinfo` con zonas IANA como `America/Santiago`, asegurar que `tzdata` esté instalado.
6. Si existe un archivo `.spec`, revisarlo y preferirlo antes de inventar un comando nuevo.
7. Para la primera compilación de un proyecto desconocido, preferir `onedir` salvo que el `.spec` ya defina otra estrategia o el usuario pida `onefile`.
8. No incluir bases de datos activas, secretos `.env`, backups ni archivos de usuario dentro del bundle salvo instrucción explícita.
9. En apps PyInstaller `onefile`, los recursos embebidos deben resolverse con `sys._MEIPASS`; los datos persistentes deben quedar fuera de `_MEIPASS`.
10. Antes de modificar código, inspeccionar estructura, entrypoint, requirements, frontend y spec existente.
11. No borrar artefactos de datos ni directorios persistentes. Limpiar únicamente `build/` y artefactos de `dist/` relacionados con el empaquetado.
12. Probar el ejecutable con Wine cuando sea posible y revisar `ModuleNotFoundError`, `FileNotFoundError`, DLL faltantes, rutas estáticas, migraciones y permisos.

## Variables estándar

Usar estas variables, adaptándolas al proyecto:

```bash
PROJECT_ROOT="$(pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"
WINEPREFIX="${WINEPREFIX:-$HOME/.wine-$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')}"
WIN_PY_REL="drive_c/users/$USER/AppData/Local/Programs/Python/Python312/python.exe"
WIN_PY="$WINEPREFIX/$WIN_PY_REL"
```

Si `$WIN_PY` no existe, buscar Python Windows con:

```bash
find "$WINEPREFIX/drive_c" -iname python.exe -not -path '*/Lib/venv/*' 2>/dev/null
```

No asumir una ruta si hay más de una instalación; seleccionar la instalación principal compatible con el proyecto.

## Flujo de trabajo

### 1. Inspección del proyecto

Ejecutar como mínimo:

```bash
pwd
find . -maxdepth 3 -type f \( \
  -name 'main.py' -o \
  -name 'app.py' -o \
  -name 'run.py' -o \
  -name 'portable_entry.py' -o \
  -name 'requirements.txt' -o \
  -name 'pyproject.toml' -o \
  -name '*.spec' \
\) | sort
```

Además revisar directorios habituales:

```bash
find . -maxdepth 2 -type d \( -name frontend -o -name dist -o -name build -o -name data -o -name migrations \) | sort
```

### 2. Determinar entrypoint

Prioridad sugerida:

1. Entry definido por `.spec` existente.
2. `run.py` / `portable_entry.py` diseñado para producción.
3. `main.py` si realmente inicia la aplicación.
4. Consultar al usuario solo si no es posible inferirlo del código.

Leer el entrypoint antes de empaquetar. Para FastAPI/Uvicorn comprobar host, puerto, apertura de navegador, rutas de recursos y shutdown.

### 3. Verificar Wine

```bash
wine --version
export WINEPREFIX="<prefix-del-proyecto>"
wineboot -u
```

Si Wine se bloquea con `RtlpWaitForCriticalSection` o `loader_section`:

```bash
wineserver -k
ps aux | grep -E 'wine|wineserver' | grep -v grep
```

Reintentar cuando no queden procesos Wine del prefix.

### 4. Verificar Python Windows

```bash
wine "$WIN_PY" --version
wine "$WIN_PY" -m pip --version
```

Si no existe Python Windows, detener el empaquetado y guiar su instalación dentro del prefix. No sustituirlo por Python Linux.

### 5. Instalar dependencias Windows

Si existe `requirements.txt`:

```bash
wine "$WIN_PY" -m pip install --upgrade pip
wine "$WIN_PY" -m pip install -r path/to/requirements.txt
```

Instalar PyInstaller:

```bash
wine "$WIN_PY" -m pip install --upgrade pyinstaller
wine "$WIN_PY" -m PyInstaller --version
```

Para proyectos que usan `zoneinfo` con zonas IANA en Windows:

```bash
wine "$WIN_PY" -m pip install tzdata
```

Recomendar agregar `tzdata` al archivo de dependencias del proyecto.

### 6. Frontend web opcional

Si existe `frontend/package.json`, comprobar si hay un frontend compilable. No ejecutar automáticamente comandos destructivos.

Si ya existe `frontend/dist`, se puede empaquetar. Si falta y hay scripts npm, ejecutar preferentemente:

```bash
cd frontend
npm ci
npm run build
cd ..
```

Solo hacerlo si Node/npm están disponibles y el proyecto usa ese flujo.

Para FastAPI + SPA, el `.spec` puede incluir:

```python
datas=[
    (str(root / "frontend" / "dist"), "frontend/dist"),
]
```

Y el código debe resolver recursos embebidos así:

```python
import sys
from pathlib import Path

if getattr(sys, "frozen", False):
    base_dir = Path(sys._MEIPASS)
else:
    base_dir = Path(__file__).resolve().parents[2]

frontend_dist = base_dir / "frontend" / "dist"
```

No usar `_MEIPASS` para SQLite, uploads, backups o datos que deban persistir.

### 7. Usar `.spec` existente

Si existe un `.spec`:

- Leerlo completo.
- Verificar que el entrypoint exista.
- Verificar `pathex`.
- Verificar que cada elemento de `datas` exista.
- Revisar `hiddenimports`.
- Confirmar el nombre final del ejecutable.
- Evitar rutas absolutas específicas de otra máquina.

Construir con:

```bash
wine "$WIN_PY" -m PyInstaller --clean path/to/project.spec
```

### 8. Generar spec básico si no existe

Para una aplicación sencilla:

```bash
wine "$WIN_PY" -m PyInstaller \
  --clean \
  --noconfirm \
  --onedir \
  --name "$PROJECT_NAME" \
  path/to/entrypoint.py
```

Si el usuario requiere un solo archivo, cambiar a `--onefile` después de validar el proyecto en `onedir`.

### 9. FastAPI/Uvicorn

Para FastAPI pueden ser necesarios hidden imports como:

```text
uvicorn.logging
uvicorn.loops.auto
uvicorn.protocols.http.auto
uvicorn.protocols.websockets.auto
```

No agregarlos ciegamente si el `.spec` ya tiene una configuración funcional.

### 10. Validación del resultado

Localizar el `.exe`:

```bash
find dist -maxdepth 3 -type f -iname '*.exe' -printf '%p\n' | sort
```

Probar con Wine:

```bash
wine dist/<Aplicacion>.exe
```

Para apps web comprobar:

- servidor inicia;
- `/` responde 200 si debe servir frontend;
- assets JS/CSS responden 200;
- health endpoint responde;
- rutas API principales responden;
- SQLite se crea o abre en una ruta persistente.

### 11. Persistencia

Buscar rutas de datos:

```bash
grep -RniE 'sqlite|database_url|DATABASE|backup|data_dir|uploads|Path\(' backend 2>/dev/null
```

Una aplicación portable puede usar:

```text
Aplicacion/
├── Aplicacion.exe
└── data/
    ├── database.sqlite3
    ├── backups/
    └── uploads/
```

Una aplicación instalada puede preferir `%LOCALAPPDATA%/<Aplicacion>/`.

No cambiar la estrategia de persistencia sin revisar compatibilidad y migración de datos existentes.

### 12. Release limpio

Crear un directorio separado de release sin modificar `data/` original:

```bash
mkdir -p release/$PROJECT_NAME
cp "dist/$PROJECT_NAME.exe" "release/$PROJECT_NAME/"
```

Copiar datos iniciales únicamente si el usuario desea distribuirlos. Por defecto, no copiar bases productivas, backups ni uploads reales.

## Script auxiliar

La skill incluye `scripts/package_windows.sh`. Úsalo como punto de partida cuando el proyecto ya tenga una estructura conocida.

Ejemplo:

```bash
bash scripts/package_windows.sh \
  --project-root "$PWD" \
  --name MiAplicacion \
  --spec packaging/mi_app.spec \
  --requirements backend/requirements.txt
```

El script no instala Wine ni Python Windows automáticamente. Falla de forma segura si faltan.

## Criterio de finalización

Considerar el empaquetado listo solo cuando:

1. se genera un `.exe` Windows;
2. el `.exe` inicia bajo Wine o Windows;
3. no hay módulos o DLL faltantes;
4. los recursos estáticos cargan;
5. la base de datos y archivos persistentes quedan fuera de `_MEIPASS`;
6. el release no contiene secretos ni datos productivos por accidente.
