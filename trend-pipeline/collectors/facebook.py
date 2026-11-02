from datetime import datetime, timezone
import requests
from config import FB_PAGE_ACCESS_TOKEN, FB_PAGE_IDS, GRAPH_API_VERSION
from dedup import make_identity

SOURCE_NAME = "facebook"
GRAPH_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


def is_configured():
    return bool(FB_PAGE_ACCESS_TOKEN and FB_PAGE_IDS)


def _check_graph_error(data, context):
    if isinstance(data, dict) and "error" in data:
        err = data["error"]
        raise RuntimeError(
            f"Meta Graph API error during {context}: "
            f"type={err.get('type')} code={err.get('code')} "
            f"subcode={err.get('error_subcode')} message={err.get('message')}"
        )


def collect():
    if not is_configured():
        raise RuntimeError("Facebook collector not configured: FB_PAGE_ACCESS_TOKEN / FB_PAGE_IDS missing.")

    reporting_period = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    records = []

    for page_id in FB_PAGE_IDS:
        resp = requests.get(
            f"{GRAPH_BASE}/{page_id}/posts",
            params={
                "fields": "message,created_time,permalink_url,likes.summary(true),comments.summary(true)",
                "access_token": FB_PAGE_ACCESS_TOKEN,
                "limit": 25,
            },
            timeout=15,
        )
        data = resp.json()
        _check_graph_error(data, f"posts(page_id={page_id})")

        posts = data.get("data", [])
        for post in posts:
            message = (post.get("message") or "").strip()
            if not message:
                continue

            likes = post.get("likes", {}).get("summary", {}).get("total_count", 0)
            comments = post.get("comments", {}).get("summary", {}).get("total_count", 0)
            term = message[:60]

            record = {
                "source": SOURCE_NAME,
                "hashtag": term,
                "volume": likes + comments,
                "pageId": page_id,
                "permalink": post.get("permalink_url"),
                "reportingPeriod": reporting_period,
                "collectedAt": datetime.now(timezone.utc).isoformat(),
            }
            record["_identity"] = make_identity(SOURCE_NAME, f"{page_id}:{post.get('id')}", reporting_period)
            records.append(record)

    return records