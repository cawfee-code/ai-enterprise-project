import asyncio
import logging
import os
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from config import POLL_INTERVAL_SECONDS
import dedup
import dumper
from collectors import google_trends, instagram, facebook, youtube

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trend-pipeline")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

COLLECTORS = {
    "google_trends": google_trends.collect,
    "instagram": instagram.collect,
    "facebook": facebook.collect,
    "youtube": youtube.collect,
}

ADMIN_KEY = os.environ.get("ADMIN_KEY", "")

def verify_admin_key(x_admin_key: str = Header(default="")):
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing admin key")


def run_collector(name, collect_fn):
    """Each collector is isolated — one failing never blocks the others,
    and nothing is marked processed unless the dump is confirmed."""
    identity_fn = lambda r: r["_identity"]
    try:
        records = collect_fn()
        new_records, skipped = dedup.partition_new(records, identity_fn)

        if not new_records:
            logger.info(f"[{name}] collected={len(records)} all duplicates ({skipped}), nothing to send")
            return {"source": name, "status": "ok", "collected": len(records), "new": 0}

        result = dumper.dump(new_records)  # raises if not acknowledged

        dedup.mark_processed(new_records, identity_fn)  # only after confirmed success

        logger.info(f"[{name}] collected={len(records)} new={len(new_records)} dump={result}")
        return {"source": name, "status": "ok", "collected": len(records), "new": len(new_records), "dump_result": result}
    except Exception as e:
        logger.error(f"[{name}] FAILED (nothing marked processed — will retry next cycle): {e}")
        return {"source": name, "status": "error", "error": str(e)}


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(polling_loop())


async def polling_loop():
    logger.info("Trend pipeline: polling loop active")
    while True:
        for name, collect_fn in COLLECTORS.items():
            run_collector(name, collect_fn)
        await asyncio.sleep(POLL_INTERVAL_SECONDS)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/run-once/{source}")
async def run_once(source: str, _: None = Depends(verify_admin_key)):
    """Protected — requires x-admin-key header matching ADMIN_KEY."""
    if source not in COLLECTORS:
        return {"error": f"Unknown source '{source}'. Valid: {list(COLLECTORS.keys())}"}
    return run_collector(source, COLLECTORS[source])


@app.get("/demo-dry-run")
async def demo_dry_run():
    """Demo Mode: validates/returns simulated records. Never posts to
    /api/trends/dump, never touches MongoDB, never touches the real pipeline."""
    import json
    demo_path = os.path.join(os.path.dirname(__file__), "demo_data", "demo_trends.json")
    with open(demo_path) as f:
        demo_records = json.load(f)
    valid = all(r.get("source") and r.get("hashtag") for r in demo_records)
    return {"mode": "DEMO — not submitted to the real pipeline", "record_count": len(demo_records), "schema_valid": valid, "records": demo_records}