import hashlib

ADMIN_PASSWORD_SALT = "mailstreak_admin_salt_v1"

def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha512",
        password.encode("utf-8"),
        ADMIN_PASSWORD_SALT.encode("utf-8"),
        120000,
    ).hex()

# Generate all user hashes
users = [
    ("user1@mailstreak.com", "user1pass", "usr-001"),
    ("user2@mailstreak.com", "user2pass", "usr-002"),
    ("user3@mailstreak.com", "user3pass", "usr-003"),
    ("user4@mailstreak.com", "user4pass", "usr-004"),
    ("user5@mailstreak.com", "user5pass", "usr-005"),
    ("user6@mailstreak.com", "user6pass", "usr-006"),
    ("user7@mailstreak.com", "user7pass", "usr-007"),
    ("user8@mailstreak.com", "user8pass", "usr-008"),
    ("user9@mailstreak.com", "user9pass", "usr-009"),
    ("user10@mailstreak.com", "user10pass", "usr-010"),
]

print("# User hashes for security.py:\n")
for email, password, user_id in users:
    hashed = hash_password(password)
    print(f'  "{email}": {{')
    print(f'    "hash": "{hashed}",')
    print(f'    "role": "USER",')
    print(f'    "id": "{user_id}"')
    print(f'  }},')
