"""Shared pytest fixtures for the Accountants Anonymous test suite.

pytest discovers this file automatically. Any fixture defined here can be
used by any test just by naming it as a function argument.

Three layers of tests live under tests/:

  tests/schema/  Offline. Loads database/schema.sql into an in-memory SQLite
                 database (Cloudflare D1 *is* SQLite), so it always runs.
  tests/api/     Black-box HTTP tests against a running Worker.
                 Set AA_BASE_URL (e.g. http://localhost:5173) to enable.
                 Set AA_D1_PATH to the local D1 .sqlite file so tests can seed
                 users and inspect rows (auto-detected under .wrangler/ too).
  tests/rules/   Unit tests for the Python worker's auth rules module.
                 Set AA_PY_WORKER_SRC to the folder containing it.
"""
from __future__ import annotations

import hashlib
import os
import sqlite3
import sys
import uuid
from collections import OrderedDict
from datetime import datetime, timedelta
from pathlib import Path

import pytest

# Where is the app repo? In order: AA_REPO_ROOT, the folder containing this
# suite (when committed inside the repo), or a sibling react-starter-template clone.
SUITE_ROOT = Path(__file__).resolve().parent.parent


def _default_repo_root() -> Path:
    if (SUITE_ROOT.parent / "database" / "schema.sql").exists():
        return SUITE_ROOT.parent
    return SUITE_ROOT.parent / "react-starter-template"


REPO_ROOT = Path(os.environ.get("AA_REPO_ROOT") or _default_repo_root()).expanduser().resolve()
SCHEMA_SQL = REPO_ROOT / "database" / "schema.sql"

ROLE_IDS = {"administrator": 1, "manager": 2, "accountant": 3}


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def worker_password_hash(password: str) -> str:
    """Mirror of hashPassword() in worker/index.ts (unsalted SHA-256 hex).

    Seeding test users needs the same hash the Worker compares against.
    When the team switches to bcrypt/Argon2 (TC-032), update this function.
    """
    return hashlib.sha256(password.encode()).hexdigest()


def _sqlite_ts(dt: datetime) -> str:
    # SQLite's datetime('now') format, so comparisons in SQL work.
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def insert_user(
    conn: sqlite3.Connection,
    *,
    role: str = "accountant",
    status: str = "active",
    password: str = "Ledger#2026",
    password_expires_in: timedelta = timedelta(days=90),
    failed_login_attempts: int = 0,
) -> dict:
    """Insert a throwaway user (+ role + current password) and return its details."""
    tag = uuid.uuid4().hex[:8]
    email = f"test-{role}-{tag}@example.test"
    username = f"T{role[:4]}{tag}"
    cur = conn.execute(
        """INSERT INTO users (username, email, first_name, last_name, date_of_birth,
                              status, failed_login_attempts)
           VALUES (?, ?, 'Test', ?, '1995-05-05', ?, ?)""",
        (username, email, role.title(), status, failed_login_attempts),
    )
    user_id = cur.lastrowid
    conn.execute(
        "INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, 1)",
        (user_id, ROLE_IDS[role]),
    )
    conn.execute(
        """INSERT INTO passwords (user_id, encrypted_password, expires_at, is_current)
           VALUES (?, ?, ?, 1)""",
        (
            user_id,
            worker_password_hash(password),
            _sqlite_ts(datetime.utcnow() + password_expires_in),
        ),
    )
    conn.commit()
    return {
        "user_id": user_id,
        "email": email,
        "username": username,
        "password": password,
        "role": role,
        "status": status,
    }


def delete_user(conn: sqlite3.Connection, user_id: int) -> None:
    for table in ("login_attempts", "passwords", "user_roles", "email_logs"):
        conn.execute(f"DELETE FROM {table} WHERE user_id = ?", (user_id,))
    conn.execute("DELETE FROM users WHERE user_id = ?", (user_id,))
    conn.commit()


# --------------------------------------------------------------------------
# Layer 1: offline schema database
# --------------------------------------------------------------------------

@pytest.fixture
def schema_db():
    """A brand-new in-memory database built from database/schema.sql.

    Function scope (the default) means every test gets a fresh copy, so tests
    can't leak data into each other.
    """
    if not SCHEMA_SQL.exists():
        pytest.fail(f"schema not found at {SCHEMA_SQL}; set AA_REPO_ROOT to your react-starter-template clone")
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA_SQL.read_text())
    yield conn
    conn.close()


@pytest.fixture
def make_user(schema_db):
    """Factory fixture: call make_user(role=..., status=...) inside a test."""
    def _make(**kwargs):
        return insert_user(schema_db, **kwargs)
    return _make


