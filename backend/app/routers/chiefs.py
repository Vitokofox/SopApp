import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Response

from ..deps import current_user, get_db, require
from ..schemas import AreaChiefCreate, AreaChiefOut, SsoChiefCreate, SsoChiefOut

router = APIRouter(prefix="/api/chiefs", tags=["chiefs"])


@router.get("/area", response_model=list[AreaChiefOut])
async def list_area(db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(current_user)) -> list[dict]:
    return [dict(row) for row in db.execute("SELECT id,area,name FROM area_chiefs ORDER BY area,name")]


@router.post("/area", response_model=AreaChiefOut, status_code=201)
async def create_area(data: AreaChiefCreate, db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(require("user:manage"))) -> dict:
    if not data.area.strip() or not data.name.strip():
        raise HTTPException(status_code=422, detail="Área y nombre son obligatorios")
    try:
        cursor = db.execute("INSERT INTO area_chiefs(area,name) VALUES(?,?)", (data.area.strip(), data.name.strip()))
        db.commit()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="La jefatura ya existe") from exc
    return {"id": cursor.lastrowid, "area": data.area.strip(), "name": data.name.strip()}


@router.delete("/area/{item_id}", status_code=204)
async def delete_area(item_id: int, db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(require("user:manage"))) -> Response:
    if not db.execute("DELETE FROM area_chiefs WHERE id=?", (item_id,)).rowcount:
        raise HTTPException(status_code=404, detail="Jefatura no encontrada")
    db.commit()
    return Response(status_code=204)


@router.get("/sso", response_model=list[SsoChiefOut])
async def list_sso(db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(current_user)) -> list[dict]:
    return [dict(row) for row in db.execute("SELECT id,name FROM sso_chiefs ORDER BY name")]


@router.post("/sso", response_model=SsoChiefOut, status_code=201)
async def create_sso(data: SsoChiefCreate, db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(require("user:manage"))) -> dict:
    if not data.name.strip():
        raise HTTPException(status_code=422, detail="Nombre obligatorio")
    try:
        cursor = db.execute("INSERT INTO sso_chiefs(name) VALUES(?)", (data.name.strip(),))
        db.commit()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="La jefatura ya existe") from exc
    return {"id": cursor.lastrowid, "name": data.name.strip()}


@router.delete("/sso/{item_id}", status_code=204)
async def delete_sso(item_id: int, db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(require("user:manage"))) -> Response:
    if not db.execute("DELETE FROM sso_chiefs WHERE id=?", (item_id,)).rowcount:
        raise HTTPException(status_code=404, detail="Jefatura no encontrada")
    db.commit()
    return Response(status_code=204)
