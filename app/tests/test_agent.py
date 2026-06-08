"""Workflow tests for CancellationAgent — covers the 7 cases required by the spec:

1. Successful cancellation   -> test_full_cancellation_flow_after_offer_declined
2. Retention accepted        -> test_retention_offer_accepted_keeps_account_active
3. Retention rejected        -> test_retention_offer_declined_proceeds_to_cancellation
4. Invalid customer          -> test_invalid_customer_returns_error_without_touching_account
5. Zero refund               -> test_zero_refund_for_free_plan_customer
6. Maximum refund            -> test_maximum_refund_for_customer_on_first_day_of_cycle
7. Zoho MCP failure          -> test_zoho_mcp_failure_returns_service_unavailable
"""
from datetime import date

from app.agent.agent import CancellationAgent
from app.mcp import zoho_client

TODAY = date(2026, 6, 8)


def _agent():
    return CancellationAgent()


def test_first_turn_presents_retention_offer_and_does_not_cancel():
    response = _agent().handle_request("123", "I want to cancel my subscription.", today=TODAY)

    assert response["status"] == "retention_offer_presented"
    assert response["offer"]["type"] == "20% discount"
    assert response["refund"] is None
    assert zoho_client.get_customer("123")["status"] == "Active"


def test_retention_offer_accepted_keeps_account_active():
    agent = _agent()
    agent.handle_request("123", "I want to cancel.", today=TODAY)

    response = agent.handle_request("123", "Actually, tell me more.", accept_retention_offer=True, today=TODAY)

    assert response["status"] == "retained"
    assert response["refund"] is None
    assert zoho_client.get_customer("123")["status"] == "Active"
    logs = zoho_client.get_audit_logs()
    assert any(log["action"] == "retention_offer_accepted" for log in logs)


def test_retention_offer_declined_proceeds_to_cancellation():
    agent = _agent()
    agent.handle_request("123", "I want to cancel.", today=TODAY)

    response = agent.handle_request("123", "No thanks, cancel it.", accept_retention_offer=False, today=TODAY)

    assert response["status"] == "cancelled"
    assert response["refund"] is not None
    assert zoho_client.get_customer("123")["status"] == "Cancelled"
    logs = zoho_client.get_audit_logs()
    assert any(log["action"] == "account_cancelled" for log in logs)


def test_full_cancellation_flow_after_offer_declined():
    """End-to-end demo flow from spec Phase 15: offer -> decline -> refund -> cancel -> audit -> response."""
    agent = _agent()
    # Mirrors the spec's worked example exactly: customer "123" subscribed to
    # Premium (₹1000/mo) on 2026-01-01. By 2026-02-10 they're 40 days in —
    # 10 days into their second billing cycle — leaving 20 unused days of the
    # 30-day cycle -> refund = 1000 * 20 / 30 = ₹666.67. They're also well
    # past the 30-day "new user" window, so they get the Premium 20% discount offer.
    demo_today = date(2026, 2, 10)

    presented = agent.handle_request("123", "I want to cancel my subscription.", today=demo_today)
    assert presented["status"] == "retention_offer_presented"
    assert presented["offer"]["type"] == "20% discount"

    final = agent.handle_request("123", "No, please cancel.", accept_retention_offer=False, today=demo_today)

    assert final["status"] == "cancelled"
    assert final["refund"] == 666.67  # 10 days used of a 30-day, ₹1000 cycle starting 2026-01-01
    assert final["audit_log_id"] is not None
    assert "cancelled" in final["message"].lower()
    assert zoho_client.get_customer("123")["status"] == "Cancelled"


def test_invalid_customer_returns_error_without_touching_account():
    response = _agent().handle_request("does-not-exist", "Cancel my account.", today=TODAY)

    assert response["status"] == "invalid_customer"
    assert response["offer"] is None
    assert response["refund"] is None
    assert zoho_client.get_audit_logs() == []


def test_zero_refund_for_free_plan_customer():
    agent = _agent()
    agent.handle_request("321", "Cancel please.", today=TODAY)

    response = agent.handle_request("321", "Yes, cancel.", accept_retention_offer=False, today=TODAY)

    assert response["status"] == "cancelled"
    assert response["refund"] == 0.0


def test_maximum_refund_for_customer_on_first_day_of_cycle():
    # Customer "789" has a subscription_start of "today" (set dynamically in the mock data),
    # so cancelling immediately yields the maximum possible prorated refund: the full monthly fee.
    today = date.today()
    agent = _agent()
    agent.handle_request("789", "Cancel please.", today=today)

    response = agent.handle_request("789", "Yes, cancel.", accept_retention_offer=False, today=today)

    assert response["status"] == "cancelled"
    assert response["refund"] == 1000.0


def test_zoho_mcp_failure_returns_service_unavailable():
    # Customer "000" authenticates successfully but its subscription record
    # is simulated as out-of-sync upstream in Zoho — a genuine MCP failure,
    # distinct from "invalid customer".
    response = _agent().handle_request("000", "Cancel my account.", today=TODAY)

    assert response["status"] == "service_unavailable"
    assert response["offer"] is None
    assert zoho_client.get_customer("000")["status"] == "Active"
