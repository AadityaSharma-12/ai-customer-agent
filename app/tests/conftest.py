"""Shared pytest fixtures.

Each test gets a fresh, deterministic copy of the mock Zoho datastore so
tests don't leak state (e.g. a cancellation in one test shouldn't affect
another test's view of the same customer).
"""
from copy import deepcopy

import pytest

from app.mcp import zoho_client
from app.services import session_store


@pytest.fixture(autouse=True)
def reset_zoho_state():
    original_customers = deepcopy(zoho_client._CUSTOMERS)
    original_logs = deepcopy(zoho_client._AUDIT_LOGS)
    original_seq = zoho_client._audit_log_seq

    yield

    zoho_client._CUSTOMERS.clear()
    zoho_client._CUSTOMERS.update(original_customers)
    zoho_client._AUDIT_LOGS.clear()
    zoho_client._AUDIT_LOGS.extend(original_logs)
    zoho_client._audit_log_seq = original_seq


@pytest.fixture(autouse=True)
def reset_session_state():
    session_store._SESSIONS.clear()
    yield
    session_store._SESSIONS.clear()
