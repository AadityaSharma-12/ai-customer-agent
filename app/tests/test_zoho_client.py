import pytest

from app.mcp import zoho_client


def test_get_customer_returns_known_record():
    customer = zoho_client.get_customer("123")
    assert customer["name"] == "John Doe"
    assert customer["plan"] == "Premium"


def test_get_customer_returns_none_for_unknown_id():
    assert zoho_client.get_customer("does-not-exist") is None


def test_get_subscription_raises_for_unknown_customer():
    with pytest.raises(zoho_client.ZohoClientError):
        zoho_client.get_subscription("does-not-exist")


def test_get_subscription_raises_for_sync_failure_record():
    # Customer "000" exists (auth succeeds) but its subscription data is
    # simulated as out-of-sync upstream — a realistic Zoho MCP failure mode.
    assert zoho_client.get_customer("000") is not None
    with pytest.raises(zoho_client.ZohoClientError):
        zoho_client.get_subscription("000")


def test_update_subscription_status_persists():
    updated = zoho_client.update_subscription_status("123", "Cancelled")
    assert updated["status"] == "Cancelled"
    assert zoho_client.get_customer("123")["status"] == "Cancelled"


def test_create_audit_log_assigns_incrementing_ids():
    first = zoho_client.create_audit_log({"action": "test_one"})
    second = zoho_client.create_audit_log({"action": "test_two"})
    assert second["audit_log_id"] == first["audit_log_id"] + 1
    logs = zoho_client.get_audit_logs()
    assert logs[-2:] == [first, second]
