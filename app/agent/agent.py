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
                - None  -> first turn: authenticate, fetch profile, and present
                           the retention offer without cancelling anything yet.
                - True  -> the customer accepted the offer: keep the account
                           active, log the decision, end the workflow.
                - False -> the customer declined: calculate the refund, cancel
                           the subscription, and log the cancellation.
            today: optional injectable "current date" for deterministic tests.

        Returns:
            A structured response dict: status, message, offer, refund,
            audit_log_id, customer_id.
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
            }

        # Step 3: Load cancellation policy (knowledge base — the only source of policy data)
        policy = tools.load_policy()

        # Step 4 + 5: Determine retention eligibility and build the offer.
        # Retention MUST always be attempted before a cancellation proceeds.
        offer = tools.generate_retention_offer(customer, policy, today=today)

        if accept_retention_offer is None:
            # First turn: present the offer and pause for the customer's decision.
            audit = tools.create_audit_log(
                customer_id,
                action="retention_offer_presented",
                details={"offer": offer["type"], "message": message},
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
            }

        if accept_retention_offer:
            # Step 6: Offer accepted — update the account, end the workflow.
            tools.update_account(customer_id, "Active")
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
            }

        # Step 7: Offer rejected — calculate the prorated refund.
        refund = tools.calculate_refund(customer, policy, today=today)
        billing_cycle_days = policy.get("refund_policy", {}).get("billing_cycle_days", 30)

        # Step 8: Cancel the subscription (Zoho MCP write).
        tools.cancel_account(customer_id)

        # Step 9: Create the audit log entry for the cancellation.
        audit = tools.create_audit_log(
            customer_id,
            action="account_cancelled",
            details={"refund": refund, "declined_offer": offer["type"]},
        )

        # Step 10: Return the final customer-facing response, explaining the refund.
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
        }
