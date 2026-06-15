"""Tests for app/services/intent_service.py — the Gemini-based classifiers.

No real API key is used: `genai.Client` is monkeypatched so these tests run
fully offline. We also verify the safe fallback defaults (`True` /
"unclear") used when no API key is configured or the call fails.
"""
import pytest

from app.services import intent_service


@pytest.fixture(autouse=True)
def reset_client_cache(monkeypatch):
    """Each test gets a clean lazily-constructed client cache."""
    monkeypatch.setattr(intent_service, "_client", None)


def test_classify_cancellation_intent_without_api_key_defaults_true(monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    assert intent_service.classify_cancellation_intent("what's the weather?") is True


def test_classify_offer_decision_without_api_key_defaults_unclear(monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    decision = intent_service.classify_offer_decision("ok", {"type": "20% discount", "description": "..."})

    assert decision == "unclear"


class _FakeResponse:
    def __init__(self, parsed):
        self.parsed = parsed


class _FakeModels:
    def __init__(self, parsed):
        self._parsed = parsed
        self.calls = []

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return _FakeResponse(self._parsed)


class _FakeClient:
    def __init__(self, models):
        self.models = models


def test_classify_cancellation_intent_parses_gemini_response(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "fake-key")
    fake_models = _FakeModels(intent_service.CancellationIntent(is_cancellation_request=True))
    monkeypatch.setattr(intent_service, "_get_client", lambda: _FakeClient(fake_models))

    result = intent_service.classify_cancellation_intent("I'd like to close my account please")

    assert result is True
    assert "close my account" in fake_models.calls[0]["contents"]
    assert fake_models.calls[0]["config"]["response_schema"] is intent_service.CancellationIntent


def test_classify_cancellation_intent_false_for_off_topic_message(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "fake-key")
    fake_models = _FakeModels(intent_service.CancellationIntent(is_cancellation_request=False))
    monkeypatch.setattr(intent_service, "_get_client", lambda: _FakeClient(fake_models))

    assert intent_service.classify_cancellation_intent("what's the weather today?") is False


def test_classify_cancellation_intent_falls_back_to_true_on_error(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "fake-key")

    def _boom():
        raise RuntimeError("network error")

    monkeypatch.setattr(intent_service, "_get_client", _boom)

    assert intent_service.classify_cancellation_intent("cancel my plan") is True


def test_classify_offer_decision_parses_accept(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "fake-key")
    fake_models = _FakeModels(intent_service.OfferDecision(decision="accept"))
    monkeypatch.setattr(intent_service, "_get_client", lambda: _FakeClient(fake_models))

    offer = {"type": "20% discount", "description": "20% off your next bill"}
    decision = intent_service.classify_offer_decision("ok that sounds good, I'll stay", offer)

    assert decision == "accept"
    assert "20% off your next bill" in fake_models.calls[0]["contents"]


def test_classify_offer_decision_parses_decline(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "fake-key")
    fake_models = _FakeModels(intent_service.OfferDecision(decision="decline"))
    monkeypatch.setattr(intent_service, "_get_client", lambda: _FakeClient(fake_models))

    offer = {"type": "20% discount", "description": "20% off your next bill"}
    decision = intent_service.classify_offer_decision("no, still cancel it", offer)

    assert decision == "decline"


def test_classify_offer_decision_falls_back_to_unclear_on_error(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "fake-key")

    def _boom():
        raise RuntimeError("network error")

    monkeypatch.setattr(intent_service, "_get_client", _boom)

    offer = {"type": "20% discount", "description": "20% off your next bill"}
    assert intent_service.classify_offer_decision("hmm", offer) == "unclear"


def test_get_client_returns_none_without_api_key(monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    assert intent_service._get_client() is None


def test_model_name_defaults(monkeypatch):
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    assert intent_service._model_name() == "gemini-2.0-flash"

    monkeypatch.setenv("GEMINI_MODEL", "gemini-custom")
    assert intent_service._model_name() == "gemini-custom"
