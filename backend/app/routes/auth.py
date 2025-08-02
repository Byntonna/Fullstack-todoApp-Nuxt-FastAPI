from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import schemas, crud, auth
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=schemas.User)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=409,  # Conflict вместо 400
            detail=f"Пользователь с email {user.email} уже зарегистрирован. Попробуйте войти в систему или используйте другой email."
        )
    try:
        return crud.create_user(db=db, user=user)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Произошла ошибка при создании аккаунта. Попробуйте еще раз."
        )

@router.post("/login", response_model=schemas.TokenPair)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Неверный логин или пароль",
            headers={"WWW-Authenticate": "Bearer"}
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    refresh_token = auth.create_refresh_token(db, user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(auth.get_current_user)):
    return current_user

@router.post("/refresh", response_model=schemas.TokenPair)
async def refresh_tokens(payload: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    db_token = auth.verify_refresh_token(db, payload.refresh_token)
    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": db_token.user.email}, expires_delta=access_token_expires
    )
    new_refresh_token = auth.replace_refresh_token(db, db_token)
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }