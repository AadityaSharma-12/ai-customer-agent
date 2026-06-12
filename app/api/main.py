"""FastAPI application exposing the cancellation & retention agent."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.agent.agent import CancellationAgent
from app.models.schemas import CancelAccountRequest, CancelAccountResponse

app = FastAPI(
    title="AI Customer Service Agent — Account Cancellation",
    description="Handles subscription cancellation and retention workflows.",
    version="1.0.0",
)

# Allow the Next.js dev server (npm run dev, port 3000) to call the API
# directly while developing. In production the frontend is served from the
# same origin (see the static mount below), so CORS is never exercised there.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
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


# Serve the statically-exported Next.js frontend (built via `npm run build`
# into frontend/out) as a single deployable unit. Mounted last so it never
# shadows the API routes above; unmatched paths fall back to index.html so
# client-side routes (e.g. /live) work on a hard refresh.
_FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "out"

if _FRONTEND_DIR.is_dir():
    app.mount("/_next", StaticFiles(directory=_FRONTEND_DIR / "_next"), name="next-assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str) -> FileResponse:
        candidate = _FRONTEND_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)

        candidate_html = _FRONTEND_DIR / f"{full_path}.html"
        if candidate_html.is_file():
            return FileResponse(candidate_html)

        return FileResponse(_FRONTEND_DIR / "index.html")
