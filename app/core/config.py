import os

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mvp.db")
    
    def __init__(self):
        if os.getenv("VERCEL") == "1" and "sqlite" in self.DATABASE_URL:
            raise Exception("DATABASE_URL must be a valid PostgreSQL string in Vercel production. SQLite is ephemeral and will lose data.")

settings = Settings()
