import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from ..deps import current_user, get_db
from ..repositories import get_user_by_username
from ..schemas import Token, UserLogin, UserOut
from ..security import create_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: sqlite3.Connection = Depends(get_db)) -> Token:
    user = get_user_by_username(db, data.username)
    if not user or not user["is_active"] or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return Token(access_token=create_token(user["id"]))


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(current_user)) -> dict:
    return user
