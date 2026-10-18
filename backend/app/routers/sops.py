from __future__ import annotations

import sqlite3
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile

from ..config import settings
from ..deps import current_user, get_db, require
from ..domain import finalization_error
from ..repositories import delete_sop, get_sop, list_sops, save_sop
from ..schemas import SOPCreate, SOPOut, SOPUpdate

router = APIRouter(prefix="/api/sops", tags=["sops"])
ALLOWED_IMAGES = {".jpg", ".jpeg", ".png", ".webp"}


def valid_image_signature(content: bytes, suffix: str) -> bool:
    if suffix == ".png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if suffix in {".jpg", ".jpeg"}:
        return content.startswith(b"\xff\xd8\xff")
    if suffix == ".webp":
        return len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    return False


@router.get("", response_model=list[SOPOut])
async def all_sops(db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(current_user)) -> list[dict]:
    return list_sops(db)


@router.post("", response_model=SOPOut, status_code=201)
async def create(data: SOPCreate, db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(require("sop:create"))) -> dict:
    if data.status == "finalizado":
        draft = data.model_dump()
        error = finalization_error(draft)
        if error:
            raise HTTPException(status_code=422, detail=error)
    try:
        result = save_sop(db, data)
        db.commit()
        return result
    except sqlite3.IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Números de paso duplicados") from exc


@router.get("/{sop_id}", response_model=SOPOut)
async def one(sop_id: int, db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(current_user)) -> dict:
    result = get_sop(db, sop_id)
    if not result:
        raise HTTPException(status_code=404, detail="SOP no encontrado")
    return result


@router.put("/{sop_id}", response_model=SOPOut)
async def update(sop_id: int, data: SOPUpdate, db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(require("sop:edit"))) -> dict:
    if data.status == "finalizado":
        error = finalization_error(data.model_dump())
        if error:
            raise HTTPException(status_code=422, detail=error)
    try:
        result = save_sop(db, data, sop_id)
        db.commit()
        return result
    except KeyError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail="SOP no encontrado") from exc
    except sqlite3.IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Números de paso duplicados") from exc


@router.delete("/{sop_id}", status_code=204)
async def remove(sop_id: int, db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(require("sop:delete"))) -> Response:
    if not delete_sop(db, sop_id):
        raise HTTPException(status_code=404, detail="SOP no encontrado")
    db.commit()
    upload_folder = settings.data_dir / "uploads" / str(sop_id)
    if upload_folder.is_dir() and upload_folder.parent == settings.data_dir / "uploads":
        shutil.rmtree(upload_folder)
    return Response(status_code=204)


@router.post("/{sop_id}/steps/{step_id}/image")
async def upload_image(
    sop_id: int,
    step_id: int,
    image: UploadFile = File(...),
    db: sqlite3.Connection = Depends(get_db),
    _user: dict = Depends(require("sop:edit")),
) -> dict:
    step = db.execute("SELECT id,image_path FROM steps WHERE id=? AND sop_id=?", (step_id, sop_id)).fetchone()
    if not step:
        raise HTTPException(status_code=404, detail="Paso no encontrado")
    suffix = Path(image.filename or "").suffix.lower()
    if suffix not in ALLOWED_IMAGES or not (image.content_type or "").startswith("image/"):
        raise HTTPException(status_code=415, detail="Formato de imagen no permitido")
    content = await image.read(settings.max_upload_bytes + 1)
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Imagen demasiado grande")
    if not valid_image_signature(content, suffix):
        raise HTTPException(status_code=422, detail="El contenido no corresponde a una imagen válida")
    folder = settings.data_dir / "uploads" / str(sop_id)
    folder.mkdir(parents=True, exist_ok=True)
    relative = Path("uploads") / str(sop_id) / f"{step_id}-{uuid.uuid4().hex}{suffix}"
    target = settings.data_dir / relative
    target.write_bytes(content)
    old_path = step["image_path"]
    db.execute("UPDATE steps SET image_path=? WHERE id=?", ("/files/" + relative.as_posix(), step_id))
    db.commit()
    if old_path and old_path.startswith("/files/uploads/"):
        old = settings.data_dir / old_path.removeprefix("/files/")
        if old.is_file():
            old.unlink()
    return {"image_path": "/files/" + relative.as_posix()}
