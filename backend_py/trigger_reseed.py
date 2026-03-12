import sys
import os
sys.path.append(os.getcwd())
from app.services import seed_service

def reseed():
    print("Reseeding with distributed timestamps...")
    result = seed_service.seed_now()
    print(f"Result: {result}")

if __name__ == "__main__":
    reseed()
