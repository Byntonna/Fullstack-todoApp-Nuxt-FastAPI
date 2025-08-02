from sqlalchemy.orm import Session, joinedload
from . import models, schemas, auth


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email=email)

    if not user or not auth.verify_password(password, user.hashed_password):
        return False

    return user

# CRUD для задачника
def get_todos(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Todo)
        .options(joinedload(models.Todo.category), joinedload(models.Todo.tags))
        .filter(models.Todo.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_todo(db: Session, todo: schemas.TodoCreate, user_id: int):
    data = todo.model_dump(exclude={"category", "tags"})
    db_todo = models.Todo(**data, user_id=user_id)

    if todo.category:
        category = (
            db.query(models.Category)
            .filter(models.Category.name == todo.category, models.Category.user_id == user_id)
            .first()
        )
        if not category:
            category = models.Category(name=todo.category, user_id=user_id)
            db.add(category)
            db.commit()
            db.refresh(category)
        db_todo.category = category

    tag_objs = []
    for tag_name in todo.tags:
        tag = (
            db.query(models.Tag)
            .filter(models.Tag.name == tag_name, models.Tag.user_id == user_id)
            .first()
        )
        if not tag:
            tag = models.Tag(name=tag_name, user_id=user_id)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        tag_objs.append(tag)
    if tag_objs:
        db_todo.tags = tag_objs

    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

def update_todo(db: Session, todo_id: int, todo_update: schemas.TodoUpdate, user_id: int):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id, models.Todo.user_id == user_id).first()

    if db_todo:
        update_data = todo_update.model_dump(exclude_unset=True, exclude={"category", "tags"})
        for key, value in update_data.items():
            setattr(db_todo, key, value)

        if todo_update.category is not None:
            if todo_update.category == "":
                db_todo.category = None
            else:
                category = (
                    db.query(models.Category)
                    .filter(models.Category.name == todo_update.category, models.Category.user_id == user_id)
                    .first()
                )
                if not category:
                    category = models.Category(name=todo_update.category, user_id=user_id)
                    db.add(category)
                    db.commit()
                    db.refresh(category)
                db_todo.category = category

        if todo_update.tags is not None:
            tag_objs = []
            for tag_name in todo_update.tags:
                tag = (
                    db.query(models.Tag)
                    .filter(models.Tag.name == tag_name, models.Tag.user_id == user_id)
                    .first()
                )
                if not tag:
                    tag = models.Tag(name=tag_name, user_id=user_id)
                    db.add(tag)
                    db.commit()
                    db.refresh(tag)
                tag_objs.append(tag)
            db_todo.tags = tag_objs

        db.commit()
        db.refresh(db_todo)
    return db_todo

def delete_todo(db: Session, todo_id: int, user_id: int):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id, models.Todo.user_id == user_id).first()

    if db_todo:
        db.delete(db_todo)
        db.commit()

    return db_todo


def get_categories(db: Session, user_id: int):
    return db.query(models.Category).filter(models.Category.user_id == user_id).all()


def create_category(db: Session, name: str, user_id: int):
    existing = (
        db.query(models.Category)
        .filter(models.Category.name == name, models.Category.user_id == user_id)
        .first()
    )
    if existing:
        return existing
    category = models.Category(name=name, user_id=user_id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_tags(db: Session, user_id: int):
    return db.query(models.Tag).filter(models.Tag.user_id == user_id).all()


def create_tag(db: Session, name: str, user_id: int):
    existing = (
        db.query(models.Tag)
        .filter(models.Tag.name == name, models.Tag.user_id == user_id)
        .first()
    )
    if existing:
        return existing
    tag = models.Tag(name=name, user_id=user_id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag
