# AI Customer Service Agent — Account Cancellation & Retention

A production-style customer service agent that handles subscription
cancellation requests end-to-end: authentication, profile lookup, retention
offers, prorated refund calculation, account cancellation, and audit logging
— all behind a single FastAPI endpoint.

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
any external API dependency for its core logic.

The only place an LLM is involved is understanding the customer's free-text
messages: [`app/services/intent_service.py`](app/services/intent_service.py)
uses Gemini (via `google-genai`) for two narrow classifications — "is this a
cancellation request?" and "did the customer accept or decline the retention
offer?". All refund math, retention eligibility, KB lookups, and audit
logging remain entirely deterministic and unaffected by the LLM. If Gemini is
unavailable or unconfigured, both classifiers fail safe (default to
proceeding / asking the customer to clarify), so the agent degrades
gracefully instead of erroring.

### A note on Zoho MCP

`app/mcp/zoho_client.py` is a **mock** client: an in-memory datastore seeded
with sample customers, exposing the same function signatures
(`get_customer`, `get_subscription`, `update_subscription_status`,
`create_audit_log`) a real Zoho MCP-backed client would. This keeps the
project fully runnable and testable offline. Swapping in a real integration
later should not require any change to the agent or tools layer — see the
environment variables section below for the credentials a live integration
would need.

## Project layout

```text
app/
├── agent/      # CancellationAgent orchestrator + tools layer
├── api/        # FastAPI app & routes
├── kb/         # Knowledge base (cancellation policy JSON + loader)
├── mcp/        # Mock Zoho MCP client
├── services/   # Refund calculator, retention engine, intent (Gemini)
│               # classification, in-memory session store
├── models/     # Pydantic request/response schemas
└── tests/      # pytest suite (45 tests, ~95% coverage)
```

## Running locally

```bash
python -m venv .venv
.venv/Scripts/activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

uvicorn app.api.main:app --reload
```

The API is now available at `http://127.0.0.1:8000` (interactive docs at `/docs`).

### Optional: enabling free-text conversation (Gemini)

The endpoint works fully without any LLM configured — every test mocks the
classifier, and the agent falls back to safe defaults if no API key is set.
To enable real free-text understanding (e.g. "nah still want to cancel"
instead of an explicit `accept_retention_offer` flag), create a `.env` file
in the project root with:

```text
GOOGLE_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-flash-latest
```

`GEMINI_MODEL` defaults to `gemini-flash-latest` if unset.

### Environment variables reference

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `GOOGLE_API_KEY` | Optional | Gemini API key for free-text intent/decision classification. Without it, the agent falls back to safe defaults. |
| `GEMINI_MODEL` | Optional | Gemini model name (default `gemini-flash-latest`). |
| `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ORG_ID`, `ZOHO_API_BASE_URL` | Not used | The current build uses `app/mcp/zoho_client.py`, an in-memory mock client, so none of these are required to run or test the project locally. Reserved for a future live Zoho integration. |

`.env` is gitignored — never commit it.

## Running the tests

```bash
pytest
```

This runs the full suite with coverage (`pytest-cov`, configured in
`pyproject.toml`) and fails if coverage drops below 80%. Current coverage is
~95%.

## Demo flow

This mirrors the spec's Phase 15 demo script. The workflow is two calls: the
first call always returns a retention offer (retention must always be
attempted before cancellation); the second call carries the customer's
decision — either as an explicit `accept_retention_offer: true/false`, or as
a free-text reply that Gemini classifies (see below).

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
  "customer_id": "123",
  "customer": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "plan": "Premium",
    "status": "Active",
    "subscription_start": "2026-01-01"
  }
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
  "customer_id": "123",
  "customer": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "plan": "Premium",
    "status": "Active",
    "subscription_start": "2026-01-01"
  }
}
```

If the customer instead replies with `"accept_retention_offer": true`, the
agent keeps the subscription active, applies the offer, logs the decision,
and ends the workflow without ever calculating a refund or cancelling
anything.

### Free-text conversation

`accept_retention_offer` can be omitted entirely. In that case the agent
reads the customer's `message` and, with Gemini configured, classifies it:

- First message, e.g. `"I want to cancel my subscription"` →
  `retention_offer_presented` (same as above).
- A message that isn't about cancellation at all, e.g. `"what's the weather
  today?"` → `status: "off_topic"` — the agent explains what it can help with
  and does not authenticate, fetch data, or write an audit log.
