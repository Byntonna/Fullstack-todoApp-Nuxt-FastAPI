from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, EmailStr
from .models import Priority


# Схемы для задачника
class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.P3
    due_date: Optional[date] = None

class TodoCreate(TodoBase):
    category_id: Optional[int] = None
    tags: List[str] = []


class TodoUpdate(TodoBase):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[Priority] = None
    due_date: Optional[date] = None
    category_id: Optional[int] = None
    tags: Optional[List[str]] = None


class CategoryCreate(BaseModel):
    name: str
    color: str = "#ffffff"

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class Category(BaseModel):
    id: int
    name: str
    color: str
    todo_count: int = 0

    class Config:
        from_attributes = True


class TagCreate(BaseModel):
    name: str


class Tag(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class Todo(TodoBase):
    id: int
    completed: bool
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[Category] = None
    tags: List[Tag] = []

    class Config:
        from_attributes = True


# Схемы для пользователей
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    todos: List[Todo] = []

# Схемы для аутентификации
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPair(Token):
    refresh_token: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    email: Optional[str] = None
