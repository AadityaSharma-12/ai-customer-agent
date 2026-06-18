"""Tool functions used by the cancellation agent (spec Phase 8).

Each tool is a small, typed wrapper around the MCP client / business-rule
services, returning plain dicts the agent can compose into a response.
Keeping them as plain functions (rather than a framework's tool-decorator)
avoids a hard dependency on any particular agent framework while preserving
the same "tools layer" separation the architecture calls for.
"""
from datetime import date

from app.kb import load_cancellation_policy
from app.mcp import zoho_client
from app.services import intent_service
from app.services.refund_service import calculate_refund as _calculate_refund
from app.services.retention_service import generate_retention_offer as _generate_retention_offer


class AuthenticationError(Exception):
    """Raised when a customer cannot be authenticated."""


def authenticate_user(customer_id: str) -> dict:
    """Verify the customer exists before any account data is touched.

    This is a simplified stand-in for a real identity check (e.g. OTP,
    session token validation) — it confirms the customer record exists in
    Zoho before the agent proceeds, satisfying the "verify identity first"
    system rule.
    """
    customer = zoho_client.get_customer(customer_id)
    if customer is None:
        raise AuthenticationError(f"No customer found for customer_id={customer_id!r}")
    return {"authenticated": True, "customer_id": customer_id}


def get_customer_data(customer_id: str) -> dict:
    """Fetch the customer profile and subscription details from Zoho MCP."""
    customer = zoho_client.get_customer(customer_id)
    if customer is None:
        raise AuthenticationError(f"No customer found for customer_id={customer_id!r}")
    subscription = zoho_client.get_subscription(customer_id)
    return {**customer, "subscription": subscription}


def load_policy() -> dict:
    """Load the cancellation & retention policy knowledge base."""
    return load_cancellation_policy()


def generate_retention_offer(
    customer: dict,
    policy: dict,
    today: date | None = None,
    cancellation_reason: str | None = None,
) -> dict:
    """Determine and build the retention offer to present to the customer."""
    return _generate_retention_offer(
        customer,
        policy,
        today=today,
        cancellation_reason=cancellation_reason,
    )


def calculate_refund(customer: dict, policy: dict, today: date | None = None) -> float:
    """Calculate the prorated refund owed to the customer upon cancellation."""
    plan_name = customer.get("plan")
    plan = next((p for p in policy.get("subscription_plans", []) if p["plan"] == plan_name), None)
    monthly_fee = plan["monthly_fee"] if plan else 0
    total_days = policy.get("refund_policy", {}).get("billing_cycle_days", 30)
    return _calculate_refund(monthly_fee, customer["subscription_start"], total_days=total_days, today=today)


def cancel_account(customer_id: str) -> dict:
    """Update the subscription status to Cancelled in Zoho MCP."""
    return zoho_client.update_subscription_status(customer_id, "Cancelled")


def update_account(customer_id: str, status: str) -> dict:
    """Update the subscription status (used when a retention offer is accepted)."""
    return zoho_client.update_subscription_status(customer_id, status)


def classify_cancellation_intent(message: str) -> bool:
    """Determine whether a free-text message is a cancellation request."""
    return intent_service.classify_cancellation_intent(message)


def classify_cancellation_reason(message: str) -> str | None:
    """Detect the customer's reason for considering cancellation."""
    return intent_service.classify_cancellation_reason(message)


def classify_offer_decision(message: str, offer: dict) -> str:
    """Classify a free-text reply to a retention offer as accept/decline/unclear."""
    return intent_service.classify_offer_decision(message, offer)


def create_audit_log(customer_id: str, action: str, details: dict) -> dict:
    """Persist an audit log entry recording an action taken on the account."""
    entry = {
        "customer_id": customer_id,
        "action": action,
        "details": details,
        "timestamp": date.today().isoformat(),
    }
    return zoho_client.create_audit_log(entry)
