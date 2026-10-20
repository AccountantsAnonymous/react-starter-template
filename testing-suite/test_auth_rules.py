"""
Unit tests for the Python worker's pure auth rules (F-06, F-10).

    validate_password(password: str) -> list[str]
        Returns a list of rule violations; empty list means valid.

    generate_username(first: str, last: str, created: date, existing: set[str]) -> str
        First initial + full last name + MMYY, with a numeric suffix if taken.

    is_password_reused(new_password: str, history_hashes: list[str]) -> bool
"""
from datetime import date

import pytest

pytestmark = pytest.mark.rules


# --- F-06 Password rules --------------------------------------------------

@pytest.mark.parametrize(
    "password",
    [
        pytest.param("Ledger#2026", marks=pytest.mark.sts("TC-026")),
        pytest.param("a1!aaaaa", id="exactly-8-chars", marks=pytest.mark.sts("TC-026")),
        pytest.param("Z9$" + "x" * 60, id="long", marks=pytest.mark.sts("TC-026")),
    ],
)
def test_compliant_password_is_accepted(rules, password):
    assert rules.validate_password(password) == []


@pytest.mark.parametrize(
    "password, why",
    [
        pytest.param("Ab1!xyz", "7 chars: shorter than eight", marks=pytest.mark.sts("TC-027")),
        pytest.param("", "empty", marks=pytest.mark.sts("TC-027")),
        pytest.param("1Ledger#26", "starts with a number", marks=pytest.mark.sts("TC-028")),
        pytest.param("#Ledger26", "starts with a special char", marks=pytest.mark.sts("TC-028")),
        pytest.param("Ledger#Book", "no number", marks=pytest.mark.sts("TC-029")),
        pytest.param("Ledger2026", "no special character", marks=pytest.mark.sts("TC-030")),
    ],
)
def test_noncompliant_password_is_rejected(rules, password, why):
    errors = rules.validate_password(password)
    assert errors, f"should reject password that is {why}"
    assert all(isinstance(e, str) and e for e in errors), "each error needs a clear message (TC-027)"


@pytest.mark.sts("TC-031")
def test_previously_used_password_is_detected(rules):
    import hashlib

    old = hashlib.sha256(b"Ledger#2025").hexdigest()
    assert rules.is_password_reused("Ledger#2025", [old]) is True
    assert rules.is_password_reused("Ledger#2026", [old]) is False


# --- F-10 Username format -------------------------------------------------

@pytest.mark.parametrize(
    "first, last, created, expected",
    [
        pytest.param("Jane", "Smith", date(2026, 10, 1), "JSmith1026", id="sts-example"),
        pytest.param("Bob", "Lee", date(2027, 1, 15), "BLee0127", id="zero-padded-month"),
        pytest.param("ana", "de la Cruz", date(2026, 3, 9), "AdelaCruz0326", id="spaces-and-case"),
    ],
)
@pytest.mark.sts("TC-043")
def test_username_format(rules, first, last, created, expected):

    assert rules.generate_username(first, last, created, existing=set()) == expected


@pytest.mark.sts("TC-044")
def test_duplicate_username_gets_numeric_suffix(rules):
    existing = {"JSmith1026"}
    second = rules.generate_username("Jane", "Smith", date(2026, 10, 1), existing=existing)
    existing.add(second)
    third = rules.generate_username("John", "Smith", date(2026, 10, 20), existing=existing)

    assert second != "JSmith1026" and second.startswith("JSmith1026")
    assert third not in {"JSmith1026", second}
