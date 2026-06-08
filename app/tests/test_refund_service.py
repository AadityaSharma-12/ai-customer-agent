from datetime import date

import pytest

from app.services.refund_service import calculate_refund


def test_prorated_refund_matches_spec_example():
    # Spec example: ₹1000 monthly plan, 10 days used, 20 days remaining -> ₹666.67
    refund = calculate_refund(
        monthly_fee=1000,
        subscription_start="2026-01-01",
        total_days=30,
        today=date(2026, 1, 11),  # 10 days elapsed
    )
    assert refund == 666.67


def test_maximum_refund_on_first_day_of_cycle():
    # Cancelling on the same day the cycle starts -> the full monthly fee is refunded.
    refund = calculate_refund(
        monthly_fee=1000,
        subscription_start="2026-03-01",
        total_days=30,
        today=date(2026, 3, 1),
    )
    assert refund == 1000.0


def test_zero_refund_for_zero_fee_plan():
    # A Free-tier plan has no monthly fee, so the refund is always zero.
    refund = calculate_refund(
        monthly_fee=0,
        subscription_start="2025-01-01",
        total_days=30,
        today=date(2026, 6, 1),
    )
    assert refund == 0.0


def test_refund_never_exceeds_monthly_fee_or_drops_below_zero():
    refund = calculate_refund(
        monthly_fee=1000,
        subscription_start="2026-01-01",
        total_days=30,
        today=date(2026, 1, 1),
    )
    assert 0.0 <= refund <= 1000.0
