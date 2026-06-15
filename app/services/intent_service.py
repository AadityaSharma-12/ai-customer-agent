"""LLM-based intent classification for the conversational agent.

The agent's business logic (refund math, retention eligibility, KB lookups,
audit logging) is entirely deterministic and lives elsewhere. This module's
job is narrow: turn a customer's free-text message into one of two
classifications so the deterministic workflow knows which branch to take.

Both functions fail safe — if the Gemini API is unreachable, unconfigured, or
returns something unparseable, they fall back to a default rather than
raising, so the agent degrades gracefully instead of 500ing.
"""
import os
import re
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

_DEFAULT_MODEL = "gemini-flash-latest"

_DECLINE_KEYWORDS = (
    "cancel", "decline", "no", "nope", "not interested", "don't want",
    "remove", "end my", "stop",
)
_ACCEPT_KEYWORDS = (
    "accept", "keep", "stay", "yes", "ok", "okay",
    "sounds good", "that works", "i'll take it",
)


class CancellationIntent(BaseModel):
    is_cancellation_request: bool


class OfferDecision(BaseModel):
    decision: Literal["accept", "decline", "unclear"]


def _keyword_fallback_decision(message: str) -> Literal["accept", "decline", "unclear"]:
    """Lightweight local classification used when Gemini is unavailable or rate-limited.

    Looks for clear accept/decline wording. If both or neither are present,
    the reply is genuinely ambiguous and "unclear" is the right answer.
    """
    text = message.lower()
    has_decline = any(re.search(r"\b" + re.escape(word) + r"\b", text) for word in _DECLINE_KEYWORDS)
    has_accept = any(re.search(r"\b" + re.escape(word) + r"\b", text) for word in _ACCEPT_KEYWORDS)

    if has_decline and not has_accept:
        return "decline"
    if has_accept and not has_decline:
        return "accept"
    return "unclear"


_client = None


def _get_client():
    """Lazily construct the Gemini client. Returns None if no API key is configured."""
    global _client
    if _client is None:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return None
        from google import genai

        _client = genai.Client(api_key=api_key)
    return _client


def _model_name() -> str:
    return os.environ.get("GEMINI_MODEL", _DEFAULT_MODEL)


def classify_cancellation_intent(message: str) -> bool:
    """Return True if the customer's message is a request to cancel/end/downgrade their subscription."""
    try:
        client = _get_client()
        if client is None:
            return True

        response = client.models.generate_content(
            model=_model_name(),
            contents=(
                "A customer support agent for a subscription service received this "
                "message from a customer:\n\n"
                f'"{message}"\n\n'
                "Determine whether the customer is asking to cancel, close, end, or "
                "downgrade their subscription/account (treat any of these as a "
                "cancellation request)."
            ),
            config={
                "response_mime_type": "application/json",
                "response_schema": CancellationIntent,
                "http_options": {"timeout": 10000},
            },
        )
        return response.parsed.is_cancellation_request
    except Exception:
        return True


def classify_offer_decision(message: str, offer: dict) -> Literal["accept", "decline", "unclear"]:
    """Classify the customer's reply to a retention offer as accept, decline, or unclear."""
    try:
        client = _get_client()
        if client is None:
            return _keyword_fallback_decision(message)

        response = client.models.generate_content(
            model=_model_name(),
            contents=(
                "A customer asked to cancel their subscription. Before proceeding, "
                "the support agent offered them the following retention offer:\n\n"
                f'"{offer.get("type")}" — {offer.get("description")}\n\n'
                "The customer replied:\n\n"
                f'"{message}"\n\n'
                "Classify the reply as:\n"
                '- "accept": the customer wants to take the offer and keep their subscription.\n'
                '- "decline": the customer still wants to cancel/does not want the offer.\n'
                '- "unclear": the reply does not clearly indicate either of the above.'
            ),
            config={
                "response_mime_type": "application/json",
                "response_schema": OfferDecision,
                "http_options": {"timeout": 10000},
            },
        )
        return response.parsed.decision
    except Exception:
        return _keyword_fallback_decision(message)
