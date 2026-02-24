"""
Nova DevOps Copilot — FastAPI backend
4-agent pipeline: Monitor → Reason → Act → Escalate
Powered by Amazon Nova Pro via AWS Bedrock
"""
from __future__ import annotations

import asyncio
import os
from datetime import datetime
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents import MonitorAgent, ReasonAgent, ActAgent, EscalateAgent

load_dotenv()

# ── Config ──────────────────────────────────────────────────────────────────
# Default to False in production — set USE_MOCK=true only for local dev
USE_MOCK = os.getenv("USE_MOCK", "false").lower() == "true"

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Nova DevOps Copilot API",
    description="AI-powered DevOps assistant — Amazon Nova Pro + 4-agent pipeline",
    version="1.0.0",
    docs_url="/docs",
)

# ── CORS — explicit origins (wildcard + credentials is invalid per CORS spec) ──
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "https://nova-devops-copilot.vercel.app,https://frontend-delta-drab-85.vercel.app,http://localhost:3000",
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Agent singletons ─────────────────────────────────────────────────────────
monitor_agent  = MonitorAgent(use_mock=USE_MOCK)
reason_agent   = ReasonAgent(use_mock=USE_MOCK)
act_agent      = ActAgent(use_mock=USE_MOCK)
escalate_agent = EscalateAgent()

# ── In-memory pipeline run store ─────────────────────────────────────────────
pipeline_runs: list[dict[str, Any]] = []


# ── Schemas ───────────────────────────────────────────────────────────────────
class ResolveRequest(BaseModel):
    resolution: str  # approved | rejected | deferred
    resolved_by: str = "operator"


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "Nova DevOps Copilot",
        "version": "1.0.0",
        "model": "amazon.nova-pro-v1:0",
        "mode": "mock" if USE_MOCK else "live",
        "agents": ["monitor", "reason", "act", "escalate"],
        "status": "ready",
    }


@app.get("/health")
async def health():
    return {"ok": True, "timestamp": datetime.utcnow().isoformat() + "Z"}


@app.get("/events")
async def get_events():
    """Fetch current infrastructure events from Monitor agent."""
    events = monitor_agent.collect()
    return {"events": events, "count": len(events)}


@app.post("/pipeline/run")
async def run_pipeline():
    """
    Execute full 4-agent pipeline:
    1. Monitor: collect events
    2. Reason: analyze each event with Nova Pro
    3. Act: auto-fix high-confidence events
    4. Escalate: queue low-confidence events for HITL
    Returns full pipeline trace with reasoning chains.
    """
    run_id = f"run-{int(datetime.utcnow().timestamp())}"
    started_at = datetime.utcnow().isoformat() + "Z"

    # Step 1: Monitor
    events = monitor_agent.collect()

    # Step 2: Reason (parallel analysis)
    analyses = await asyncio.gather(
        *[reason_agent.analyze(event) for event in events]
    )

    # Step 3 & 4: Act or Escalate
    results = []
    auto_fixed = 0
    escalated = 0

    for event, analysis in zip(events, analyses):
        action = analysis.get("recommended_action", "escalate")
        entry: dict[str, Any] = {
            "event": event,
            "analysis": analysis,
            "action_taken": action,
            "execution": None,
            "escalation": None,
        }

        if action == "auto_fix":
            execution = await act_agent.execute(event, analysis)
            entry["execution"] = execution
            auto_fixed += 1
        else:
            escalation = escalate_agent.escalate(event, analysis)
            entry["escalation"] = escalation
            escalated += 1

        results.append(entry)

    run_record = {
        "run_id": run_id,
        "started_at": started_at,
        "completed_at": datetime.utcnow().isoformat() + "Z",
        "events_processed": len(events),
        "auto_fixed": auto_fixed,
        "escalated": escalated,
        "results": results,
    }

    pipeline_runs.insert(0, run_record)
    # Keep last 20 runs
    if len(pipeline_runs) > 20:
        pipeline_runs.pop()

    return run_record


@app.get("/pipeline/runs")
async def get_pipeline_runs():
    """Return recent pipeline run history."""
    return {"runs": pipeline_runs, "count": len(pipeline_runs)}


@app.get("/pipeline/runs/{run_id}")
async def get_pipeline_run(run_id: str):
    """Get a specific pipeline run by ID."""
    for run in pipeline_runs:
        if run["run_id"] == run_id:
            return run
    raise HTTPException(404, f"Run {run_id} not found")


@app.get("/escalations")
async def get_escalations():
    """Return pending HITL escalation queue."""
    return {
        "escalations": escalate_agent.get_queue(),
        "count": len(escalate_agent.get_queue()),
    }


@app.get("/escalations/all")
async def get_all_escalations():
    """Return all escalations including resolved."""
    return {
        "escalations": escalate_agent.get_all(),
        "count": len(escalate_agent.get_all()),
    }


@app.post("/escalations/{escalation_id}/resolve")
async def resolve_escalation(escalation_id: str, req: ResolveRequest):
    """Resolve a HITL escalation (approve/reject/defer)."""
    if req.resolution not in ("approved", "rejected", "deferred"):
        raise HTTPException(400, "resolution must be: approved | rejected | deferred")
    try:
        record = escalate_agent.resolve(
            escalation_id,
            resolution=req.resolution,
            resolved_by=req.resolved_by,
        )
        return record
    except KeyError as exc:
        raise HTTPException(404, str(exc)) from exc


@app.get("/analyze/{event_id}")
async def analyze_single_event(event_id: str):
    """Analyze a single event by ID."""
    events = monitor_agent.collect()
    event = next((e for e in events if e["id"] == event_id), None)
    if not event:
        raise HTTPException(404, f"Event {event_id} not found")
    analysis = await reason_agent.analyze(event)
    return {"event": event, "analysis": analysis}


@app.get("/dashboard/summary")
async def dashboard_summary():
    """High-level dashboard metrics."""
    events = monitor_agent.collect()
    severity_counts = {}
    source_counts = {}
    for e in events:
        severity_counts[e["severity"]] = severity_counts.get(e["severity"], 0) + 1
        source_counts[e["source"]] = source_counts.get(e["source"], 0) + 1

    return {
        "total_events": len(events),
        "severity_breakdown": severity_counts,
        "source_breakdown": source_counts,
        "pending_escalations": len(escalate_agent.get_queue()),
        "total_pipeline_runs": len(pipeline_runs),
        "last_run": pipeline_runs[0]["started_at"] if pipeline_runs else None,
        "model": "amazon.nova-pro-v1:0",
        "mode": "mock" if USE_MOCK else "live",
    }