- After an offer has been presented, a reply that clearly accepts or declines
  it (e.g. `"ok fine keep it"` / `"no, still cancel"`) drives the same
  `retained` / `cancelled` outcomes as the explicit-flag flow.
- A reply that doesn't clearly indicate either → `status:
  "clarification_needed"` — the agent re-presents the same offer and asks the
  customer to confirm. The pending offer is tracked server-side in
  `app/services/session_store.py`, keyed by `customer_id`.

`DELETE /session/{customer_id}` clears any pending offer for that customer,
letting a new conversation start fresh (used by the `/live` frontend's "New
conversation" button).

### Sample customer IDs (seeded in the mock Zoho datastore)

| customer_id | plan       | scenario it demonstrates                              |
|-------------|------------|-------------------------------------------------------|
| `123`       | Premium    | Standard flow — 20% discount offer, prorated refund   |
| `456`       | Enterprise | Account-review retention offer                        |
| `789`       | Premium    | Subscribed "today" — maximum possible refund          |
| `321`       | Free       | $0 monthly fee — refund is always zero                |
| `000`       | Premium    | Subscription record simulated as out-of-sync (Zoho MCP failure) |
| _(anything else)_ | — | Unknown customer — `invalid_customer` response |

## Frontend

The `frontend/` directory is a Next.js 14 app with two modes:

- **Showcase** (`/`) — a polished, scripted demo of the agent UI replaying
  pre-recorded transcripts from `frontend/src/data/scenarios.ts`. Useful for
  presenting the workflow without a backend running.
- **Live Agent** (`/live`) — a real client for the backend above. Pick a
  customer ID and chat with the agent in free text — every message is sent
  to `POST /cancel-account` and the response (chat reply, workflow timeline,
  retention offer, refund, audit log ID, customer profile) is rendered as-is,
  nothing fabricated. "New conversation" clears the chat and the pending
  retention-offer session for that customer. Use the sample customer IDs
  below to exercise each scenario.

### Running the frontend in development

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:3000`. For `/live` to reach the backend, create
`frontend/.env.local` with:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

and run the backend separately with `uvicorn app.api.main:app --reload`
(CORS is already configured to allow `http://localhost:3000`).

### Production build

```bash
cd frontend
npm run build
```

`next.config.js` is configured with `output: 'export'`, so this produces a
static site in `frontend/out/`. When that directory exists, `app/api/main.py`
automatically serves it — `/` and `/live` are served same-origin alongside
the API, so no `NEXT_PUBLIC_API_BASE_URL` is needed in production (an empty
base URL means same-origin requests).

## Docker

The `Dockerfile` is a multi-stage build: a Node stage builds the frontend
(`frontend/out/`), then a slim Python stage copies the app code and the built
frontend and runs `uvicorn`. The final image has no Node runtime.

```bash
docker build -t ai-customer-agent .
docker run -p 8080:8080 ai-customer-agent
```

Visiting `http://localhost:8080/` serves the Showcase UI, `/live` serves the
Live Agent UI (backed by the same container's API), and `/cancel-account` /
`/health` remain available as JSON endpoints.

## CI/CD

[`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) runs on every
push/PR to `main`:

1. Install dependencies
2. Run the test suite with coverage (fails the build under 80%)
3. Build the Docker image

A `deploy` job is included but gated behind a manual `workflow_dispatch`
trigger. It requires a one-time GCP setup (service account + `GCP_PROJECT_ID`
/ `GCP_SA_KEY` repository secrets) before it can deploy to Cloud Run. To
deploy manually instead:

```bash
gcloud builds submit
gcloud run deploy ai-customer-agent --source . --allow-unauthenticated --region us-central1
```

## Knowledge base

All policy data — subscription plans & fees, refund formula, retention
offers per tier, cancellation rules, and grace period — lives in
[`app/kb/cancellation_policy.json`](app/kb/cancellation_policy.json) and is
the **only** source of policy facts the agent uses (per the "use only KB
data, never invent policies" system rule).
