"""Knowledge base loader for cancellation & retention policy data."""
import json
from functools import lru_cache
from pathlib import Path

_POLICY_PATH = Path(__file__).parent / "cancellation_policy.json"


@lru_cache(maxsize=1)
def load_cancellation_policy() -> dict:
    """Load and cache the cancellation policy knowledge base from disk."""
    with open(_POLICY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
