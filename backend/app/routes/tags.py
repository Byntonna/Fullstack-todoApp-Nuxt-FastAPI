from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas, auth, crud
from ..database import get_db

router = APIRouter(prefix="/tags", tags=["tags"])

@router.get("/", response_model=List[schemas.Tag])
async def read_tags(
    current_user: schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_tags(db, current_user.id)

@router.post("/", response_model=schemas.Tag)
async def create_tag(
    tag: schemas.TagCreate,
    current_user: schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_tag(db, tag.name, current_user.id)