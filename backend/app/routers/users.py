import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Response

from ..deps import get_db, require
from ..repositories import create_user, get_user_by_id, get_user_by_username, list_users, update_user
from ..schemas import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"], dependencies=[Depends(require("user:manage"))])


@router.get("", response_model=list[UserOut])
async def get_users(db: sqlite3.Connection = Depends(get_db)) -> list[dict]:
    return list_users(db)


@router.post("", response_model=UserOut, status_code=201)
async def post_user(data: UserCreate, db: sqlite3.Connection = Depends(get_db)) -> dict:
    try:
        result = create_user(db, data)
        db.commit()
        return result
    except sqlite3.IntegrityError as exc:
        db.rollback()
        username = data.username.strip()
        if not get_user_by_username(db, username):
            raise
        raise HTTPException(
            status_code=409,
            detail=f"El nombre de usuario '{username}' ya existe. Usa otro nombre o edita la cuenta existente.",
        ) from exc


@router.put("/{user_id}", response_model=UserOut)
async def put_user(user_id: int, data: UserUpdate, db: sqlite3.Connection = Depends(get_db)) -> dict:
    try:
        result = update_user(db, user_id, data)
        if not result:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        db.commit()
        return result
    except sqlite3.IntegrityError as exc:
        db.rollback()
        username = data.username.strip()
        existing = get_user_by_username(db, username)
        if not existing or existing["id"] == user_id:
            raise
        raise HTTPException(
            status_code=409,
            detail=f"El nombre de usuario '{username}' ya existe. Usa otro nombre.",
        ) from exc


@router.delete("/{user_id}", status_code=204)
async def remove_user(user_id: int, db: sqlite3.Connection = Depends(get_db)) -> Response:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user["username"].lower() == "admin":
        raise HTTPException(status_code=409, detail="La cuenta administrativa base no se puede eliminar")
    db.execute("DELETE FROM users WHERE id=?", (user_id,))
    db.commit()
    return Response(status_code=204)
