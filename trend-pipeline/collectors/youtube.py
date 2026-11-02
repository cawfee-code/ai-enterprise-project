from datetime import datetime, timezone
import requests
from config import YOUTUBE_API_KEY, YOUTUBE_SEARCH_TERMS, YOUTUBE_MIN_INTERVAL_SECONDS
from dedup import make_identity

SOURCE_NAME = "youtube"
SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"

_last_run = {"timestamp": 0}


def is_configured():
    return bool(YOUTUBE_API_KEY)


def _check_youtube_error(data, context):
    """Surfaces the real failure (quota exceeded, bad key, etc.) — never silently empty."""
    if isinstance(data, dict) and "error" in data:
        err = data["error"]
        raise RuntimeError(f"YouTube API error during {context}: code={err.get('code')} message={err.get('message')}")


def collect():
    if not is_configured():
        raise RuntimeError("YouTube collector not configured: YOUTUBE_API_KEY missing.")

    now = datetime.now(timezone.utc).timestamp()
    if now - _last_run["timestamp"] < YOUTUBE_MIN_INTERVAL_SECONDS:
        return []  # quota-safety skip — not an error, just not due yet

    reporting_period = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    records = []

    for term in YOUTUBE_SEARCH_TERMS:
        search_resp = requests.get(
            SEARCH_URL,
            params={"part": "snippet", "q": term, "type": "video", "order": "date", "maxResults": 10, "key": YOUTUBE_API_KEY},
            timeout=15,
        )
        search_data = search_resp.json()
        _check_youtube_error(search_data, f"search.list(q={term})")

        video_ids = [item["id"]["videoId"] for item in search_data.get("items", []) if item.get("id", {}).get("videoId")]
        if not video_ids:
            continue

        stats_resp = requests.get(
            VIDEOS_URL,
            params={"part": "statistics,snippet", "id": ",".join(video_ids), "key": YOUTUBE_API_KEY},
            timeout=15,
        )
        stats_data = stats_resp.json()
        _check_youtube_error(stats_data, f"videos.list(q={term})")

        for v in stats_data.get("items", []):
            snippet = v.get("snippet", {})
            stats = v.get("statistics", {})
            title = (snippet.get("title") or "").strip()
            if not title:
                continue

            view_count = int(stats.get("viewCount", 0) or 0)
            like_count = int(stats.get("likeCount", 0) or 0)

            record = {
                "source": SOURCE_NAME,
                "hashtag": title[:120],
                "volume": view_count + like_count,
                "searchTerm": term,
                "channelTitle": snippet.get("channelTitle"),
                "permalink": f"https://www.youtube.com/watch?v={v['id']}",
                "reportingPeriod": reporting_period,
                "collectedAt": datetime.now(timezone.utc).isoformat(),
            }
            record["_identity"] = make_identity(SOURCE_NAME, v["id"], reporting_period)
            records.append(record)

    _last_run["timestamp"] = now
    return records