import itertools
from config import PROXY_LIST

_cycle = itertools.cycle(PROXY_LIST) if PROXY_LIST else None

def get_proxy():
    """Next proxy in rotation, or None if none are configured (direct connection)."""
    if _cycle is None:
        return None
    return next(_cycle)