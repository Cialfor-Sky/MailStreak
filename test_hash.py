import hashlib

# Test password hashing
ADMIN_PASSWORD_SALT = "mailstreak_admin_salt_v1"

def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha512",
        password.encode("utf-8"),
        ADMIN_PASSWORD_SALT.encode("utf-8"),
        120000,
    ).hex()

# Test all user passwords
users = {
    "supadmin@mailstreak.com": "supadminpass",
    "admin@mailstreak.com": "adminpass",
    "user1@mailstreak.com": "user1pass",
    "user2@mailstreak.com": "user2pass",
}

print("Testing password hashes:\n")
for email, password in users.items():
    hashed = hash_password(password)
    print(f"{email}")
    print(f"  Password: {password}")
    print(f"  Hash: {hashed}")
    print()
