from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..config import settings
from ..deps import get_db, require
from ..importers import parse_document
from ..repositories import save_sop
from ..schemas import ImportResult, SOPOut

router = APIRouter(prefix="/api/import", tags=["import"], dependencies=[Depends(require("sop:import"))])


async def read_upload(file: UploadFile) -> bytes:
    content = await file.read(settings.max_upload_bytes + 1)
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande")
    if not content:
        raise HTTPException(status_code=422, detail="Archivo vacío")
    return content


async def import_one(file: UploadFile, db: sqlite3.Connection) -> dict:
    data = parse_document(await read_upload(file), file.filename or "documento")
    try:
        result = save_sop(db, data)
        db.commit()
        return result
    except Exception:
        db.rollback()
        raise


@router.post("/excel", response_model=SOPOut)
async def excel(file: UploadFile = File(...), db: sqlite3.Connection = Depends(get_db)) -> dict:
    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(status_code=415, detail="Se requiere un archivo .xlsx")
    return await import_one(file, db)


@router.post("/pdf", response_model=SOPOut)
async def pdf(file: UploadFile = File(...), db: sqlite3.Connection = Depends(get_db)) -> dict:
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Se requiere un archivo .pdf")
    return await import_one(file, db)


@router.post("/bulk", response_model=list[ImportResult])
async def bulk(files: list[UploadFile] = File(...), db: sqlite3.Connection = Depends(get_db)) -> list[ImportResult]:
    results: list[ImportResult] = []
    for file in files:
        try:
            sop = await import_one(file, db)
            results.append(ImportResult(filename=file.filename or "documento", ok=True, sop=sop))
        except HTTPException as exc:
            results.append(ImportResult(filename=file.filename or "documento", ok=False, error=str(exc.detail)))
        except Exception:
            db.rollback()
            results.append(ImportResult(filename=file.filename or "documento", ok=False, error="No se pudo importar"))
    return results

