"""Retention offer generation.

The agent MUST attempt retention before any cancellation proceeds, so this
module always returns an offer — selecting the most relevant one for the
customer based on the cancellation_policy knowledge base.

Eligibility, in priority order:
  1. New users (<30 days since subscription_start) -> free month
  2. Enterprise plan                                -> account review
  3. Technical issue                                -> support escalation
  4. Low usage                                      -> pause plan
  5. Competitor concern                             -> competitive review
  6. Price/Premium plan                             -> 20% discount
  7. Anything else (e.g. Free plan)                 -> generic retention offer
"""
from datetime import date, datetime

NEW_USER_THRESHOLD_DAYS = 30

_OFFERS_BY_ELIGIBILITY = {
    "New users (<30 days)": "Free month",
    "Enterprise": "Account review",
    "Premium": "20% discount",
    "Usage concern": "Pause plan",
    "Technical issue": "Priority support escalation",
    "Competitor concern": "Competitive review",
}


def _offer_from_policy(policy: dict, eligibility: str, reason: str) -> dict:
    for offer in policy.get("retention_offers", []):
        if offer.get("eligibility") == eligibility:
            return {
                "type": offer["offer"],
                "description": offer.get("description", ""),
                "eligibility_reason": reason,
            }
    # Should not happen with a well-formed KB, but keep the contract safe.
    return {"type": _OFFERS_BY_ELIGIBILITY.get(eligibility, "Retention offer"), "description": "", "eligibility_reason": reason}


def generate_retention_offer(
    customer: dict,
    policy: dict,
    today: date | None = None,
    cancellation_reason: str | None = None,
) -> dict:
    """Return a retention offer dict for the given customer.

    Always returns an offer (never None) because retention must always be
    attempted, including for customers on plans without a dedicated rule.
    """
    if today is None:
        today = date.today()

    start = datetime.strptime(customer["subscription_start"], "%Y-%m-%d").date()
    account_age_days = (today - start).days

    if account_age_days < NEW_USER_THRESHOLD_DAYS:
        return _offer_from_policy(
            policy,
            "New users (<30 days)",
            f"Account is {account_age_days} day(s) old (< {NEW_USER_THRESHOLD_DAYS} days).",
        )

    plan = customer.get("plan")
    if plan == "Enterprise":
        return _offer_from_policy(policy, "Enterprise", "Customer is on the Enterprise plan.")

    if cancellation_reason == "technical_issue":
        return _offer_from_policy(
            policy,
            "Technical issue",
            "Customer mentioned a technical issue before confirming cancellation.",
        )

    if cancellation_reason == "usage":
        return _offer_from_policy(
            policy,
            "Usage concern",
            "Customer said they are not using the product enough right now.",
        )

    if cancellation_reason == "competitor":
        return _offer_from_policy(
            policy,
            "Competitor concern",
            "Customer is considering another product or service.",
        )

    if cancellation_reason == "price":
        return _offer_from_policy(
            policy,
            "Premium",
            "Customer mentioned price or budget concerns.",
        )

    if plan == "Premium":
        return _offer_from_policy(policy, "Premium", "Customer is on the Premium plan.")

    return {
        "type": "Loyalty offer",
        "description": "We'd hate to see you go — let us know how we can improve your experience.",
        "eligibility_reason": f"No tier-specific offer applies to the '{plan}' plan; presenting a generic retention offer.",
    }
