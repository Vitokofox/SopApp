from __future__ import annotations

import argparse
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path


def backup(data_dir: Path) -> Path:
    source = data_dir.resolve()
    if not (source / "sop.db").is_file():
        raise FileNotFoundError(f"No existe {source / 'sop.db'}")
    destination = source / "backups" / datetime.now().strftime("%Y%m%d-%H%M%S")
    destination.mkdir(parents=True, exist_ok=False)
    with sqlite3.connect(source / "sop.db") as origin, sqlite3.connect(destination / "sop.db") as target:
        origin.backup(target)
    if (source / "uploads").is_dir():
        shutil.copytree(source / "uploads", destination / "uploads")
    return destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Respalda base y archivos SOP sin detener el servicio")
    parser.add_argument("data_dir", type=Path)
    print(backup(parser.parse_args().data_dir))

