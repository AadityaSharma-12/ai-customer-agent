from datetime import date

from fastapi.testclient import TestClient

from app.api.main import app

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
