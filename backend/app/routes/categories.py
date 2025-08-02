from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas, auth, crud
from ..database import get_db

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=List[schemas.Category])
async def read_categories(
    current_user: schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_categories(db, current_user.id)

@router.post("/", response_model=schemas.Category)
async def create_category(
    category: schemas.CategoryCreate,
    current_user: schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_category(db, category.name, current_user.id)