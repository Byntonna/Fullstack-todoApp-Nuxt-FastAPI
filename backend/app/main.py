from dotenv import load_dotenv
import os

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from . import models
from .database import engine
from .routes import todos, auth, categories, tags, anki_export

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Todo API",
    description="Fullstack Todo application with FastAPI and Nuxt",
    version="1.0"
)

origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(todos.router)
app.include_router(categories.router)
app.include_router(tags.router)
app.include_router(anki_export.router)

@app.get("/")
async def root():
    return {"message": "App is running"}
