from datetime import timedelta, datetime, timezone
from os import getenv
import secrets
from typing import Optional
from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError

from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import schemas, models
from .database import get_db

SECRET_KEY = getenv('AUTH_SECRET_KEY')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 180

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_refresh_token(db: Session, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = models.RefreshToken(token=token, user_id=user_id, expires_at=expires_at)
    db.add(db_token)
    db.commit()
    return token

def replace_refresh_token(db: Session, old_token: models.RefreshToken) -> str:
    db.delete(old_token)
    db.commit()
    return create_refresh_token(db, old_token.user_id)

def verify_refresh_token(db: Session, token: str) -> Optional[models.RefreshToken]:
    db_token = db.query(models.RefreshToken).filter(models.RefreshToken.token == token).first()
    if db_token and db_token.expires_at > datetime.now(timezone.utc):
        return db_token
    return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создает JWT-токен с данными пользователя"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user