import asyncio
import io
import sqlite3

import pytest
from openpyxl import Workbook


def test_migrate_legacy_hashed_password_column(tmp_path):
    from app.database import connect, migrate_up

    path = tmp_path / "legacy.db"
    with sqlite3.connect(path) as db:
        db.execute(
            """CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                full_name TEXT NOT NULL,
                hashed_password TEXT NOT NULL,
                language TEXT NOT NULL DEFAULT 'es',
                permissions TEXT NOT NULL DEFAULT '[]',
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"""
        )
        db.execute(
            "INSERT INTO users(username,full_name,hashed_password) VALUES(?,?,?)",
            ("legado", "Usuario legado", "hash-preservado"),
        )

    migrate_up(path)

    with connect(path) as db:
        columns = {row["name"] for row in db.execute("PRAGMA table_info(users)")}
        user = db.execute("SELECT password_hash FROM users WHERE username='legado'").fetchone()
        assert "hashed_password" not in columns
        assert user["password_hash"] == "hash-preservado"
        db.execute(
            """INSERT INTO users(username,full_name,password_hash)
               VALUES(?,?,?)""",
            ("nuevo", "Usuario nuevo", "nuevo-hash"),
        )


def test_health_and_auth(client, admin):
    assert client.get("/api/health").json() == {"ok": True}
    assert client.get("/api/auth/me", headers=admin).json()["username"] == "admin"
    assert client.post("/api/auth/login", json={"username": "admin", "password": "wrong"}).status_code == 401


def test_user_permissions_and_password_preservation(client, admin):
    created = client.post("/api/users", headers=admin, json={
        "username": "operador", "full_name": "Operador", "password": "Password123*",
        "permissions": ["sop:create"], "language": "pt", "is_active": True,
    })
    assert created.status_code == 201
    duplicate = client.post("/api/users", headers=admin, json={
        "username": "OPERADOR", "full_name": "Operador duplicado", "password": "Password123*",
    })
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"].startswith("El nombre de usuario 'OPERADOR' ya existe.")
    assert any(user["username"] == "operador" for user in client.get("/api/users", headers=admin).json())
    user = created.json()
    login = client.post("/api/auth/login", json={"username": "operador", "password": "Password123*"})
    limited = {"Authorization": f"Bearer {login.json()['access_token']}"}
    assert client.delete("/api/sops/999", headers=limited).status_code == 403
    payload = {k: user[k] for k in ("username", "full_name", "language", "permissions", "is_active")}
    payload["full_name"] = "Operador Dos"
    assert client.put(f"/api/users/{user['id']}", headers=admin, json=payload).status_code == 200
    assert client.post("/api/auth/login", json={"username": "operador", "password": "Password123*"}).status_code == 200
    assert client.delete("/api/users/1", headers=admin).status_code == 409


def test_unrelated_user_integrity_error_is_not_reported_as_duplicate(client, monkeypatch):
    from app.database import connect
    from app.routers import users as users_router
    from app.schemas import UserCreate

    def fail_create(_db, _data):
        raise sqlite3.IntegrityError("NOT NULL constraint failed: users.full_name")

    monkeypatch.setattr(users_router, "create_user", fail_create)
    data = UserCreate(username="nuevo", full_name="Nuevo", password="Password123*")
    with connect() as db, pytest.raises(sqlite3.IntegrityError):
        asyncio.run(users_router.post_user(data, db))


def test_sop_crud_and_finalization(client, admin):
    payload = {"code": "SOP-001", "title": "Arranque", "area": "Planta", "machine": "Línea 5", "follow_up_start_date": "2026-10-01", "follow_up_end_date": "2026-10-15", "steps": [{
        "step_number": 1, "description": "Revisar", "procedure_text": "Inspeccionar",
        "risk_codes": ["R1"], "control_codes": ["C1"], "image_path": "",
    }]}
    created = client.post("/api/sops", headers=admin, json=payload)
    assert created.status_code == 201, created.text
    sop = created.json()
    assert sop["machine"] == "Línea 5"
    assert (sop["follow_up_start_date"], sop["follow_up_end_date"]) == ("2026-10-01", "2026-10-15")
    assert client.get(f"/api/sops/{sop['id']}", headers=admin).json()["steps"][0]["risk_codes"] == ["R1"]
    payload["status"] = "finalizado"
    assert client.put(f"/api/sops/{sop['id']}", headers=admin, json=payload).status_code == 422
    assert client.delete(f"/api/sops/{sop['id']}", headers=admin).status_code == 204


def test_catalogs_and_excel_import(client, admin):
    area = client.post("/api/chiefs/area", headers=admin, json={"area": "Planta", "name": "Jefa Uno"})
    assert area.status_code == 201
    assert client.get("/api/chiefs/area", headers=admin).json()[0]["area"] == "Planta"
    machine = client.post("/api/machines", headers=admin, json={"area": "Planta", "name": "Línea 5"})
    assert machine.status_code == 201
    assert client.post("/api/machines", headers=admin, json={"area": "Planta", "name": "Línea 5"}).status_code == 409
    assert client.get("/api/machines", headers=admin).json()[0]["name"] == "Línea 5"
    historical = client.post("/api/sops", headers=admin, json={"code":"HIST-1","title":"Histórico","area":"Planta","machine":"Línea 5"}).json()
    assert client.delete(f"/api/machines/{machine.json()['id']}", headers=admin).status_code == 204
    assert client.get(f"/api/sops/{historical['id']}", headers=admin).json()["machine"] == "Línea 5"
    book = Workbook()
    sheet = book.active
    sheet.append(["Código", "IMP-1"])
    sheet.append(["Título", "Importado"])
    sheet.append(["1", "Preparar", "Verificar equipo"])
    buffer = io.BytesIO()
    book.save(buffer)
    imported = client.post("/api/import/excel", headers=admin, files={
        "file": ("sop.xlsx", buffer.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    })
    assert imported.status_code == 200, imported.text
    assert imported.json()["code"] == "IMP-1"


def test_spa_and_static_assets(client):
    root_res = client.get("/")
    assert root_res.status_code == 200
    assert "no-cache" in root_res.headers.get("cache-control", "")
    assert "text/html" in root_res.headers.get("content-type", "")

    spa_route_res = client.get("/sops")
    assert spa_route_res.status_code == 200
    assert "text/html" in spa_route_res.headers.get("content-type", "")

    missing_asset_res = client.get("/assets/nonexistent-chunk.js")
    assert missing_asset_res.status_code == 404
    assert "text/html" not in missing_asset_res.headers.get("content-type", "")
