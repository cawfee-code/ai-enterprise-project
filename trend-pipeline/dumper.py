import requests
from config import NODE_DUMP_URL, INGEST_API_KEY

def dump(records: list):
    if not records:
        return {"status": "skipped", "reason": "no new records"}

    payload = [{k: v for k, v in r.items() if k != "_identity"} for r in records]

    headers = {"Content-Type": "application/json"}
    if INGEST_API_KEY:
        headers["x-ingest-key"] = INGEST_API_KEY

    response = requests.post(NODE_DUMP_URL, json=payload, headers=headers, timeout=15)

    if response.status_code not in (200, 202):
        raise RuntimeError(f"Dump failed: {response.status_code} {response.text}")

    return {"status": "ok", "count": len(payload)}