from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analyze
from app.core.database import Base, engine
from app.database import init_db

# Create core tables
Base.metadata.create_all(bind=engine)

# Create postgres tables
init_db()

app = FastAPI(
    title="AI-Powered Email Threat Detection API",
    description="MVP backend for parsing, analyzing, and scoring email threats.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api/v1", tags=["Analysis"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the Email Threat Detection API"}
