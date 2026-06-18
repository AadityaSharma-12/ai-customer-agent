"""Cancellation & Retention agent - workflow orchestrator (spec Phase 7).

This implements the workflow as a deterministic state machine rather than
wrapping an LLM call. The risky business logic stays testable: verify identity,
load policy data, attempt retention, explain refund calculations, and log all
state-changing actions.
"""
from datetime import date

from app.agent import tools
from app.agent.tools import AuthenticationError
from app.services import session_store

SYSTEM_RULES = """\
You are a Customer Retention and Cancellation Agent.

You must:
- Verify identity first.
- Follow workflow strictly.
- Use only KB data.
- Never invent policies.
- Always attempt retention.
- Explain refund calculations.
- Log all actions.
"""


def _customer_summary(customer: dict) -> dict:
    """Project the fields of `CustomerSummary` out of a full customer record."""
    return {
        "name": customer["name"],
        "email": customer["email"],
        "plan": customer["plan"],
        "status": customer["status"],
        "subscription_start": customer["subscription_start"],
    }


def _is_cancellation_confirmation(message: str) -> bool:
    """Detect short replies that confirm cancellation after a follow-up question."""
    text = message.strip().lower()
    confirmation_phrases = (
        "yes",
        "yeah",
        "yep",
        "correct",
        "that's right",
        "that is right",
        "please cancel",
        "go ahead",
        "still cancel",
        "cancel it",
        "i want to cancel",
    )
    return any(phrase in text for phrase in confirmation_phrases)


def _reason_followup_message(reason: str) -> str:
    if reason == "price":
        return (
            "I'm sorry the price is getting in the way. Is pricing the main "
            "reason you're thinking about cancelling, or is there something "
            "else going wrong?"
        )
    if reason == "usage":
        return (
            "That makes sense. If you're not using it much right now, is this "
            "more about needing a break, or are you looking to cancel fully?"
        )
    if reason == "technical_issue":
        return (
            "I'm sorry the product has been frustrating. Is the technical issue "
            "the main reason you're thinking about cancelling?"
        )
    if reason == "competitor":
        return (
            "I understand. Is the other option mainly better on price, features, "
            "or are you already set on cancelling?"
        )
    return (
        "I hear you. Could you tell me what's making you consider cancelling so "
        "I can route you to the right next step?"
    )


def _retain(customer_id: str, customer: dict, offer: dict) -> dict:
    """Apply an accepted retention offer and end the workflow."""
    customer = tools.update_account(customer_id, "Active")
    audit = tools.create_audit_log(
        customer_id,
        action="retention_offer_accepted",
        details={"offer": offer["type"]},
    )
    return {
        "status": "retained",
        "message": (
            f"Great news - we've applied the {offer['type']} to your account and your "
            "subscription remains active. Thanks for staying with us!"
        ),
        "offer": offer,
        "refund": None,
        "audit_log_id": audit["audit_log_id"],
        "customer_id": customer_id,
        "customer": _customer_summary(customer),
    }


def _cancel(
    customer_id: str,
    customer: dict,
    offer: dict,
    policy: dict,
    today: date | None,
) -> dict:
    """Calculate the refund, cancel the subscription, and log it."""
    refund = tools.calculate_refund(customer, policy, today=today)
    billing_cycle_days = policy.get("refund_policy", {}).get("billing_cycle_days", 30)

    customer = tools.cancel_account(customer_id)

    audit = tools.create_audit_log(
        customer_id,
        action="account_cancelled",
        details={"refund": refund, "declined_offer": offer["type"]},
    )

    return {
        "status": "cancelled",
        "message": (
            f"Your account has been cancelled. Based on your {customer['plan']} plan and a "
            f"{billing_cycle_days}-day billing cycle, your prorated refund for the unused portion "
            f"of this cycle is Rs.{refund:.2f}. This amount will be returned to your original payment method."
        ),
        "offer": offer,
        "refund": refund,
        "audit_log_id": audit["audit_log_id"],
        "customer_id": customer_id,
        "customer": _customer_summary(customer),
    }


