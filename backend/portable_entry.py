from __future__ import annotations

import os
import socket
import sys
import threading
import webbrowser

import uvicorn


def local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as connection:
            connection.connect(("10.255.255.255", 1))
            return connection.getsockname()[0]
    except OSError:
        try:
            return socket.gethostbyname(socket.gethostname())
        except OSError:
            return "127.0.0.1"


def main() -> int:
    host = os.getenv("SOP_HOST", "0.0.0.0")
    port = int(os.getenv("SOP_PORT", "8090"))
    try:
        from app.config import settings
        if not settings.data_dir.is_dir():
            raise RuntimeError(
                f"OneDrive no está disponible o la carpeta corporativa no existe: {settings.data_dir}. "
                "Inicia OneDrive y verifica la sincronización antes de ejecutar SopApp."
            )
        print(f"Base de datos: {settings.data_dir / 'sop.db'}")
        print(f"Acceso en este PC: http://127.0.0.1:{port}")
        network_ip = local_ip()
        if not network_ip.startswith("127."):
            print(f"Acceso en red corporativa: http://{network_ip}:{port}")
        if os.getenv("SOP_OPEN_BROWSER", "true").strip().lower() in {"1", "true", "yes"}:
            threading.Timer(1.5, lambda: webbrowser.open(f"http://127.0.0.1:{port}/")).start()
        uvicorn.run("app.main:app", host=host, port=port, log_level="info")
        return 0
    except Exception as exc:
        print(f"ERROR: no fue posible iniciar SOP Arauco: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
