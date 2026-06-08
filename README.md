# AI Customer Service Agent — Account Cancellation & Retention

A production-style customer service agent that handles subscription
cancellation requests end-to-end: authentication, profile lookup, retention
offers, prorated refund calculation, account cancellation, and audit logging
— all behind a single FastAPI endpoint.

Built to satisfy the assessment spec in [`CLAUDE.md`](CLAUDE.md).

## Architecture

```text
User
  │
  ▼
FastAPI Endpoint  (app/api/main.py — POST /cancel-account)
  │
  ▼
CancellationAgent  (app/agent/agent.py — workflow orchestrator)
  │
  ▼
Tools Layer  (app/agent/tools.py)
  ├── Zoho MCP Read    ─┐
  ├── Refund Calculator │
  ├── Retention Engine  ├── app/services/, app/mcp/
  ├── Zoho MCP Write    │
  └── Audit Logger     ─┘
  │
  ▼
Zoho MCP (mock)  (app/mcp/zoho_client.py — in-memory simulated datastore)

Knowledge Base  (app/kb/cancellation_policy.json) → Business Rules
```

### A note on "the agent"

The orchestrator is a deterministic workflow state machine, not an LLM
wrapper — see the docstring at the top of [`app/agent/agent.py`](app/agent/agent.py)
for the reasoning. It enforces the same behavioural contract the spec's
"system rules" describe (verify identity first, always attempt retention,
use only KB data, explain refund calculations, log every action), which
makes the whole workflow deterministic, fully unit-testable, and free of
any external API dependency — while remaining straightforward to front with
an LLM later if conversational free-text handling is desired (the
`SYSTEM_RULES` constant is kept as a ready-to-use system prompt for that).

### A note on Zoho MCP

`app/mcp/zoho_client.py` is a **mock** client: an in-memory datastore seeded
with sample customers, exposing the same function signatures
(`get_customer`, `get_subscription`, `update_subscription_status`,
`create_audit_log`) a real Zoho MCP-backed client would. This keeps the
project fully runnable and testable offline. Swapping in a real integration
later should not require any change to the agent or tools layer — see
[`.env.example`](.env.example) for the credentials a live integration would need.

## Project layout

```text
app/
├── agent/      # CancellationAgent orchestrator + tools layer
├── api/        # FastAPI app & routes
├── kb/         # Knowledge base (cancellation policy JSON + loader)
├── mcp/        # Mock Zoho MCP client
├── services/   # Refund calculator & retention engine (business rules)
├── models/     # Pydantic request/response schemas
└── tests/      # pytest suite (26 tests, ~98% coverage)
```

## Running locally

```bash
python -m venv .venv
.venv/Scripts/activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

uvicorn app.api.main:app --reload
```

The API is now available at `http://127.0.0.1:8000` (interactive docs at `/docs`).

## Running the tests

```bash
pytest
```

This runs the full suite with coverage (`pytest-cov`, configured in
`pyproject.toml`) and fails if coverage drops below 80%. Current coverage is
~98%.

## Demo flow

This mirrors the spec's Phase 15 demo script. The workflow is two calls: the
first call always returns a retention offer (retention must always be
attempted before cancellation); the second call carries the customer's
decision.

**1) Customer asks to cancel — agent authenticates, fetches the profile, and
presents a retention offer:**

```bash
curl -X POST http://127.0.0.1:8000/cancel-account \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "123", "message": "I want to cancel my subscription."}'
```

```json
{
  "status": "retention_offer_presented",
  "message": "Before we proceed, we'd like to offer you: 20% discount — 20% off the next 3 months for Premium subscribers. Would you like to accept this offer and keep your subscription?",
  "offer": {"type": "20% discount", "description": "...", "eligibility_reason": "Customer is on the Premium plan."},
  "refund": null,
  "audit_log_id": 1,
  "customer_id": "123"
}
```

**2) Customer declines — agent calculates the prorated refund, cancels the
subscription, and logs the action:**

```bash
curl -X POST http://127.0.0.1:8000/cancel-account \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "123", "message": "No thanks, please cancel.", "accept_retention_offer": false}'
```

```json
{
  "status": "cancelled",
  "message": "Your account has been cancelled. Based on your Premium plan and a 30-day billing cycle, your prorated refund for the unused portion of this cycle is ₹666.67. This amount will be returned to your original payment method.",
  "offer": {"type": "20% discount", "description": "...", "eligibility_reason": "..."},
  "refund": 666.67,
  "audit_log_id": 2,
  "customer_id": "123"
}
```

If the customer instead replies with `"accept_retention_offer": true`, the
agent keeps the subscription active, applies the offer, logs the decision,
and ends the workflow without ever calculating a refund or cancelling
anything.

### Sample customer IDs (seeded in the mock Zoho datastore)

| customer_id | plan       | scenario it demonstrates                              |
|-------------|------------|-------------------------------------------------------|
| `123`       | Premium    | Standard flow — 20% discount offer, prorated refund   |
| `456`       | Enterprise | Account-review retention offer                        |
| `789`       | Premium    | Subscribed "today" — maximum possible refund          |
| `321`       | Free       | $0 monthly fee — refund is always zero                |
| `000`       | Premium    | Subscription record simulated as out-of-sync (Zoho MCP failure) |
| _(anything else)_ | — | Unknown customer — `invalid_customer` response |

## Docker

```bash
docker build -t ai-customer-agent .
docker run -p 8080:8080 ai-customer-agent
```

## CI/CD

[`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) runs on every
push/PR to `main`:

1. Install dependencies
2. Run the test suite with coverage (fails the build under 80%)
3. Build the Docker image

A `deploy` job is included but gated behind a manual `workflow_dispatch`
trigger — see [`docs/deployment.md`](docs/deployment.md) for the one-time GCP
setup (service account, secrets) required to enable automatic deploys to
Cloud Run, and for the manual `gcloud` commands to deploy directly.

## Knowledge base

All policy data — subscription plans & fees, refund formula, retention
offers per tier, cancellation rules, and grace period — lives in
[`app/kb/cancellation_policy.json`](app/kb/cancellation_policy.json) and is
the **only** source of policy facts the agent uses (per the "use only KB
data, never invent policies" system rule).
