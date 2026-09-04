"""Date manipulation and validation utilities for KYC processing."""

from datetime import date, datetime
from typing import Optional, Tuple
from dateutil import parser


def parse_date(date_str: Optional[str]) -> Optional[date]:
    """
    Safely parse a date string into a datetime.date object.
    Supports ISO formats and common human-readable formats (e.g., YYYY-MM-DD, DD/MM/YYYY).
    """
    if not date_str or not isinstance(date_str, str):
        return None
    try:
        dt = parser.parse(date_str.strip())
        return dt.date()
    except (ValueError, TypeError, OverflowError):
        return None


def is_date_expired(expiry_date_str: Optional[str], reference_date: Optional[date] = None) -> Tuple[bool, Optional[str]]:
    """
    Check if a given date string is in the past compared to reference_date (defaults to today).
    Returns (is_expired, formatted_date_or_error_message).
    """
    parsed = parse_date(expiry_date_str)
    if not parsed:
        return False, "Invalid or unparseable date format"

    ref = reference_date or date.today()
    if parsed < ref:
        return True, f"Document expired on {parsed.isoformat()} (reference: {ref.isoformat()})"
    return False, f"Document is valid until {parsed.isoformat()}"


def calculate_age(dob_str: Optional[str], reference_date: Optional[date] = None) -> Optional[int]:
    """Calculate age in years from date of birth string."""
    dob = parse_date(dob_str)
    if not dob:
        return None
    ref = reference_date or date.today()
    age = ref.year - dob.year - ((ref.month, ref.day) < (dob.month, dob.day))
    return age


def is_valid_iso_date(date_str: Optional[str]) -> bool:
    """Validate if date string strictly matches standard YYYY-MM-DD format."""
    if not date_str:
        return False
    try:
        datetime.strptime(date_str.strip(), "%Y-%m-%d")
        return True
    except ValueError:
        return False
