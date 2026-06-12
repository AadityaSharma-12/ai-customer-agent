"""Pydantic request/response models for the cancellation API."""
from pydantic import BaseModel, Field


class CancelAccountRequest(BaseModel):
    customer_id: str = Field(..., description="The customer's unique identifier.")
    message: str = Field(..., description="The customer's free-text request, e.g. 'I want to cancel my subscription.'")
    accept_retention_offer: bool | None = Field(
        default=None,
        description=(
            "Set on a follow-up call once a retention offer has been presented: "
            "true to accept and stay subscribed, false to proceed with cancellation. "
            "Omit (or null) on the first call to receive the retention offer."
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
    status: str
    message: str
    offer: RetentionOffer | None = None
    refund: float | None = None
    audit_log_id: int | None = None
    customer_id: str
    customer: CustomerSummary | None = None
