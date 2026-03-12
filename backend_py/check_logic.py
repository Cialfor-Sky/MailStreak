import sqlite3
import json
from datetime import datetime, timedelta

def backfill_test(data, time_key="time", value_keys=None, freq="hour"):
    if not value_keys: value_keys = []
    result = []
    now = datetime.utcnow()
    if freq == "hour":
        for i in range(23, -1, -1):
            ts = now - timedelta(hours=i)
            ts_str = ts.strftime('%m-%d %H:00')
            match = next((item for item in data if item[time_key] == ts_str), None)
            if match: result.append(match)
            else:
                row = {time_key: ts_str}
                for vk in value_keys: row[vk] = 0
                result.append(row)
    elif freq == "minute":
        for i in range(23, -1, -1):
            ts = now - timedelta(hours=i)
            ts_str = ts.strftime('%H:00')
            match = next((item for item in data if item[time_key].startswith(ts_str[:2])), None)
            if match: result.append(match)
            else:
                row = {time_key: ts_str}
                for vk in value_keys: row[vk] = 0
                result.append(row)
    return result

def check_logic():
    conn = sqlite3.connect('./data/mailstreak.db')
    conn.row_factory = sqlite3.Row
    
    # 1. Severity Trends
    rows = conn.execute("""
        SELECT strftime('%H:%M', timestamp) as time,
               SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
               SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
               SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
               SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
        FROM alerts
        WHERE datetime(timestamp) >= datetime('now', '-24 hours')
        GROUP BY time
        ORDER BY timestamp ASC
    """).fetchall()
    trends = [dict(r) for r in rows]
    print(f"Raw trends count: {len(trends)}")
    
    backfilled = backfill_test(trends, value_keys=["critical", "high", "medium", "low"], freq="minute")
    print(f"Backfilled trends count: {len(backfilled)}")
    print(f"Tail of trends: {backfilled[-5:]}")
    
    # 2. Email Volume
    v_rows = conn.execute("""
        SELECT strftime('%Y-%m-%d %H:00', timestamp) as date,
               COUNT(*) as total,
               SUM(CASE WHEN classification != 'clean' THEN 1 ELSE 0 END) as threats,
               SUM(CASE WHEN classification = 'clean' THEN 1 ELSE 0 END) as clean
        FROM emails
        WHERE datetime(timestamp) >= datetime('now', '-24 hours')
        GROUP BY date
        ORDER BY date ASC
    """).fetchall()
    volume = [dict(r) for r in v_rows]
    print(f"Raw volume count: {len(volume)}")
    
    # Use the CORRECT format in the test now
    def backfill_test_fixed(data, time_key="time", value_keys=None, freq="hour"):
        if not value_keys: value_keys = []
        result = []
        now = datetime.utcnow()
        if freq == "hour":
            for i in range(23, -1, -1):
                ts = now - timedelta(hours=i)
                ts_str = ts.strftime('%Y-%m-%d %H:00')
                match = next((item for item in data if item[time_key] == ts_str), None)
                if match: result.append(match)
                else:
                    row = {time_key: ts_str}
                    for vk in value_keys: row[vk] = 0
                    result.append(row)
        return result

    v_backfilled = backfill_test_fixed(volume, time_key="date", value_keys=["scanned", "threats", "clean", "total"], freq="hour")
    print(f"Backfilled volume count: {len(v_backfilled)}")
    print(f"Tail of volume: {v_backfilled[-5:]}")

if __name__ == "__main__":
    check_logic()
