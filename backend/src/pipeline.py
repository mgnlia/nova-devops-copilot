"""
Main pipeline orchestrator — runs the 4-agent loop:
Monitor → Reason → Act → Escalate

Returns a complete pipeline result for the dashboard.
"""
import logging
from datetime import datetime, timezone
from typing import Any

from src.agents.monitor_agent import run_monitor_agent
from src.agents.reason_agent import run_reason_agent
from src.agents.act_agent import run_act_agent
from src.agents.escalate_agent import run_escalate_agent

logger = logging.getLogger(__name__)


def run_pipeline() -> dict[str, Any]:
    """
    Execute the full 4-agent pipeline.
    Returns complete result dict for API consumption.
    """
    pipeline_start = datetime.now(timezone.utc)
    logger.info("Pipeline starting at %s", pipeline_start.isoformat())

    # Stage 1: Monitor
    logger.info("[1/4] Monitor Agent — collecting signals...")
    signals = run_monitor_agent()

    # Stage 2: Reason
    logger.info("[2/4] Reason Agent — synthesizing cross-service signals...")
    reason_result = run_reason_agent(signals)
    incidents = reason_result.get("incidents", [])

    # Stage 3: Act (auto-remediable incidents only)
    logger.info("[3/4] Act Agent — executing approved playbooks...")
    act_result = run_act_agent(incidents)

    # Update incident statuses based on remediations
    remediated_ids = {r["incident_id"] for r in act_result.get("remediations", [])}
    for inc in incidents:
        if inc["incident_id"] in remediated_ids:
            inc["status"] = "REMEDIATED"
        elif not inc.get("auto_remediable"):
            inc["status"] = "PENDING_HITL"

    # Stage 4: Escalate (HITL incidents)
    logger.info("[4/4] Escalate Agent — generating HITL summaries...")
    escalate_result = run_escalate_agent(incidents)

    pipeline_end = datetime.now(timezone.utc)
    duration_ms = int((pipeline_end - pipeline_start).total_seconds() * 1000)

    return {
        "pipeline_run_id": f"run-{pipeline_start.strftime('%Y%m%d-%H%M%S')}",
        "started_at": pipeline_start.isoformat(),
        "completed_at": pipeline_end.isoformat(),
        "duration_ms": duration_ms,
        "signals": signals,
        "incidents": incidents,
        "remediations": act_result.get("remediations", []),
        "escalations": escalate_result.get("escalations", []),
        "summary": {
            "total_incidents": len(incidents),
            "auto_remediated": len(remediated_ids),
            "pending_hitl": sum(1 for i in incidents if i.get("status") == "PENDING_HITL"),
            "total_savings_usd": sum(
                i.get("estimated_monthly_savings_usd", 0) for i in incidents
            ),
        },
    }
