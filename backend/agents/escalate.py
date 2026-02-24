"""
Escalate Agent — handles low-confidence or high-risk events
that require human-in-the-loop approval before action.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any


class EscalateAgent:
    """
    Manages the HITL escalation queue.
    Stores pending escalations in memory (production: use DynamoDB/Redis).
    """

    def __init__(self):
        self._queue: dict[str, dict[str, Any]] = {}

    def escalate(
        self,
        event: dict[str, Any],
        analysis: dict[str, Any],
    ) -> dict[str, Any]:
        """Add event to escalation queue. Returns escalation record."""
        escalation_id = f"esc-{event['id']}"
        record = {
            "escalation_id": escalation_id,
            "event_id": event["id"],
            "event": event,
            "analysis": analysis,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "resolved_at": None,
            "resolution": None,
            "resolved_by": None,
        }
        self._queue[escalation_id] = record
        return record

    def get_queue(self) -> list[dict[str, Any]]:
        """Return all pending escalations."""
        return [r for r in self._queue.values() if r["status"] == "pending"]

    def get_all(self) -> list[dict[str, Any]]:
        """Return all escalations (pending + resolved)."""
        return list(self._queue.values())

    def resolve(
        self,
        escalation_id: str,
        resolution: str,
        resolved_by: str = "operator",
    ) -> dict[str, Any]:
        """
        Resolve an escalation.
        resolution: 'approved' | 'rejected' | 'deferred'
        """
        record = self._queue.get(escalation_id)
        if not record:
            raise KeyError(f"Escalation {escalation_id} not found")
        record["status"] = "resolved"
        record["resolution"] = resolution
        record["resolved_by"] = resolved_by
        record["resolved_at"] = datetime.utcnow().isoformat() + "Z"
        return record

    def get(self, escalation_id: str) -> dict[str, Any] | None:
        return self._queue.get(escalation_id)