# --------------------------------------------------------------------------
# Layer 2: running Worker over HTTP
# --------------------------------------------------------------------------

@pytest.fixture(scope="session")
def base_url() -> str:
    url = os.environ.get("AA_BASE_URL", "").rstrip("/")
    if not url:
        pytest.skip("AA_BASE_URL not set; start the app (npm run dev) to run API tests")
    import requests

    try:
        requests.get(f"{url}/api/health", timeout=3)
    except requests.RequestException as exc:
        pytest.skip(f"Worker not reachable at {url}: {exc}")
    return url


@pytest.fixture
def api(base_url):
    """A requests.Session whose paths are relative to AA_BASE_URL."""
    import requests

    class ApiSession(requests.Session):
        def request(self, method, path, *args, **kwargs):
            kwargs.setdefault("timeout", 10)
            return super().request(method, base_url + path, *args, **kwargs)

    with ApiSession() as session:
        yield session


def _find_local_d1() -> Path | None:
    explicit = os.environ.get("AA_D1_PATH")
    if explicit:
        return Path(explicit)
    state = REPO_ROOT / ".wrangler" / "state" / "v3" / "d1"
    candidates = [p for p in state.rglob("*.sqlite") if p.stat().st_size > 0] if state.exists() else []
    return max(candidates, key=lambda p: p.stat().st_mtime) if candidates else None


@pytest.fixture(scope="session")
def d1(base_url):
    """Connection to the *local* D1 database the running Worker uses.

    Lets tests arrange data (seed users) and assert on system state
    (login_attempts rows, user status) - STS section 2.2 asks for both.
    Never point this at production.
    """
    path = _find_local_d1()
    if not path or not path.exists():
        pytest.skip("Local D1 database not found; set AA_D1_PATH")
    conn = sqlite3.connect(path, timeout=5)
    conn.row_factory = sqlite3.Row
    yield conn
    conn.close()


@pytest.fixture
def live_user(d1):
    """Factory that seeds users into local D1 and removes them afterwards."""
    created = []

    def _make(**kwargs):
        user = insert_user(d1, **kwargs)
        created.append(user["user_id"])
        return user

    yield _make
    for user_id in created:
        delete_user(d1, user_id)


# --------------------------------------------------------------------------
# Layer 3: Python worker rules module
# --------------------------------------------------------------------------

@pytest.fixture(scope="session")
def rules():
    """Import the Python worker's auth rules module, or skip if it's not there."""
    src = os.environ.get("AA_PY_WORKER_SRC")
    if src:
        sys.path.insert(0, src)
    module_name = os.environ.get("AA_RULES_MODULE", "auth_rules")
    return pytest.importorskip(module_name, reason=f"{module_name} not importable; set AA_PY_WORKER_SRC")


# --------------------------------------------------------------------------
# STS execution summary (STS section 7)
# --------------------------------------------------------------------------

_sts_results: "OrderedDict[str, list[str]]" = OrderedDict()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    marker = item.get_closest_marker("sts")
    if not marker:
        return
    # Record the call phase, or the setup phase when the test was skipped there.
    if report.when == "call" or (report.when == "setup" and report.outcome != "passed"):
        if hasattr(report, "wasxfail"):
            status = "Failed (known defect)" if report.skipped else "XPASS - fixed? remove xfail"
        else:
            status = {"passed": "Passed", "failed": "Failed", "skipped": "Not Run"}[report.outcome]
        for tc in marker.args:
            _sts_results.setdefault(tc, []).append(status)


def pytest_terminal_summary(terminalreporter):
    if not _sts_results:
        return
    tr = terminalreporter
    tr.section("STS test case status")

    def rollup(statuses):
        # Worst outcome wins. A case only counts as Passed when every test for
        # it actually ran - STS 2.2: don't mark Passed until it's observed.
        for s in ("Failed", "XPASS - fixed? remove xfail", "Failed (known defect)"):
            if s in statuses:
                return s
        if "Passed" in statuses:
            return "Partial (some tests not run)" if "Not Run" in statuses else "Passed"
        return "Not Run"

    def tc_key(tc):
        return int(tc.split("-")[1])

    counts: dict[str, int] = {}
    for tc in sorted(_sts_results, key=tc_key):
        status = rollup(_sts_results[tc])
        counts[status] = counts.get(status, 0) + 1
        tr.write_line(f"  {tc}  {status}")
    tr.write_line("")
    tr.write_line("  " + ", ".join(f"{k}: {v}" for k, v in counts.items()))
    tr.write_line(f"  STS cases with automated coverage: {len(_sts_results)} of 47")
