import requests
import json
import os

# Trying to find the base URL
# Frontend api.js uses window.location.hostname
# backend main.py defaults to 8000
BASE_URL = "http://localhost:8000"

def verify_api():
    print(f"Verifying API at {BASE_URL}...")
    
    # We need a token. We can try to get one if we have a test user, 
    # but the user said they are logged in.
    # However, since I'm a script, I might not have the session.
    # Let's try to hit the health endpoint first
    try:
        health = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {health.status_code}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return

    # Since I don't have an auth token easily, I'll check if there's a bypass or just 
    # check the service layer logic using a python script that imports the app
    print("\n--- Testing Service Layer Directly ---")
    try:
        import sys
        sys.path.append(os.getcwd())
        from app.services import analytics_service
        from app.core.config import settings
        
        # Ensure we are pointing to the right DB
        print(f"DB Path from settings: {settings.db_path}")
        
        data = analytics_service.get_dashboard_data()
        
        print("\n--- Analytics Data Result ---")
        print(f"KPIs returned: {len(data['kpis'])}")
        print(f"Threat Distribution items: {len(data['threatDistribution'])}")
        print(f"Severity Trends items: {len(data['severityTrends'])}")
        print(f"Email Volume items: {len(data['emailVolume'])}")
        
        if len(data['severityTrends']) > 0:
            print("\nSUCCESS: Severity Trends are now populated!")
            print(f"Sample Trend: {data['severityTrends'][0]}")
        else:
            print("\nWARNING: Severity Trends are still empty.")
            
        if len(data['emailVolume']) > 0:
            print("SUCCESS: Email Volume is now populated!")
            print(f"Sample Volume: {data['emailVolume'][0]}")
        else:
            print("WARNING: Email Volume is still empty.")
            
    except Exception as e:
        print(f"Service layer test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_api()
