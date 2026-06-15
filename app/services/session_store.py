"""In-memory conversation state for the free-text retention flow.

Keyed by customer_id. A session being present means "a retention offer has
been presented and the agent is waiting on the customer's accept/decline
reply." Mirrors the in-memory store pattern used by app/mcp/zoho_client.py.
"""

_SESSIONS: dict[str, dict] = {}


def get_session(customer_id: str) -> dict | None:
    return _SESSIONS.get(customer_id)


def save_session(customer_id: str, session: dict) -> None:
    _SESSIONS[customer_id] = session


def clear_session(customer_id: str) -> None:
    _SESSIONS.pop(customer_id, None)
