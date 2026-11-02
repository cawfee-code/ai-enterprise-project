from datetime import datetime, timezone
import requests
from config import IG_ACCESS_TOKEN, IG_BUSINESS_ACCOUNT_ID, IG_HASHTAGS, GRAPH_API_VERSION
from dedup import make_identity

SOURCE_NAME = "instagram"
GRAPH_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


def is_configured():
    return bool(IG_ACCESS_TOKEN and IG_BUSINESS_ACCOUNT_ID)


def _check_graph_error(data, context):
    """Raises with the real Meta error detail — never silently treated as empty results."""
    if isinstance(data, dict) and "error" in data:
        err = data["error"]
        raise RuntimeError(
            f"Meta Graph API error during {context}: "
            f"type={err.get('type')} code={err.get('code')} "
            f"subcode={err.get('error_subcode')} message={err.get('message')}"
        )


def collect():
    if not is_configured():
        raise RuntimeError("Instagram collector not configured: IG_ACCESS_TOKEN / IG_BUSINESS_ACCOUNT_ID missing.")

    reporting_period = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    records = []

    for tag in IG_HASHTAGS:
        search_resp = requests.get(
            f"{GRAPH_BASE}/ig_hashtag_search",
            params={"user_id": IG_BUSINESS_ACCOUNT_ID, "q": tag, "access_token": IG_ACCESS_TOKEN},
            timeout=15,
        )
        search_data = search_resp.json()
        _check_graph_error(search_data, f"ig_hashtag_search(q={tag})")

        if not search_data.get("data"):
            continue  # genuinely no match for this tag — not an error

        hashtag_id = search_data["data"][0]["id"]

        media_resp = requests.get(
            f"{GRAPH_BASE}/{hashtag_id}/top_media",
            params={
                "user_id": IG_BUSINESS_ACCOUNT_ID,
                "fields": "id,caption,like_count,comments_count,timestamp,permalink",
                "access_token": IG_ACCESS_TOKEN,
            },
            timeout=15,
        )
        media_data = media_resp.json()
        _check_graph_error(media_data, f"top_media(hashtag={tag})")

        media_items = media_data.get("data", [])
        total_engagement = sum((m.get("like_count", 0) or 0) + (m.get("comments_count", 0) or 0) for m in media_items)

        record = {
            "source": SOURCE_NAME,
            "hashtag": tag,
            "volume": total_engagement,
            "topMediaSampleSize": len(media_items),
            "reportingPeriod": reporting_period,
            "collectedAt": datetime.now(timezone.utc).isoformat(),
        }
        record["_identity"] = make_identity(SOURCE_NAME, tag, reporting_period)
        records.append(record)

    return records