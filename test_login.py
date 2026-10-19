"""Black-box tests for POST /api/auth/login (worker/index.ts).

Run with the app running locally:
    AA_BASE_URL=http://localhost:5173 pytest -m api

Each test follows Arrange / Act / Assert:
  Arrange - seed exactly the user the STS precondition describes (live_user)
  Act     - make the HTTP request
  Assert  - check the visible response AND the database state (STS 2.2)
"""
from datetime import timedelta

import pytest

pytestmark = pytest.mark.api

LOGIN = "/api/auth/login"


def login(api, email, password):
    return api.post(LOGIN, json={"email": email, "password": password})


@pytest.mark.sts("TC-001", "TC-002", "TC-003")
def test_health_endpoint(api):
    response = api.get("/api/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


# --- F-01 Roles and login -------------------------------------------------

@pytest.mark.sts("TC-001", "TC-002", "TC-003")
@pytest.mark.parametrize("role", ["administrator", "manager", "accountant"])
def test_active_user_can_log_in(api, live_user, role):
    user = live_user(role=role)

    response = login(api, user["email"], user["password"])

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["user"]["email"] == user["email"]
    assert "session=" in response.headers.get("Set-Cookie", "")


@pytest.mark.sts("TC-001", "TC-002", "TC-003")
@pytest.mark.parametrize("role", ["administrator", "manager", "accountant"])
@pytest.mark.xfail(strict=True, reason="DEFECT: login response has no role, so the UI can't route to a role home screen")
def test_login_response_includes_role(api, live_user, role):
    user = live_user(role=role)
    body = login(api, user["email"], user["password"]).json()
    assert body["user"]["role"] == role


@pytest.mark.sts("TC-004")
@pytest.mark.parametrize(
    "email_override, password_override",
    [
        (None, "WrongPass#1"),                    # right user, wrong password
        ("nobody@example.test", None),            # unknown user
    ],
    ids=["wrong-password", "unknown-email"],
)
def test_invalid_credentials_are_rejected(api, live_user, email_override, password_override):
    user = live_user()

    response = login(api, email_override or user["email"], password_override or user["password"])

    assert response.status_code == 401
    # Same message for both cases, so attackers can't probe which emails exist.
    assert response.json()["error"] == "Invalid email or password."


@pytest.mark.sts("TC-004")
@pytest.mark.parametrize("payload", [{}, {"email": "a@b.test"}, {"password": "x"}])
def test_missing_fields_return_400(api, payload):
    assert api.post(LOGIN, json=payload).status_code == 400


@pytest.mark.sts("TC-004")
def test_non_json_body_returns_400(api):
    response = api.post(LOGIN, data="not json", headers={"Content-Type": "application/json"})
    assert response.status_code == 400


@pytest.mark.sts("TC-005", "TC-006", "TC-011")
@pytest.mark.parametrize("status", ["inactive", "suspended"])
def test_non_active_account_is_rejected(api, live_user, status):
    user = live_user(status=status)

    response = login(api, user["email"], user["password"])

    assert response.status_code == 403
    assert "not active" in response.json()["error"]
    assert "Set-Cookie" not in response.headers


# --- F-07 Lockout and login data ------------------------------------------

@pytest.mark.sts("TC-036")
def test_login_attempts_are_audited(api, live_user, d1):
    user = live_user()

    login(api, user["email"], "WrongPass#1")
    login(api, user["email"], user["password"])

    rows = d1.execute(
        "SELECT success, attempted_at FROM login_attempts WHERE user_id = ? ORDER BY attempt_id",
        (user["user_id"],),
    ).fetchall()
    assert [r["success"] for r in rows] == [0, 1]
    assert all(r["attempted_at"] for r in rows)


@pytest.mark.sts("TC-033")
@pytest.mark.xfail(strict=True, reason="DEFECT: worker never increments failed_login_attempts or suspends")
def test_three_wrong_passwords_suspend_account(api, live_user, d1):
    user = live_user()

    for _ in range(3):
        login(api, user["email"], "WrongPass#1")

    status = d1.execute("SELECT status FROM users WHERE user_id = ?", (user["user_id"],)).fetchone()["status"]
    assert status == "suspended"


@pytest.mark.sts("TC-035")
@pytest.mark.xfail(strict=True, reason="DEFECT: successful login does not reset failed_login_attempts")
def test_successful_login_resets_failed_counter(api, live_user, d1):
    user = live_user(failed_login_attempts=2)

    assert login(api, user["email"], user["password"]).status_code == 200

    count = d1.execute(
        "SELECT failed_login_attempts FROM users WHERE user_id = ?", (user["user_id"],)
    ).fetchone()["failed_login_attempts"]
    assert count == 0


# --- F-08 Password expiry -------------------------------------------------

@pytest.mark.sts("TC-038")
@pytest.mark.xfail(strict=True, reason="DEFECT: expired password returns generic 401 instead of a change-password signal")
def test_expired_password_requires_change(api, live_user):
    user = live_user(password_expires_in=timedelta(days=-1))

    response = login(api, user["email"], user["password"])

    assert response.status_code != 401, "expired user is told their password is wrong"
    assert response.json().get("passwordExpired") is True


# --- Not yet implemented in the Worker ------------------------------------

@pytest.mark.sts("TC-007")
@pytest.mark.parametrize("path", ["/api/admin/users", "/api/admin/reports/users"])
def test_admin_endpoints_reject_anonymous_requests(api, path):
    response = api.get(path)
    if response.status_code == 404:
        pytest.skip(f"{path} not implemented yet")
    assert response.status_code in (401, 403)
