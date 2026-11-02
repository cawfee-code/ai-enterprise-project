from datetime import datetime, timezone
import logging
import feedparser
from scrapling.fetchers import Fetcher
from proxy_rotator import get_proxy
from config import GOOGLE_TRENDS_GEO, GOOGLE_TRENDS_FASHION_KEYWORDS
from dedup import make_identity

logger = logging.getLogger("trend-pipeline.google_trends")

SOURCE_NAME = "google_trends"
FEED_URL = f"https://trends.google.com/trending/rss?geo={GOOGLE_TRENDS_GEO}"


def _parse_traffic(raw_value):
    if not raw_value:
        return None
    digits = "".join(ch for ch in raw_value if ch.isdigit())
    return int(digits) if digits else None


def _get_response_text(response):
    """Scrapling's Response exposes .body as bytes — fall back to .text if present."""
    if hasattr(response, "text") and isinstance(response.text, str) and response.text:
        return response.text
    body = getattr(response, "body", None)
    if isinstance(body, bytes):
        return body.decode("utf-8", errors="replace")
    if isinstance(body, str):
        return body
    raise RuntimeError("Could not extract response body as text from Scrapling Response object")


def _matches_fashion_filter(term):
    """If no keywords are configured, filtering is disabled — keep everything."""
    if not GOOGLE_TRENDS_FASHION_KEYWORDS:
        return True
    term_lower = term.lower()
    return any(keyword in term_lower for keyword in GOOGLE_TRENDS_FASHION_KEYWORDS)


def collect():
    proxy = get_proxy()
    response = Fetcher.get(FEED_URL, proxy=proxy, timeout=15)

    if response.status != 200:
        raise RuntimeError(f"Google Trends RSS returned status {response.status}")

    raw_text = _get_response_text(response)
    logger.info(f"fetched {len(raw_text)} chars, first 200: {raw_text[:200]!r}")

    feed = feedparser.parse(raw_text)
    logger.info(f"feedparser found {len(feed.entries)} entries, bozo={feed.bozo}")

    if feed.bozo and not feed.entries:
        raise RuntimeError(f"Failed to parse Google Trends RSS: {feed.bozo_exception}")

    reporting_period = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    records = []
    filtered_out = 0

    for entry in feed.entries:
        term = entry.get("title", "").strip()
        if not term:
            continue

        if not _matches_fashion_filter(term):
            filtered_out += 1
            continue

        raw_traffic = entry.get("ht_approx_traffic") or entry.get("approx_traffic")
        volume = _parse_traffic(raw_traffic)

        record = {
            "source": SOURCE_NAME,
            "hashtag": term,
            "volume": volume,
            "rawTrafficLabel": raw_traffic,
            "reportingPeriod": reporting_period,
            "collectedAt": datetime.now(timezone.utc).isoformat(),
        }
        record["_identity"] = make_identity(SOURCE_NAME, term, reporting_period)
        records.append(record)

    if GOOGLE_TRENDS_FASHION_KEYWORDS:
        logger.info(f"fashion keyword filter active: kept {len(records)}, filtered out {filtered_out}")

    return records