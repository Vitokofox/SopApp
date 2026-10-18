from __future__ import annotations

import sqlite3
from collections.abc import Callable, Generator

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .database import connect
from .repositories import get_user_by_id
from .security import decode_token

bearer = HTTPBearer(auto_error=False)


async def get_db() -> Generator[sqlite3.Connection, None, None]:
    connection = connect()
    try:
        yield connection
    finally:
        connection.close()


async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: sqlite3.Connection = Depends(get_db),
) -> dict:
    unauthorized = HTTPException(status_code=401, detail="No autenticado", headers={"WWW-Authenticate": "Bearer"})
    if not credentials:
        raise unauthorized
    try:
        user = get_user_by_id(db, decode_token(credentials.credentials))
    except (jwt.PyJWTError, ValueError, KeyError):
        raise unauthorized
    if not user or not user["is_active"]:
        raise unauthorized
    return user


def require(permission: str) -> Callable:
    async def dependency(user: dict = Depends(current_user)) -> dict:
        if permission not in user["permissions"]:
            raise HTTPException(status_code=403, detail="Permiso insuficiente")
        return user
    return dependency
