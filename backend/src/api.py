"""
FastAPI backend — serves the Nova DevOps Copilot dashboard.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.pipeline import run_pipeline
from src.config import DEMO_MODE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Nova DevOps Copilot API",
    description="Proactive Infrastructure Guardian — Amazon Nova AI Hackathon 2026",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for demo (production would use DynamoDB)
_pipeline_cache: dict[str, Any] = {}
_incidents_store: list[dict] = []


# ── Models ────────────────────────────────────────────────────────────────────

class ApprovalRequest(BaseModel):
    incident_id: str
    approved: bool
    operator_note: str = ""


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Nova DevOps Copilot",
        "version": "1.0.0",
        "demo_mode": DEMO_MODE,
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/api/pipeline/run")
def trigger_pipeline():
    """
    Trigger the 4-agent pipeline: Monitor → Reason → Act → Escalate.
    Returns complete pipeline result with incidents, remediations, and escalations.
    """
    global _incidents_store
    try:
        result = run_pipeline()
        _pipeline_cache["latest"] = result
        _incidents_store = result.get("incidents", [])
        return result
    except Exception as e:
        logger.exception("Pipeline failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/pipeline/latest")
def get_latest_pipeline():
    """Return the most recent pipeline run result."""
    if "latest" not in _pipeline_cache:
        # Auto-run for demo
        return trigger_pipeline()
    return _pipeline_cache["latest"]


@app.get("/api/incidents")
def list_incidents():
    """List all incidents from the latest pipeline run."""
    if not _incidents_store:
        trigger_pipeline()
    return {"incidents": _incidents_store}


@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str):
    """Get a specific incident by ID, including full reasoning chain."""
    for inc in _incidents_store:
        if inc.get("incident_id") == incident_id:
            return inc
    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")


@app.post("/api/incidents/{incident_id}/approve")
def approve_incident(incident_id: str, request: ApprovalRequest):
    """
    HITL approval endpoint — operator approves or rejects a remediation.
    Approved incidents will be executed on next pipeline run (or immediately in demo).
    """
    for inc in _incidents_store:
        if inc.get("incident_id") == incident_id:
            if request.approved:
                inc["status"] = "APPROVED_HITL"
                inc["auto_remediable"] = True  # Now approved for execution
                inc["operator_note"] = request.operator_note
                inc["approved_at"] = datetime.now(timezone.utc).isoformat()

                # Execute immediately in demo
                from src.agents.act_agent import run_act_agent
                act_result = run_act_agent([inc])
                inc["status"] = "REMEDIATED"
                return {
                    "message": f"Incident {incident_id} approved and remediated",
                    "remediation": act_result,
                }
            else:
                inc["status"] = "REJECTED_HITL"
                inc["operator_note"] = request.operator_note
                inc["rejected_at"] = datetime.now(timezone.utc).isoformat()
                return {"message": f"Incident {incident_id} rejected by operator"}

    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")


@app.get("/api/demo/signals")
def get_demo_signals():
    """Return raw sandbox signals for demo visualization."""
    from src import sandbox_data
    return {
        "cloudwatch": sandbox_data.CLOUDWATCH_METRICS,
        "cost_anomalies": sandbox_data.COST_ANOMALIES,
        "security_findings": sandbox_data.SECURITY_FINDINGS,
        "ec2_instances": sandbox_data.EC2_INSTANCES,
        "s3_buckets": sandbox_data.S3_BUCKETS,
    }
