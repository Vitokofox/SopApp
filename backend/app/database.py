from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .config import settings

SCHEMA_VERSION = 5

MIGRATION_UP = """
CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
INSERT INTO schema_version(version)
SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM schema_version);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es' CHECK(language IN ('es','pt','en')),
  permissions TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  revision TEXT NOT NULL DEFAULT 'Rev. 0',
  title TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT '',
  machine TEXT NOT NULL DEFAULT '',
  elaborator TEXT NOT NULL DEFAULT '',
  chief_area TEXT NOT NULL DEFAULT '',
  chief_masso TEXT NOT NULL DEFAULT '',
  publication_date TEXT NOT NULL DEFAULT '',
  last_update TEXT NOT NULL DEFAULT '',
  follow_up_date TEXT NOT NULL DEFAULT '',
  follow_up_start_date TEXT NOT NULL DEFAULT '',
  follow_up_end_date TEXT NOT NULL DEFAULT '',
  tools_text TEXT NOT NULL DEFAULT '',
  flexibility_matrix TEXT NOT NULL DEFAULT '',
  key_rule TEXT NOT NULL DEFAULT '',
  risks_text TEXT NOT NULL DEFAULT '',
  controls_text TEXT NOT NULL DEFAULT '',
  epp_text TEXT NOT NULL DEFAULT '',
  evaluation TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'en proceso',
  steps_per_page INTEGER NOT NULL DEFAULT 3 CHECK(steps_per_page BETWEEN 1 AND 6),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK(step_number >= 0),
  description TEXT NOT NULL DEFAULT '',
  procedure_text TEXT NOT NULL DEFAULT '',
  image_path TEXT NOT NULL DEFAULT '',
  risk_codes TEXT NOT NULL DEFAULT '[]',
  control_codes TEXT NOT NULL DEFAULT '[]',
  UNIQUE(sop_id, step_number)
);
CREATE TABLE IF NOT EXISTS area_chiefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(area, name)
);
CREATE TABLE IF NOT EXISTS sso_chiefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS machines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(area, name)
);
UPDATE schema_version SET version = 5;
"""

MIGRATION_DOWN = """
DROP TABLE IF EXISTS sso_chiefs;
DROP TABLE IF EXISTS machines;
DROP TABLE IF EXISTS area_chiefs;
DROP TABLE IF EXISTS steps;
DROP TABLE IF EXISTS sops;
DROP TABLE IF EXISTS users;
UPDATE schema_version SET version = 0;
"""


def database_path() -> Path:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    return settings.data_dir / "sop.db"


def connect(path: Path | None = None) -> sqlite3.Connection:
    connection = sqlite3.connect(path or database_path(), timeout=15)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 15000")
    connection.execute("PRAGMA journal_mode = DELETE")
    return connection


@contextmanager
def transaction(path: Path | None = None) -> Iterator[sqlite3.Connection]:
    connection = connect(path)
    try:
        connection.execute("BEGIN")
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def migrate_up(path: Path | None = None) -> None:
    with connect(path) as connection:
        connection.executescript(MIGRATION_UP)
        columns = {row[1] for row in connection.execute("PRAGMA table_info(sops)")}
        if "follow_up_date" not in columns:
            connection.execute("ALTER TABLE sops ADD COLUMN follow_up_date TEXT NOT NULL DEFAULT ''")
        if "follow_up_start_date" not in columns:
            connection.execute("ALTER TABLE sops ADD COLUMN follow_up_start_date TEXT NOT NULL DEFAULT ''")
        if "follow_up_end_date" not in columns:
            connection.execute("ALTER TABLE sops ADD COLUMN follow_up_end_date TEXT NOT NULL DEFAULT ''")
        if "created_at" not in columns:
            connection.execute("ALTER TABLE sops ADD COLUMN created_at TEXT NOT NULL DEFAULT ''")
            connection.execute("UPDATE sops SET created_at=CURRENT_TIMESTAMP WHERE created_at='' ")
        if "updated_at" not in columns:
            connection.execute("ALTER TABLE sops ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''")
            connection.execute("UPDATE sops SET updated_at=CURRENT_TIMESTAMP WHERE updated_at='' ")
        if "machine" not in columns:
            connection.execute("ALTER TABLE sops ADD COLUMN machine TEXT NOT NULL DEFAULT ''")
        if "steps_per_page" not in columns:
            connection.execute("ALTER TABLE sops ADD COLUMN steps_per_page INTEGER NOT NULL DEFAULT 3")
        connection.execute("UPDATE sops SET follow_up_end_date=follow_up_date WHERE follow_up_end_date='' AND follow_up_date<>''")
        legacy_steps = connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='sop_steps'"
        ).fetchone()
        if legacy_steps:
            for step in connection.execute("SELECT * FROM sop_steps ORDER BY sop_id,step_number"):
                risks = [item.strip() for item in (step["risk_codes"] or "").split(",") if item.strip()]
                controls = [item.strip() for item in (step["control_codes"] or "").split(",") if item.strip()]
                connection.execute(
                    """INSERT OR IGNORE INTO steps
                       (id,sop_id,step_number,description,procedure_text,image_path,risk_codes,control_codes)
                       VALUES(?,?,?,?,?,?,?,?)""",
                    (step["id"], step["sop_id"], step["step_number"], step["description"] or "",
                     step["procedure_text"] or "", step["image_path"] or "", json.dumps(risks), json.dumps(controls)),
                )
                migrated = connection.execute("SELECT 1 FROM steps WHERE id=?", (step["id"],)).fetchone()
                if not migrated:
                    next_number = connection.execute(
                        "SELECT COALESCE(MAX(step_number),-1)+1 FROM steps WHERE sop_id=?", (step["sop_id"],)
                    ).fetchone()[0]
                    connection.execute(
                        """INSERT INTO steps
                           (id,sop_id,step_number,description,procedure_text,image_path,risk_codes,control_codes)
                           VALUES(?,?,?,?,?,?,?,?)""",
                        (step["id"], step["sop_id"], next_number, step["description"] or "",
                         step["procedure_text"] or "", step["image_path"] or "", json.dumps(risks), json.dumps(controls)),
                    )
        user_columns = {row[1] for row in connection.execute("PRAGMA table_info(users)")}
        if "hashed_password" in user_columns and "password_hash" in user_columns:
            connection.execute(
                """UPDATE users SET password_hash=hashed_password
                   WHERE (password_hash IS NULL OR password_hash='') AND hashed_password IS NOT NULL"""
            )
            connection.execute("ALTER TABLE users DROP COLUMN hashed_password")
            user_columns.remove("hashed_password")
        elif "hashed_password" in user_columns:
            connection.execute("ALTER TABLE users RENAME COLUMN hashed_password TO password_hash")
            user_columns.remove("hashed_password")
            user_columns.add("password_hash")
        if "password_hash" not in user_columns:
            connection.execute("ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''")
        for user_id, permissions in connection.execute("SELECT id,permissions FROM users"):
            raw = permissions or ""
            if not raw.lstrip().startswith("["):
                normalized = [item.strip() for item in raw.split(",") if item.strip()]
                connection.execute("UPDATE users SET permissions=? WHERE id=?", (json.dumps(normalized), user_id))
        connection.execute("UPDATE schema_version SET version = ?", (SCHEMA_VERSION,))


def migrate_down(path: Path | None = None) -> None:
    with connect(path) as connection:
        connection.executescript(MIGRATION_DOWN)
