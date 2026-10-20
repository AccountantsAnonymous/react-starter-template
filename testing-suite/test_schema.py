"""
Offline tests: does database/schema.sql support STS requirement?

These run with no server and no network. Checks the data model side of
each feature - the UI/API side is covered in testing-suite/test-login.py
"""
import re
import sqlite3

import pytest

pytestmark = pytest.mark.schema  # applies to every test in this module


def columns(db, table):
    return {row["name"] for row in db.execute(f"PRAGMA table_info({table})")}


# --- F-01 Roles and login -------------------------------------------------

@pytest.mark.sts("TC-001", "TC-002", "TC-003")
def test_three_roles_are_seeded(schema_db):
    roles = {r["role_name"] for r in schema_db.execute("SELECT role_name FROM roles")}
    assert roles == {"administrator", "manager", "accountant"}


@pytest.mark.sts("TC-005", "TC-006")
@pytest.mark.parametrize("status", ["active", "inactive", "suspended"])
def test_user_status_accepts_known_values(make_user, status):
    user = make_user(status=status)
    assert user["status"] == status


@pytest.mark.sts("TC-005", "TC-006")
def test_user_status_rejects_unknown_values(make_user):
    with pytest.raises(sqlite3.IntegrityError):
        make_user(status="banned")


# --- F-02 Administrator user management -----------------------------------

@pytest.mark.sts("TC-009")
def test_users_table_has_editable_profile_fields(schema_db):
    assert {"first_name", "last_name", "address", "date_of_birth", "email"} <= columns(schema_db, "users")


@pytest.mark.sts("TC-010")
def test_user_cannot_hold_same_role_twice(schema_db, make_user):
    user = make_user(role="accountant")
    with pytest.raises(sqlite3.IntegrityError):
        schema_db.execute(
            "INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, 3, 1)",
            (user["user_id"],),
        )


@pytest.mark.sts("TC-012")
def test_deactivating_keeps_the_user_row(schema_db, make_user):
    user = make_user()
    schema_db.execute("UPDATE users SET status = 'inactive' WHERE user_id = ?", (user["user_id"],))
    row = schema_db.execute("SELECT status FROM users WHERE user_id = ?", (user["user_id"],)).fetchone()
    assert row is not None and row["status"] == "inactive"


@pytest.mark.sts("TC-013")
def test_audit_log_records_admin_and_timestamp(schema_db, make_user):
    target = make_user()
    schema_db.execute(
        "INSERT INTO audit_log (admin_user_id, action_type, affected_user_id) VALUES (1, 'deactivate', ?)",
        (target["user_id"],),
    )
    row = schema_db.execute("SELECT * FROM audit_log").fetchone()
    assert row["admin_user_id"] == 1
    assert row["timestamp"] is not None  # filled by DEFAULT CURRENT_TIMESTAMP


# --- F-03 Header ----------------------------------------------------------

@pytest.mark.sts("TC-017")
def test_profile_picture_is_stored_on_user_record(schema_db):
    assert "profile_picture_url" in columns(schema_db, "users")


# --- F-04 New-user request ------------------------------------------------

@pytest.mark.sts("TC-018")
def test_new_access_request_defaults_to_pending(schema_db):
    schema_db.execute(
        """INSERT INTO access_requests (first_name, last_name, email, date_of_birth, address)
           VALUES ('Jane', 'Smith', 'jane@example.test', '1990-02-03', '1 Main St')"""
    )
    status = schema_db.execute("SELECT status FROM access_requests").fetchone()["status"]
    assert status == "pending"


@pytest.mark.sts("TC-018")
@pytest.mark.parametrize("missing", ["first_name", "last_name", "date_of_birth"])
def test_access_request_requires_identity_fields(schema_db, missing):
    values = {"first_name": "Jane", "last_name": "Smith", "email": "j@example.test", "date_of_birth": "1990-02-03"}
    values[missing] = None
    with pytest.raises(sqlite3.IntegrityError):
        schema_db.execute(
            "INSERT INTO access_requests (first_name, last_name, email, date_of_birth) VALUES (?, ?, ?, ?)",
            tuple(values.values()),
        )


