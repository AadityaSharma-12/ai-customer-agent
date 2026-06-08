"""FastAPI application exposing the cancellation & retention agent."""
from fastapi import FastAPI

from app.agent.agent import CancellationAgent
from app.models.schemas import CancelAccountRequest, CancelAccountResponse

app = FastAPI(
    title="AI Customer Service Agent — Account Cancellation",
    description="Handles subscription cancellation and retention workflows.",
    version="1.0.0",
)

_agent = CancellationAgent()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/cancel-account", response_model=CancelAccountResponse)
def cancel_account(request: CancelAccountRequest) -> dict:
    """Run the cancellation & retention workflow for a customer request.

    Call once with `accept_retention_offer` omitted to receive a retention
    offer; call again with `accept_retention_offer` set to `true` or `false`
    to complete the workflow.
    """
    return _agent.handle_request(
        customer_id=request.customer_id,
        message=request.message,
        accept_retention_offer=request.accept_retention_offer,
    )
