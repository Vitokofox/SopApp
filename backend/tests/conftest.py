import asyncio
from pathlib import Path

import httpx
import pytest


class ASGIClient:
    def __init__(self, app):
        self.app = app

    def request(self, method: str, path: str, **kwargs):
        async def execute():
            transport = httpx.ASGITransport(app=self.app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                return await client.request(method, path, **kwargs)
        return asyncio.run(execute())

    def get(self, path: str, **kwargs): return self.request("GET", path, **kwargs)
    def post(self, path: str, **kwargs): return self.request("POST", path, **kwargs)
    def put(self, path: str, **kwargs): return self.request("PUT", path, **kwargs)
    def delete(self, path: str, **kwargs): return self.request("DELETE", path, **kwargs)


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SOP_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("SOP_JWT_SECRET", "test-secret-that-is-long-enough")
    monkeypatch.setenv("SOP_ADMIN_PASSWORD", "Testing123*")
    from app import config
    from app.config import Settings
    fresh = Settings.from_env()
    monkeypatch.setattr(config, "settings", fresh)
    for module_name in ["database", "security", "main", "routers.sops", "routers.imports"]:
        module = __import__(f"app.{module_name}", fromlist=["settings"])
        if hasattr(module, "settings"):
            monkeypatch.setattr(module, "settings", fresh)
    from app.main import app
    from app.database import migrate_up
    from app.main import seed_admin
    migrate_up()
    seed_admin()
    yield ASGIClient(app)


@pytest.fixture()
def admin(client: ASGIClient) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"username": "admin", "password": "Testing123*"})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
