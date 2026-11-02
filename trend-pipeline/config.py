import os

POLL_INTERVAL_SECONDS = int(os.environ.get("POLL_INTERVAL_SECONDS", "1800"))
NODE_DUMP_URL = os.environ.get("NODE_DUMP_URL", "http://platform-backend:5000/api/trends/dump")
INGEST_API_KEY = os.environ.get("INGEST_API_KEY", "")
ADMIN_KEY = os.environ.get("ADMIN_KEY", "")

PROXY_LIST = [p.strip() for p in os.environ.get("PROXY_LIST", "").split(",") if p.strip()]

GOOGLE_TRENDS_GEO = os.environ.get("GOOGLE_TRENDS_GEO", "US")

# Optional fashion/merchandise keyword filter for the Google Trends collector.
# Comma-separated, case-insensitive substring match against the trend term.
# Leave unset/empty to disable filtering entirely (collector behaves exactly as before).
_raw_fashion_keywords = os.environ.get("GOOGLE_TRENDS_FASHION_KEYWORDS", "")
GOOGLE_TRENDS_FASHION_KEYWORDS = [
    kw.strip().lower() for kw in _raw_fashion_keywords.split(",") if kw.strip()
]

# Instagram Graph API — dormant until real credentials exist
IG_ACCESS_TOKEN = os.environ.get("IG_ACCESS_TOKEN", "")
IG_BUSINESS_ACCOUNT_ID = os.environ.get("IG_BUSINESS_ACCOUNT_ID", "")
IG_HASHTAGS = [h.strip() for h in os.environ.get("IG_HASHTAGS", "fashion,streetwear,sustainablefashion").split(",") if h.strip()]

# Facebook Graph API — dormant until real credentials exist
FB_PAGE_ACCESS_TOKEN = os.environ.get("FB_PAGE_ACCESS_TOKEN", "")
FB_PAGE_IDS = [p.strip() for p in os.environ.get("FB_PAGE_IDS", "").split(",") if p.strip()]

# YouTube Data API v3 — dormant until a real API key exists
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
YOUTUBE_SEARCH_TERMS = [t.strip() for t in os.environ.get("YOUTUBE_SEARCH_TERMS", "fashion haul,streetwear,ootd,fashion trends").split(",") if t.strip()]
YOUTUBE_MIN_INTERVAL_SECONDS = int(os.environ.get("YOUTUBE_MIN_INTERVAL_SECONDS", "14400"))  # 4 hours, keeps us under the free daily quota

GRAPH_API_VERSION = os.environ.get("GRAPH_API_VERSION", "v25.0")