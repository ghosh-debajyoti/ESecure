import sys
import os

# Add the project root to the sys.path to allow imports to work exactly as they do in the app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base
# Import the model so that metadata is populated
from app.models import EmailAnalysis

def verify_db():
    try:
        # Try creating the tables
        Base.metadata.create_all(bind=engine)
        print("✅ SUCCESS: Successfully connected to PostgreSQL!")
        print("✅ SUCCESS: EmailAnalysis table verified/created.")
    except Exception as e:
        print("❌ FAILED: Could not connect to PostgreSQL or create tables.")
        print(f"Error details: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_db()
