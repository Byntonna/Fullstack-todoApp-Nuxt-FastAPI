from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from datetime import date

from .. import auth, crud, schemas
from ..database import get_db

router = APIRouter(prefix="/anki-export", tags=["anki"])

@router.get("/", response_class=Response)
async def export_anki(
    current_user: schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    todos = crud.get_todos(db, user_id=current_user.id, skip=0, limit=10000)

    def sanitize(value: str | None) -> str:
        return (value or "").replace("\t", " ").replace("\r", "").replace("\n", "<br>")

    header = "Front\tBack"
    rows = [f"{sanitize(t.title)}\t{sanitize(t.description)}" for t in todos]
    content = "\n".join([header, *rows])

    return Response(
        content=content,
        media_type="text/tab-separated-values",
        headers={
            "Content-Disposition": f'attachment; filename="anki_{date.today().isoformat()}.tsv"'
        }
    )