@pytest.mark.sts("TC-021")
def test_access_request_can_be_rejected_with_reason(schema_db):
    assert {"status", "reviewed_by", "reviewed_at", "rejection_reason"} <= columns(schema_db, "access_requests")


# --- F-05 Forgot password -------------------------------------------------

@pytest.mark.sts("TC-023", "TC-024")
def test_security_answers_are_stored_hashed(schema_db):
    cols = columns(schema_db, "security_questions")
    assert "answer_hash" in cols and "answer" not in cols


# --- F-06 Password rules and protection -----------------------------------

@pytest.mark.sts("TC-031")
def test_password_history_keeps_old_passwords(schema_db, make_user):
    user = make_user()
    schema_db.execute("UPDATE passwords SET is_current = 0 WHERE user_id = ?", (user["user_id"],))
    schema_db.execute(
        "INSERT INTO passwords (user_id, encrypted_password, expires_at) VALUES (?, 'newhash', datetime('now', '+90 days'))",
        (user["user_id"],),
    )
    history = schema_db.execute("SELECT is_current FROM passwords WHERE user_id = ?", (user["user_id"],)).fetchall()
    assert sorted(r["is_current"] for r in history) == [0, 1]


BCRYPT = re.compile(r"^\$2[aby]\$\d{2}\$.{53}$")
ARGON2 = re.compile(r"^\$argon2(id|i|d)\$")


@pytest.mark.sts("TC-032")
@pytest.mark.xfail(
    strict=True,
    reason="DEFECT: worker/index.ts hashes with unsalted SHA-256; STS requires salted bcrypt/Argon2",
)
def test_seeded_passwords_are_salted_one_way_hashes(schema_db):
    stored = [r["encrypted_password"] for r in schema_db.execute("SELECT encrypted_password FROM passwords")]
    assert stored, "schema.sql should seed at least the admin password"
    for value in stored:
        assert BCRYPT.match(value) or ARGON2.match(value), f"not bcrypt/Argon2: {value[:12]}..."


# --- F-07 Lockout and login data ------------------------------------------

@pytest.mark.sts("TC-033", "TC-035")
def test_failed_attempt_counter_defaults_to_zero(make_user, schema_db):
    user = make_user()
    row = schema_db.execute("SELECT failed_login_attempts FROM users WHERE user_id = ?", (user["user_id"],)).fetchone()
    assert row["failed_login_attempts"] == 0


@pytest.mark.sts("TC-036")
def test_login_attempts_record_time_and_result(schema_db):
    assert {"attempted_at", "success", "user_id"} <= columns(schema_db, "login_attempts")


# --- F-08 / F-09 Expiry, reports, suspension ------------------------------

@pytest.mark.sts("TC-037", "TC-038", "TC-040")
def test_passwords_have_expiry_dates(schema_db):
    nulls = schema_db.execute("SELECT COUNT(*) FROM passwords WHERE expires_at IS NULL").fetchone()[0]
    assert nulls == 0


@pytest.mark.sts("TC-041", "TC-042")
def test_suspension_has_start_and_end_dates(schema_db):
    assert {"suspension_start_date", "suspension_end_date"} <= columns(schema_db, "user_suspensions")


# --- F-10 Email and username ----------------------------------------------

@pytest.mark.sts("TC-044")
def test_usernames_are_unique(schema_db, make_user):
    user = make_user()
    with pytest.raises(sqlite3.IntegrityError):
        schema_db.execute(
            "INSERT INTO users (username, email, first_name, last_name, date_of_birth) "
            "VALUES (?, 'other@example.test', 'A', 'B', '2000-01-01')",
            (user["username"],),
        )


@pytest.mark.sts("TC-047")
def test_sent_emails_can_be_logged(schema_db):
    schema_db.execute(
        "INSERT INTO email_logs (user_id, recipient_email, subject, email_type) "
        "VALUES (1, 'admin@firm.com', 'Hi', 'admin_message')"
    )
    row = schema_db.execute("SELECT status, sent_at FROM email_logs").fetchone()
    assert row["status"] == "sent" and row["sent_at"] is not None
