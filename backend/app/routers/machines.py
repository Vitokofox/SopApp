from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Response

from ..deps import current_user, get_db, require
from ..schemas import MachineCreate, MachineOut

router = APIRouter(prefix="/api/machines", tags=["machines"])


@router.get("", response_model=list[MachineOut])
async def all_machines(db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(current_user)) -> list[dict]:
    return [dict(row) for row in db.execute("SELECT id,area,name FROM machines ORDER BY area,name")]


@router.post("", response_model=MachineOut, status_code=201)
async def create_machine(data: MachineCreate, db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(require("user:manage"))) -> dict:
    try:
        cursor = db.execute("INSERT INTO machines(area,name) VALUES(?,?)", (data.area, data.name))
        db.commit()
    except sqlite3.IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="La máquina ya existe en esta área") from exc
    return {"id": cursor.lastrowid, "area": data.area, "name": data.name}


@router.delete("/{machine_id}", status_code=204)
async def delete_machine(machine_id: int, db: sqlite3.Connection = Depends(get_db), _user: dict = Depends(require("user:manage"))) -> Response:
    if not db.execute("DELETE FROM machines WHERE id=?", (machine_id,)).rowcount:
        raise HTTPException(status_code=404, detail="Máquina no encontrada")
    db.commit()
    return Response(status_code=204)
