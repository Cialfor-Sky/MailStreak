import json
import re

with open("app/heuristics/rules.json", "r", encoding="utf-8-sig") as f:
    RULES = json.load(f)["rules"]


def run_heuristics(content: str):
    indicators = []
    score = 0
    for rule in RULES:
        if re.search(rule["pattern"], content, flags=re.IGNORECASE):
            indicators.append(rule["id"].replace("_", " "))
            score += rule["score"]
    score = max(0, min(score, 100))
    return score, indicators
