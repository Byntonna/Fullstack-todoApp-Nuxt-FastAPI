from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas, auth, crud
from ..database import get_db

router = APIRouter(prefix="/todos", tags=["todos"])

@router.get("/", response_model=List[schemas.Todo])
async def read_todos(
        skip: int = 0,
        limit: int = 100,
        current_user: schemas.User = Depends(auth.get_current_user),
        db: Session = Depends(get_db)
):
    """Получение задачи пользователя"""
    todos = crud.get_todos(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )

    return todos

@router.post("/", response_model=schemas.Todo)
async def create_todo(
        todo: schemas.TodoCreate,
        user: schemas.User = Depends(auth.get_current_user),
        db: Session = Depends(get_db)
):
    """Создание задачи"""
    return crud.create_todo(db=db, todo=todo, user_id=user.id)

@router.put("/{todo_id}", response_model=schemas.Todo)
async def update_todo(
        todo_id: int,
        todo_update: schemas.TodoUpdate,
        current_user: schemas.User = Depends(auth.get_current_user),
        db: Session = Depends(get_db)
):
    """Обновление задачи"""
    db_todo = crud.update_todo(db, todo_id, todo_update, current_user.id)

    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    return db_todo

@router.delete("/{todo_id}", response_model=schemas.Todo)
async def delete_todo(
        todo_id: int,
        user_id: schemas.User = Depends(auth.get_current_user),
        db: Session = Depends(get_db)
):
    todo_delete = crud.delete_todo(db, todo_id, user_id.id)

    if todo_delete is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    return todo_delete