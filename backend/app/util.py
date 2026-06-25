"""Small shared helpers."""

from __future__ import annotations

import time


def now_ms() -> int:
    """Current time as epoch milliseconds (DESIGN.md §6 timestamps)."""
    return int(time.time() * 1000)
