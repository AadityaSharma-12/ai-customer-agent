from datetime import date

from app.kb import load_cancellation_policy
from app.services.retention_service import generate_retention_offer

POLICY = load_cancellation_policy()


def test_premium_customer_gets_discount_offer():
    customer = {"plan": "Premium", "subscription_start": "2025-01-01"}
    offer = generate_retention_offer(customer, POLICY, today=date(2026, 1, 1))
    assert offer["type"] == "20% discount"


def test_enterprise_customer_gets_account_review_offer():
    customer = {"plan": "Enterprise", "subscription_start": "2025-01-01"}
    offer = generate_retention_offer(customer, POLICY, today=date(2026, 1, 1))
    assert offer["type"] == "Account review"


def test_new_user_gets_free_month_offer_regardless_of_plan():
    customer = {"plan": "Enterprise", "subscription_start": "2026-01-01"}
    offer = generate_retention_offer(customer, POLICY, today=date(2026, 1, 10))
    assert offer["type"] == "Free month"


def test_an_offer_is_always_returned():
    # Retention must always be attempted, even for plans with no dedicated rule.
    customer = {"plan": "Free", "subscription_start": "2020-01-01"}
    offer = generate_retention_offer(customer, POLICY, today=date(2026, 1, 1))
    assert offer is not None
    assert offer["type"]
