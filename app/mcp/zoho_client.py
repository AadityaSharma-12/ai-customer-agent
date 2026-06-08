"""Mock Zoho MCP client.

Simulates the read/write surface of a Zoho MCP server with an in-memory
datastore so the agent can be developed and tested without real Zoho
credentials. Swapping this module for a real MCP-backed client later
should not require changes to any calling code, since the function
signatures and return shapes mirror what a live integration would expose.
"""
from copy import deepcopy
from datetime import date


class ZohoClientError(Exception):
    """Raised when the (simulated) Zoho MCP server cannot fulfil a request."""


_CUSTOMERS: dict[str, dict] = {
    "123": {
        "customer_id": "123",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "plan": "Premium",
        "status": "Active",
        "subscription_start": "2026-01-01",
    },
    "456": {
        "customer_id": "456",
        "name": "Acme Corp",
        "email": "ops@acmecorp.example.com",
        "plan": "Enterprise",
        "status": "Active",
        "subscription_start": "2025-09-15",
    },
    "789": {
        "customer_id": "789",
        "name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "plan": "Premium",
        "status": "Active",
        "subscription_start": str(date.today()),
    },
    "321": {
        "customer_id": "321",
        "name": "Sam Lee",
        "email": "sam.lee@example.com",
        "plan": "Free",
        "status": "Active",
        "subscription_start": "2025-01-01",
    },
    "000": {
        "customer_id": "000",
        "name": "Test Corp",
        "email": "sync-issue@example.com",
        "plan": "Premium",
        "status": "Active",
        "subscription_start": "2026-02-01",
    },
}

# Simulates a customer record that exists (authentication succeeds) but whose
# subscription data is out of sync on the Zoho side — a realistic upstream MCP
# failure mode that is distinct from "customer not found".
_SUBSCRIPTION_SYNC_FAILURES = {"000"}

_AUDIT_LOGS: list[dict] = []
_audit_log_seq = 0


def get_customer(customer_id: str) -> dict | None:
    """Return a copy of the customer record, or None if not found."""
    customer = _CUSTOMERS.get(customer_id)
    return deepcopy(customer) if customer is not None else None


def get_subscription(customer_id: str) -> dict:
    """Return subscription details for a customer.

    Raises ZohoClientError if the customer does not exist, simulating an
    upstream Zoho MCP failure for an unknown record.
    """
    customer = _CUSTOMERS.get(customer_id)
    if customer is None:
        raise ZohoClientError(f"Zoho MCP: no subscription found for customer_id={customer_id!r}")

    if customer_id in _SUBSCRIPTION_SYNC_FAILURES:
        raise ZohoClientError(f"Zoho MCP: subscription record for customer_id={customer_id!r} is out of sync (upstream error)")

    return {
        "customer_id": customer["customer_id"],
        "plan": customer["plan"],
        "status": customer["status"],
        "subscription_start": customer["subscription_start"],
    }


def update_subscription_status(customer_id: str, status: str) -> dict:
    """Update a customer's subscription status and return the updated record."""
    customer = _CUSTOMERS.get(customer_id)
    if customer is None:
        raise ZohoClientError(f"Zoho MCP: cannot update unknown customer_id={customer_id!r}")

    customer["status"] = status
    return deepcopy(customer)


def create_audit_log(entry: dict) -> dict:
    """Append an audit log entry and return the stored record (with an id)."""
    global _audit_log_seq
    _audit_log_seq += 1
    record = {"audit_log_id": _audit_log_seq, **entry}
    _AUDIT_LOGS.append(record)
    return deepcopy(record)


def get_audit_logs() -> list[dict]:
    """Return all stored audit log entries (for inspection/testing)."""
    return deepcopy(_AUDIT_LOGS)
