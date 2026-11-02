import json
import os
import hashlib
from datetime import datetime, timezone

SEEN_FILE = os.environ.get(
    "SEEN_STORE_PATH",
    os.path.join(os.path.dirname(__file__), "data", "seen_trends.json")
)

def _load_seen():
    if os.path.exists(SEEN_FILE):
        try:
            with open(SEEN_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}
    return {}

def _save_seen(seen):
    os.makedirs(os.path.dirname(SEEN_FILE), exist_ok=True)
    tmp_path = SEEN_FILE + ".tmp"
    with open(tmp_path, "w") as f:
        json.dump(seen, f)
    os.replace(tmp_path, SEEN_FILE)  # atomic write

def make_identity(source: str, term: str, reporting_period: str) -> str:
    normalized = term.strip().lower().lstrip("#")
    raw = f"{source}:{normalized}:{reporting_period}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def partition_new(records: list, identity_fn) -> tuple:
    """Checks which records are new WITHOUT marking anything as processed yet."""
    seen = _load_seen()
    new_records = [r for r in records if identity_fn(r) not in seen]
    return new_records, len(records) - len(new_records)

def mark_processed(records: list, identity_fn):
    """Call ONLY after a confirmed successful dump — persists identities so they're never resent."""
    seen = _load_seen()
    now = datetime.now(timezone.utc).isoformat()
    for record in records:
        seen[identity_fn(record)] = now
    _save_seen(seen)