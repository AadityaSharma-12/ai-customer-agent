"""Tests for the free-text (accept_retention_offer=None) conversational flow.

`app.agent.tools.classify_cancellation_intent` / `classify_offer_decision` are
monkeypatched to deterministic stubs so these tests never call Gemini. All
refund/retention/audit logic is exercised exactly as in the explicit-flag
tests in test_agent.py.
"""
from datetime import date

from app.agent import tools
from app.agent.agent import CancellationAgent
from app.mcp import zoho_client
from app.services import session_store

TODAY = date(2026, 6, 8)


def _agent():
    return CancellationAgent()


def test_free_text_cancellation_request_presents_offer_and_saves_session(monkeypatch):
    monkeypatch.setattr(tools, "classify_cancellation_intent", lambda message: True)

    response = _agent().handle_request("123", "I'd like to close my account please", today=TODAY)

    assert response["status"] == "retention_offer_presented"
    assert response["offer"]["type"] == "20% discount"
    assert session_store.get_session("123") is not None
    logs = zoho_client.get_audit_logs()
    assert any(log["action"] == "retention_offer_presented" for log in logs)


def test_free_text_decline_after_offer_cancels_and_clears_session(monkeypatch):
    monkeypatch.setattr(tools, "classify_cancellation_intent", lambda message: True)
    monkeypatch.setattr(tools, "classify_offer_decision", lambda message, offer: "decline")

    agent = _agent()
    agent.handle_request("123", "I want to cancel my subscription", today=TODAY)

    response = agent.handle_request("123", "no thanks, go ahead and cancel it", today=TODAY)

    assert response["status"] == "cancelled"
    assert response["refund"] is not None
    assert response["customer"]["status"] == "Cancelled"
    assert session_store.get_session("123") is None


def test_free_text_accept_after_offer_retains_and_clears_session(monkeypatch):
    monkeypatch.setattr(tools, "classify_cancellation_intent", lambda message: True)
    monkeypatch.setattr(tools, "classify_offer_decision", lambda message, offer: "accept")

    agent = _agent()
    agent.handle_request("123", "I want to cancel my subscription", today=TODAY)

    response = agent.handle_request("123", "actually that discount sounds good, I'll stay", today=TODAY)

    assert response["status"] == "retained"
    assert response["customer"]["status"] == "Active"
    assert session_store.get_session("123") is None


def test_off_topic_message_does_not_present_offer_or_log(monkeypatch):
    monkeypatch.setattr(tools, "classify_cancellation_intent", lambda message: False)

    response = _agent().handle_request("123", "what's the weather today?", today=TODAY)

    assert response["status"] == "off_topic"
    assert response["offer"] is None
    assert response["refund"] is None
    assert response["audit_log_id"] is None
    assert session_store.get_session("123") is None
    assert zoho_client.get_audit_logs() == []


def test_greeting_starts_conversation_without_retention_offer():
    response = _agent().handle_request("123", "hi", today=TODAY)

    assert response["status"] == "off_topic"
    assert "Tell me what's going on" in response["message"]
    assert response["offer"] is None
    assert response["audit_log_id"] is None
    assert session_store.get_session("123") is None
    assert zoho_client.get_audit_logs() == []


def test_price_concern_asks_followup_before_presenting_offer():
    agent = _agent()

    first = agent.handle_request("123", "I'm unhappy with the price", today=TODAY)

    assert first["status"] == "concern_followup"
    assert "pricing" in first["message"].lower()
    assert first["offer"] is None
    assert session_store.get_session("123")["cancellation_reason"] == "price"
    assert zoho_client.get_audit_logs() == []

    second = agent.handle_request("123", "yes, I want to cancel", today=TODAY)

    assert second["status"] == "retention_offer_presented"
    assert second["offer"]["type"] == "20% discount"
    assert "price" in second["offer"]["eligibility_reason"].lower()
    logs = zoho_client.get_audit_logs()
    assert logs[-1]["details"]["cancellation_reason"] == "price"


def test_usage_concern_gets_pause_offer_after_confirmation():
    agent = _agent()

    first = agent.handle_request("123", "I don't use this anymore", today=TODAY)
    assert first["status"] == "concern_followup"

    second = agent.handle_request("123", "go ahead, cancel it", today=TODAY)

    assert second["status"] == "retention_offer_presented"
    assert second["offer"]["type"] == "Pause plan"


def test_technical_concern_gets_support_escalation_after_confirmation():
    agent = _agent()

    first = agent.handle_request("123", "The product is too slow", today=TODAY)
    assert first["status"] == "concern_followup"

    second = agent.handle_request("123", "yes, cancel my plan", today=TODAY)

    assert second["status"] == "retention_offer_presented"
    assert second["offer"]["type"] == "Priority support escalation"


def test_competitor_concern_gets_competitive_review_after_confirmation():
    agent = _agent()

    first = agent.handle_request("123", "I found a cheaper alternative", today=TODAY)
    assert first["status"] == "concern_followup"

    second = agent.handle_request("123", "I still want to cancel", today=TODAY)

    assert second["status"] == "retention_offer_presented"
    assert second["offer"]["type"] == "Competitive review"


def test_ambiguous_decision_asks_for_clarification_then_resolves(monkeypatch):
    monkeypatch.setattr(tools, "classify_cancellation_intent", lambda message: True)

    agent = _agent()
    agent.handle_request("123", "I want to cancel my subscription", today=TODAY)

    monkeypatch.setattr(tools, "classify_offer_decision", lambda message, offer: "unclear")
    clarify = agent.handle_request("123", "hmm, maybe", today=TODAY)

    assert clarify["status"] == "clarification_needed"
    assert clarify["offer"]["type"] == "20% discount"
    assert session_store.get_session("123") is not None

    monkeypatch.setattr(tools, "classify_offer_decision", lambda message, offer: "decline")
    final = agent.handle_request("123", "no, cancel it", today=TODAY)

    assert final["status"] == "cancelled"
    assert session_store.get_session("123") is None


def test_invalid_customer_short_circuits_before_classification(monkeypatch):
    def _boom(message):
        raise AssertionError("classifier should not be called for an invalid customer")

    monkeypatch.setattr(tools, "classify_cancellation_intent", _boom)

    response = _agent().handle_request("does-not-exist", "cancel my account", today=TODAY)

    assert response["status"] == "invalid_customer"


def test_zoho_failure_short_circuits_before_classification(monkeypatch):
    def _boom(message):
        raise AssertionError("classifier should not be called when Zoho MCP is down")

    monkeypatch.setattr(tools, "classify_cancellation_intent", _boom)

    response = _agent().handle_request("000", "cancel my account", today=TODAY)

    assert response["status"] == "service_unavailable"
