import requests
import json

# Test user1 login
url = "http://127.0.0.1:8000/auth/login"
payload = {
    "email": "user1@mailstreak.com",
    "password": "user1pass"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("LOGIN SUCCESSFUL!")
        print(f"User: {data.get('user', {}).get('email')}")
        print(f"Role: {data.get('user', {}).get('role')}")
        print(f"Token: {data.get('access_token', '')[:50]}...")
    else:
        print("LOGIN FAILED!")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"ERROR: {e}")
