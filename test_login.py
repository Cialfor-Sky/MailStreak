import requests
import json

# Test login endpoint
url = "http://127.0.0.1:8000/auth/login"
payload = {
    "email": "supadmin@mailstreak.com",
    "password": "supadminpass"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ LOGIN SUCCESSFUL!")
        print("Backend is working correctly.")
    else:
        print("\n❌ LOGIN FAILED!")
        
except Exception as e:
    print(f"❌ ERROR: {e}")
