"""Pydantic request/response models for the cancellation API."""
from pydantic import BaseModel, Field


class CancelAccountRequest(BaseModel):
    customer_id: str = Field(..., description="The customer's unique identifier.")
    message: str = Field(..., description="The customer's free-text request, e.g. 'I want to cancel my subscription.'")
    accept_retention_offer: bool | None = Field(
        default=None,
        description=(
            "Optional explicit override: true to accept a previously-presented "
            "retention offer and stay subscribed, false to proceed with "
            "cancellation. Normally omitted (or null) — in that case the "
            "customer's free-text `message` is classified by the agent to "
            "decide the next step (see CancelAccountResponse.status)."
        ),
    )


class RetentionOffer(BaseModel):
    type: str
    description: str
    eligibility_reason: str


class CustomerSummary(BaseModel):
    name: str
    email: str
    plan: str
    status: str
    subscription_start: str


class CancelAccountResponse(BaseModel):
    #: One of: "invalid_customer", "service_unavailable", "off_topic",
    #: "retention_offer_presented", "clarification_needed", "retained",
    #: "cancelled".
    status: str
    message: str
    offer: RetentionOffer | None = None
    refund: float | None = None
    audit_log_id: int | None = None
    customer_id: str
    customer: CustomerSummary | None = None
