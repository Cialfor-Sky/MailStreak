import os
import json
from app.services.seed_service import seed_now

if __name__ == "__main__":
    seed_now()
    print("Seed data inserted.")
