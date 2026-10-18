from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

_source_root = Path(__file__).resolve().parents[2]
_runtime_root = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else _source_root
for _config_file in (_runtime_root / ".env", _runtime_root / "SOP_Arauco.env"):
    if _config_file.is_file():
        load_dotenv(_config_file, override=False)


def _expanded_path(value: str | Path) -> Path:
    raw = str(value).strip().strip('"')
    if "%USERPROFILE%" in raw.upper():
        profile = os.getenv("USERPROFILE", r"C:\Users\Victor.Valenzuela")
        raw = raw.replace("%USERPROFILE%", profile).replace("%userprofile%", profile)
    return Path(os.path.expandvars(os.path.expanduser(raw)))


@dataclass(frozen=True)
class Settings:
    data_dir: Path
    jwt_secret: str
    admin_username: str
    admin_password: str
    token_minutes: int
    max_upload_bytes: int
    frontend_dist: Path

    @classmethod
    def from_env(cls) -> "Settings":
        frozen = bool(getattr(sys, "frozen", False))
        root = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parents[2]))
        persistent_root = Path(sys.executable).resolve().parent if frozen else root
        corporate_default = Path(os.getenv("USERPROFILE", r"C:\Users\Victor.Valenzuela")) / "OneDrive - ARAUCO" / "DataBase"
        raw_data_dir = _expanded_path(os.getenv("SOP_DATA_DIR", corporate_default if frozen else persistent_root / "data"))
        return cls(
            data_dir=raw_data_dir.resolve(),
            jwt_secret=os.getenv("SOP_JWT_SECRET", "development-only-secret-change-me"),
            admin_username=os.getenv("SOP_ADMIN_USERNAME", "admin"),
            admin_password=os.getenv("SOP_ADMIN_PASSWORD", "Admin123*"),
            token_minutes=int(os.getenv("SOP_TOKEN_MINUTES", "480")),
            max_upload_bytes=int(os.getenv("SOP_MAX_UPLOAD_MB", "15")) * 1024 * 1024,
            frontend_dist=(root / "frontend" / "dist").resolve(),
        )


settings = Settings.from_env()
