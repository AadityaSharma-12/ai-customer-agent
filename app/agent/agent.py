"""Cancellation & Retention agent — workflow orchestrator (spec Phase 7).

This implements the 10-step workflow as a deterministic state machine rather
than wrapping an LLM call. The "system rules" from spec Phase 9 are encoded
here as the rules the workflow *follows* (verify identity first, always
attempt retention, use only KB data, explain refund calculations, log every
action) — there is no hidden prompt being sent anywhere; the contract those
rules describe **is** the code below, which keeps the workflow deterministic,
testable, and free of any framework/API dependency while still satisfying
every behavioural requirement in the spec.

SYSTEM_RULES is kept as a literal artifact of that prompt-engineering phase —
useful for documentation, demos, or as the system prompt if this orchestrator
is ever fronted by an LLM — but it is not sent anywhere by this code.
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


def _retain(customer_id: str, customer: dict, offer: dict) -> dict:
    """Apply an accepted retention offer and end the workflow (step 6)."""
    customer = tools.update_account(customer_id, "Active")
    audit = tools.create_audit_log(
        customer_id,
        action="retention_offer_accepted",
        details={"offer": offer["type"]},
    )
    return {
        "status": "retained",
        "message": (
            f"Great news — we've applied the {offer['type']} to your account and your "
            "subscription remains active. Thanks for staying with us!"
        ),
        "offer": offer,
        "refund": None,
        "audit_log_id": audit["audit_log_id"],
        "customer_id": customer_id,
        "customer": _customer_summary(customer),
    }


def _cancel(customer_id: str, customer: dict, offer: dict, policy: dict, today: date | None) -> dict:
    """Calculate the refund, cancel the subscription, and log it (steps 7-10)."""
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
            f"of this cycle is ₹{refund:.2f}. This amount will be returned to your original payment method."
        ),
        "offer": offer,
        "refund": refund,
        "audit_log_id": audit["audit_log_id"],
        "customer_id": customer_id,
        "customer": _customer_summary(customer),
    }


class CancellationAgent:
    """Orchestrates the account cancellation & retention workflow."""

    def handle_request(
        self,
        customer_id: str,
        message: str,
        accept_retention_offer: bool | None = None,
        today: date | None = None,
    ) -> dict:
        """Run the cancellation workflow for a single customer turn.

        Args:
            customer_id: the customer's identifier.
            message: the customer's free-text request (e.g. "I want to cancel my subscription.").
            accept_retention_offer:
                - None  -> free-text turn: the customer's `message` is classified
                           by the LLM to decide whether to present a retention
                           offer, apply a previously-presented offer, or ask for
                           clarification. Possible statuses: "off_topic",
                           "retention_offer_presented", "clarification_needed",
                           "retained", "cancelled".
                - True  -> the customer accepted the offer: keep the account
                           active, log the decision, end the workflow.
                - False -> the customer declined: calculate the refund, cancel
                           the subscription, and log the cancellation.
            today: optional injectable "current date" for deterministic tests.

        Returns:
            A structured response dict: status, message, offer, refund,
            audit_log_id, customer_id, customer.
        """
        # Step 1: Authenticate customer
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

        # Step 2: Fetch customer profile (Zoho MCP read)
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

        # Step 3: Load cancellation policy (knowledge base — the only source of policy data)
        policy = tools.load_policy()

        if accept_retention_offer is None:
            return self._handle_free_text(customer_id, customer, message, policy, today)

        # Step 4 + 5: Determine retention eligibility and build the offer.
        # Retention MUST always be attempted before a cancellation proceeds.
        offer = tools.generate_retention_offer(customer, policy, today=today)

        if accept_retention_offer:
            # Step 6: Offer accepted — update the account, end the workflow.
            return _retain(customer_id, customer, offer)

        # Steps 7-10: Offer rejected — calculate the refund, cancel, log, respond.
        return _cancel(customer_id, customer, offer, policy, today)

    def _handle_free_text(
        self,
        customer_id: str,
        customer: dict,
        message: str,
        policy: dict,
        today: date | None,
    ) -> dict:
        """Drive the workflow from a free-text customer message.

        Uses the LLM only to classify the message (cancellation intent, or
        accept/decline/unclear in reply to a previously-presented offer) — the
        resulting branch reuses the same deterministic offer/refund/audit logic
        as the explicit-flag path.
        """
        session = session_store.get_session(customer_id)

        if session is None:
            if not tools.classify_cancellation_intent(message):
                return {
                    "status": "off_topic",
                    "message": (
                        "I'm the cancellation & retention assistant, so I can help with "
                        "cancelling or managing your subscription. Would you like to "
                        "cancel your subscription?"
                    ),
                    "offer": None,
                    "refund": None,
                    "audit_log_id": None,
                    "customer_id": customer_id,
                    "customer": _customer_summary(customer),
                }

            # Steps 4 + 5: Determine retention eligibility and build the offer.
            offer = tools.generate_retention_offer(customer, policy, today=today)
            audit = tools.create_audit_log(
                customer_id,
                action="retention_offer_presented",
                details={"offer": offer["type"], "message": message},
            )
            session_store.save_session(
                customer_id, {"offer": offer, "customer": customer, "today": today}
            )
            return {
                "status": "retention_offer_presented",
                "message": (
                    f"Before we proceed, we'd like to offer you: {offer['type']} — {offer['description']} "
                    "Would you like to accept this offer and keep your subscription?"
                ),
                "offer": offer,
                "refund": None,
                "audit_log_id": audit["audit_log_id"],
                "customer_id": customer_id,
                "customer": _customer_summary(customer),
            }

        # A retention offer is awaiting the customer's decision.
        offer = session["offer"]
        decision = tools.classify_offer_decision(message, offer)

        if decision == "accept":
            session_store.clear_session(customer_id)
            return _retain(customer_id, customer, offer)

        if decision == "decline":
            session_store.clear_session(customer_id)
            return _cancel(customer_id, customer, offer, policy, today)

        # "unclear" — keep the session and ask the customer to confirm.
        return {
            "status": "clarification_needed",
            "message": (
                f"Sorry, I didn't quite catch that. We're offering you: {offer['type']} — "
                f"{offer['description']} Would you like to accept this offer and keep your "
                "subscription, or proceed with cancelling?"
            ),
            "offer": offer,
            "refund": None,
            "audit_log_id": None,
            "customer_id": customer_id,
            "customer": _customer_summary(customer),
        }