class CancellationAgent:
    """Orchestrates the account cancellation and retention workflow."""

    def handle_request(
        self,
        customer_id: str,
        message: str,
        accept_retention_offer: bool | None = None,
        today: date | None = None,
    ) -> dict:
        """Run the cancellation workflow for a single customer turn."""
        try:
            tools.authenticate_user(customer_id)
        except AuthenticationError:
            return {
                "status": "invalid_customer",
                "message": "We could not verify your account. Please check your customer ID and try again.",
                "offer": None,
                "refund": None,
                "audit_log_id": None,
                "customer_id": customer_id,
                "customer": None,
            }

        try:
            customer = tools.get_customer_data(customer_id)
        except tools.zoho_client.ZohoClientError:
            return {
                "status": "service_unavailable",
                "message": "We're unable to retrieve your account details right now. Please try again shortly.",
                "offer": None,
                "refund": None,
                "audit_log_id": None,
                "customer_id": customer_id,
                "customer": None,
            }

        policy = tools.load_policy()

        if accept_retention_offer is None:
            return self._handle_free_text(customer_id, customer, message, policy, today)

        session = session_store.get_session(customer_id)
        cancellation_reason = session.get("cancellation_reason") if session else None
        offer = tools.generate_retention_offer(
            customer,
            policy,
            today=today,
            cancellation_reason=cancellation_reason,
        )

        if accept_retention_offer:
            return _retain(customer_id, customer, offer)

        return _cancel(customer_id, customer, offer, policy, today)

    def _present_retention_offer(
        self,
        customer_id: str,
        customer: dict,
        message: str,
        policy: dict,
        today: date | None,
        cancellation_reason: str | None,
    ) -> dict:
        """Generate, log, save, and return the retention offer."""
        offer = tools.generate_retention_offer(
            customer,
            policy,
            today=today,
            cancellation_reason=cancellation_reason,
        )
        audit = tools.create_audit_log(
            customer_id,
            action="retention_offer_presented",
            details={
                "offer": offer["type"],
                "message": message,
                "cancellation_reason": cancellation_reason or "other",
            },
        )
        session_store.save_session(
            customer_id,
            {
                "stage": "awaiting_offer_decision",
                "offer": offer,
                "customer": customer,
                "today": today,
                "cancellation_reason": cancellation_reason or "other",
            },
        )
        reason_line = (
            f"Since you mentioned {cancellation_reason.replace('_', ' ')}, "
            if cancellation_reason and cancellation_reason != "other"
            else ""
        )
        return {
            "status": "retention_offer_presented",
            "message": (
                f"{reason_line}before we proceed, I'd like to offer you: "
                f"{offer['type']} - {offer['description']} Would you like to "
                "accept this offer and keep your subscription?"
            ),
            "offer": offer,
            "refund": None,
            "audit_log_id": audit["audit_log_id"],
            "customer_id": customer_id,
            "customer": _customer_summary(customer),
        }

    def _handle_free_text(
        self,
        customer_id: str,
        customer: dict,
        message: str,
        policy: dict,
        today: date | None,
    ) -> dict:
        """Drive the workflow from a free-text customer message."""
        session = session_store.get_session(customer_id)

        if session is None:
            cancellation_reason = tools.classify_cancellation_reason(message)
            is_cancellation_intent = tools.classify_cancellation_intent(message)

            if cancellation_reason and not is_cancellation_intent:
                session_store.save_session(
                    customer_id,
                    {
                        "stage": "exploring_cancellation_reason",
                        "cancellation_reason": cancellation_reason,
                        "customer": customer,
                        "today": today,
                    },
                )
                return {
                    "status": "concern_followup",
                    "message": _reason_followup_message(cancellation_reason),
                    "offer": None,
                    "refund": None,
                    "audit_log_id": None,
                    "customer_id": customer_id,
                    "customer": _customer_summary(customer),
                }

            if not is_cancellation_intent:
                return {
                    "status": "off_topic",
                    "message": (
                        "Hi! I'm here to help with your subscription. Tell me what's "
                        "going on, and if you want to cancel or change your plan I'll "
                        "walk you through the right next step."
                    ),
                    "offer": None,
                    "refund": None,
                    "audit_log_id": None,
                    "customer_id": customer_id,
                    "customer": _customer_summary(customer),
                }

            return self._present_retention_offer(
                customer_id,
                customer,
                message,
                policy,
                today,
                cancellation_reason,
            )

        if session.get("stage") == "exploring_cancellation_reason":
            cancellation_reason = (
                tools.classify_cancellation_reason(message)
                or session.get("cancellation_reason")
                or "other"
            )
            if tools.classify_cancellation_intent(message) or _is_cancellation_confirmation(message):
                return self._present_retention_offer(
                    customer_id,
                    customer,
                    message,
                    policy,
                    today,
                    cancellation_reason,
                )

            session_store.save_session(
                customer_id,
                {
                    **session,
                    "cancellation_reason": cancellation_reason,
                    "customer": customer,
                    "today": today,
                },
            )
            return {
                "status": "concern_followup",
                "message": _reason_followup_message(cancellation_reason),
                "offer": None,
                "refund": None,
                "audit_log_id": None,
                "customer_id": customer_id,
                "customer": _customer_summary(customer),
            }

        offer = session["offer"]
        decision = tools.classify_offer_decision(message, offer)

        if decision == "accept":
            session_store.clear_session(customer_id)
            return _retain(customer_id, customer, offer)

        if decision == "decline":
            session_store.clear_session(customer_id)
            return _cancel(customer_id, customer, offer, policy, today)

        return {
            "status": "clarification_needed",
            "message": (
                f"Sorry, I didn't quite catch that. We're offering you: {offer['type']} - "
                f"{offer['description']} Would you like to accept this offer and keep your "
                "subscription, or proceed with cancelling?"
            ),
            "offer": offer,
            "refund": None,
            "audit_log_id": None,
            "customer_id": customer_id,
            "customer": _customer_summary(customer),
        }
