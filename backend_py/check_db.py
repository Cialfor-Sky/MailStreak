import sqlite3
import json
from datetime import datetime

def check_db():
    conn = sqlite3.connect('./data/mailstreak.db')
    conn.row_factory = sqlite3.Row
    
    print("\n--- DEBUGGING SEVERITY TRENDS ---")
    query = """
        SELECT timestamp, datetime(timestamp) as dt, datetime('now', '-24 hours') as window_start,
               (datetime(timestamp) >= datetime('now', '-24 hours')) as is_in_window
        FROM alerts
        ORDER BY timestamp DESC
        LIMIT 5
    """
    debug = conn.execute(query).fetchall()
    for d in debug:
        print(dict(d))

if __name__ == "__main__":
    check_db()
