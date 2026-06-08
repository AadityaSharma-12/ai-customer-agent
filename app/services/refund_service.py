"""Prorated refund calculation."""
from datetime import date, datetime


def calculate_refund(
    monthly_fee: float,
    subscription_start: str,
    total_days: int = 30,
    today: date | None = None,
) -> float:
    """Calculate a prorated refund for the unused portion of the billing cycle.

    refund = monthly_fee * unused_days / total_days

    `unused_days` is derived from how many days into the current `total_days`
    cycle the customer is (days_used = days since subscription_start, modulo
    the cycle length). The result is rounded to 2 decimals and clamped to the
    range [0, monthly_fee].

    `today` may be injected for deterministic testing; defaults to date.today().
    """
    if today is None:
        today = date.today()

    start = datetime.strptime(subscription_start, "%Y-%m-%d").date()
    days_elapsed = (today - start).days
    if days_elapsed < 0:
        days_elapsed = 0

    days_used = days_elapsed % total_days
    unused_days = total_days - days_used

    refund = monthly_fee * unused_days / total_days
    refund = max(0.0, min(refund, monthly_fee))
    return round(refund, 2)
