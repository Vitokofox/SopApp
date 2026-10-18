from __future__ import annotations

import json
import sqlite3
from typing import Any

from .schemas import SOPCreate, UserCreate, UserUpdate
from .security import hash_password

USER_COLUMNS = "id, username, full_name, language, permissions, is_active"
SOP_FIELDS = [
    "code", "revision", "title", "area", "machine", "elaborator", "chief_area", "chief_masso",
    "publication_date", "last_update", "follow_up_date", "follow_up_start_date", "follow_up_end_date", "tools_text", "flexibility_matrix", "key_rule",
    "risks_text", "controls_text", "epp_text", "evaluation", "status", "steps_per_page",
]


def user_dict(row: sqlite3.Row) -> dict[str, Any]:
    result = dict(row)
    result["permissions"] = json.loads(result.get("permissions") or "[]")
    result["is_active"] = bool(result["is_active"])
    return result


def get_user_by_id(db: sqlite3.Connection, user_id: int) -> dict[str, Any] | None:
    row = db.execute(f"SELECT {USER_COLUMNS}, password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
    return user_dict(row) if row else None


def get_user_by_username(db: sqlite3.Connection, username: str) -> dict[str, Any] | None:
    row = db.execute(f"SELECT {USER_COLUMNS}, password_hash FROM users WHERE username = ?", (username,)).fetchone()
    return user_dict(row) if row else None


def list_users(db: sqlite3.Connection) -> list[dict[str, Any]]:
    return [user_dict(row) for row in db.execute(f"SELECT {USER_COLUMNS} FROM users ORDER BY username")]


def create_user(db: sqlite3.Connection, data: UserCreate) -> dict[str, Any]:
    cursor = db.execute(
        "INSERT INTO users(username,full_name,password_hash,language,permissions,is_active) VALUES(?,?,?,?,?,?)",
        (data.username.strip(), data.full_name.strip(), hash_password(data.password), data.language,
         json.dumps(data.permissions), int(data.is_active)),
    )
    return get_user_by_id(db, cursor.lastrowid)  # type: ignore[arg-type]


def update_user(db: sqlite3.Connection, user_id: int, data: UserUpdate) -> dict[str, Any] | None:
    current = get_user_by_id(db, user_id)
    if not current:
        return None
    password_hash = hash_password(data.password) if data.password else current["password_hash"]
    db.execute(
        "UPDATE users SET username=?,full_name=?,password_hash=?,language=?,permissions=?,is_active=? WHERE id=?",
        (data.username.strip(), data.full_name.strip(), password_hash, data.language,
         json.dumps(data.permissions), int(data.is_active), user_id),
    )
    return get_user_by_id(db, user_id)


def step_dict(row: sqlite3.Row) -> dict[str, Any]:
    result = dict(row)
    result["risk_codes"] = json.loads(result.get("risk_codes") or "[]")
    result["control_codes"] = json.loads(result.get("control_codes") or "[]")
    result.pop("sop_id", None)
    return result


def sop_dict(db: sqlite3.Connection, row: sqlite3.Row) -> dict[str, Any]:
    result = {field: row[field] for field in ["id", *SOP_FIELDS]}
    result["steps"] = [
        step_dict(step) for step in db.execute("SELECT * FROM steps WHERE sop_id=? ORDER BY step_number", (row["id"],))
    ]
    return result


def list_sops(db: sqlite3.Connection) -> list[dict[str, Any]]:
    return [sop_dict(db, row) for row in db.execute("SELECT * FROM sops ORDER BY id DESC")]


def get_sop(db: sqlite3.Connection, sop_id: int) -> dict[str, Any] | None:
    row = db.execute("SELECT * FROM sops WHERE id=?", (sop_id,)).fetchone()
    return sop_dict(db, row) if row else None


def save_sop(db: sqlite3.Connection, data: SOPCreate, sop_id: int | None = None) -> dict[str, Any]:
    values = [getattr(data, field) for field in SOP_FIELDS]
    if sop_id is None:
        placeholders = ",".join("?" for _ in SOP_FIELDS)
        cursor = db.execute(f"INSERT INTO sops({','.join(SOP_FIELDS)}) VALUES({placeholders})", values)
        sop_id = cursor.lastrowid
    else:
        if not get_sop(db, sop_id):
            raise KeyError(sop_id)
        assignments = ",".join(f"{field}=?" for field in SOP_FIELDS)
        db.execute(f"UPDATE sops SET {assignments},updated_at=CURRENT_TIMESTAMP WHERE id=?", [*values, sop_id])
        db.execute("DELETE FROM steps WHERE sop_id=?", (sop_id,))
    for step in data.steps:
        db.execute(
            "INSERT INTO steps(sop_id,step_number,description,procedure_text,image_path,risk_codes,control_codes) VALUES(?,?,?,?,?,?,?)",
            (sop_id, step.step_number, step.description, step.procedure_text, step.image_path,
             json.dumps(step.risk_codes), json.dumps(step.control_codes)),
        )
    return get_sop(db, int(sop_id))  # type: ignore[return-value]


def delete_sop(db: sqlite3.Connection, sop_id: int) -> bool:
    return db.execute("DELETE FROM sops WHERE id=?", (sop_id,)).rowcount > 0
