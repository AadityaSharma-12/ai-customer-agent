from datetime import date

from fastapi.testclient import TestClient

from app.agent import tools
from app.api.main import app
from app.services import session_store

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cancel_account_endpoint_full_flow():
    # First call: present the retention offer.
    first = client.post(
        "/cancel-account",
        json={"customer_id": "123", "message": "I want to cancel my subscription."},
    )
    assert first.status_code == 200
    body = first.json()
    assert body["status"] == "retention_offer_presented"
    assert body["offer"]["type"] == "20% discount"
    assert body["customer"]["name"] == "John Doe"
    assert body["customer"]["plan"] == "Premium"

    # Second call: customer declines, workflow completes with a refund.
    second = client.post(
        "/cancel-account",
        json={
            "customer_id": "123",
            "message": "No thanks, please cancel.",
            "accept_retention_offer": False,
        },
    )
    assert second.status_code == 200
    body = second.json()
    assert body["status"] == "cancelled"
    assert isinstance(body["refund"], float)
    assert body["audit_log_id"] is not None
    assert body["customer"]["name"] == "John Doe"


def test_cancel_account_endpoint_invalid_customer():
    response = client.post(
        "/cancel-account",
        json={"customer_id": "no-such-id", "message": "Cancel my account."},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "invalid_customer"
    assert body["customer"] is None


def test_cancel_account_endpoint_validates_request_body():
    response = client.post("/cancel-account", json={"customer_id": "123"})
    assert response.status_code == 422


def test_cancel_account_endpoint_free_text_flow(monkeypatch):
    monkeypatch.setattr(tools, "classify_cancellation_intent", lambda message: True)
    monkeypatch.setattr(tools, "classify_offer_decision", lambda message, offer: "decline")

    first = client.post(
        "/cancel-account",
        json={"customer_id": "123", "message": "I'd like to close my account please"},
    )
    assert first.status_code == 200
    assert first.json()["status"] == "retention_offer_presented"

    second = client.post(
        "/cancel-account",
        json={"customer_id": "123", "message": "no, still cancel it"},
    )
    assert second.status_code == 200
    body = second.json()
    assert body["status"] == "cancelled"
    assert isinstance(body["refund"], float)


def test_reset_session_endpoint_clears_pending_session(monkeypatch):
    monkeypatch.setattr(tools, "classify_cancellation_intent", lambda message: True)

    client.post(
        "/cancel-account",
        json={"customer_id": "123", "message": "I'd like to close my account please"},
    )
    assert session_store.get_session("123") is not None

    response = client.delete("/session/123")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert session_store.get_session("123") is None
