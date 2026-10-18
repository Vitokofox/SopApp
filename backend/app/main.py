import mimetypes
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import migrate_up, transaction
from .repositories import create_user, get_user_by_username
from .routers import auth, chiefs, imports, machines, sops, users
from .schemas import UserCreate
from .security import hash_password

mimetypes.init()
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("image/webp", ".webp")

STATIC_EXTENSIONS = {
    ".js", ".css", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico",
    ".woff", ".woff2", ".ttf", ".map", ".json",
}

ALL_PERMISSIONS = ["sop:create", "sop:edit", "sop:delete", "sop:import", "user:manage"]


def seed_admin() -> None:
    with transaction() as db:
        admin = get_user_by_username(db, settings.admin_username)
        if not admin:
            create_user(db, UserCreate(
                username=settings.admin_username,
                full_name="Administrador SOP",
                password=settings.admin_password,
                language="es",
                permissions=ALL_PERMISSIONS,
            ))
        elif not admin["password_hash"].startswith("scrypt$"):
            db.execute(
                "UPDATE users SET password_hash=?,is_active=1 WHERE id=?",
                (hash_password(settings.admin_password), admin["id"]),
            )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    migrate_up()
    seed_admin()
    (settings.data_dir / "uploads").mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="SOP Local API", version="1.0.0", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(sops.router)
app.include_router(imports.router)
app.include_router(users.router)
app.include_router(chiefs.router)
app.include_router(machines.router)


@app.get("/api/health", tags=["health"])
async def health() -> dict[str, bool]:
    return {"ok": True}


app.mount("/files", StaticFiles(directory=settings.data_dir, check_dir=False), name="files")


def _serve_index() -> Response:
    index = settings.frontend_dist / "index.html"
    if index.is_file():
        return FileResponse(
            index,
            media_type="text/html",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
    return JSONResponse(
        content={"message": "Frontend no compilado. Ejecute npm run build en frontend."},
        status_code=503,
    )


@app.get("/{full_path:path}", include_in_schema=False)
async def spa(full_path: str):
    clean = full_path.strip("/")
    if not clean:
        return _serve_index()

    requested = (settings.frontend_dist / clean).resolve()
    if requested.is_relative_to(settings.frontend_dist) and requested.is_file():
        suffix = requested.suffix.lower()
        if suffix == ".js":
            media_type = "application/javascript"
        elif suffix == ".css":
            media_type = "text/css"
        else:
            media_type = mimetypes.guess_type(str(requested))[0] or "application/octet-stream"

        headers = {}
        if clean.startswith("assets/"):
            headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return FileResponse(requested, media_type=media_type, headers=headers)

    # Si es una petición a un asset o recurso estático inexistente, responder 404 (nunca fallback a index.html)
    if clean.startswith("assets/") or Path(clean).suffix.lower() in STATIC_EXTENSIONS:
        return Response(status_code=404, content="Archivo estático no encontrado", media_type="text/plain")

    # Fallback SPA para rutas cliente (ej: /sops, /report, etc.)
    return _serve_index()
