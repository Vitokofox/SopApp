from pathlib import Path

from PyInstaller.utils.hooks import collect_submodules

root = Path(SPECPATH).parent
backend = root / "backend"

hidden = []
for package in ("uvicorn", "multipart", "pydantic", "openpyxl", "pypdf"):
    hidden.extend(collect_submodules(package))
hidden.append("app.main")

a = Analysis(
    [str(backend / "portable_entry.py")],
    pathex=[str(backend)],
    binaries=[],
    datas=[(str(root / "frontend" / "dist"), "frontend/dist")],
    hiddenimports=hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["pytest", "httpx"],
    noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="SOP_Arauco",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name="SOP_Arauco",
)
