"""
Nova DevOps Copilot — Backend API
Powered by Amazon Nova Pro + Nova Lite via Amazon Bedrock
"""

import json
import os
import asyncio
from datetime import datetime
from typing import AsyncGenerator

import boto3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents import run_pipeline, AgentEvent
from mock_data import MOCK_ALERTS, MOCK_METRICS

app = FastAPI(title="Nova DevOps Copilot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    alert_id: str | None = None
    query: str | None = None
    approve_action: bool = False


@app.get("/health")
async def health():
    return {"status": "ok", "model": "amazon.nova-pro-v1:0", "timestamp": datetime.utcnow().isoformat()}


@app.get("/alerts")
async def get_alerts():
    return {"alerts": MOCK_ALERTS}


@app.get("/metrics")
async def get_metrics():
    return {"metrics": MOCK_METRICS}


@app.post("/analyze/stream")
async def analyze_stream(req: AnalyzeRequest):
    """Stream agent pipeline events as Server-Sent Events."""
    alert = None
    if req.alert_id:
        alert = next((a for a in MOCK_ALERTS if a["id"] == req.alert_id), MOCK_ALERTS[0])
    elif req.query:
        # Build synthetic alert from free-text query
        alert = {
            "id": "custom-001",
            "title": req.query,
            "severity": "medium",
            "service": "custom",
            "timestamp": datetime.utcnow().isoformat(),
            "details": req.query,
        }
    else:
        alert = MOCK_ALERTS[0]

    async def event_generator() -> AsyncGenerator[str, None]:
        async for event in run_pipeline(alert):
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.05)
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Non-streaming full pipeline run."""
    alert = None
    if req.alert_id:
        alert = next((a for a in MOCK_ALERTS if a["id"] == req.alert_id), MOCK_ALERTS[0])
    else:
        alert = MOCK_ALERTS[0]

    events = []
    async for event in run_pipeline(alert):
        events.append(event)

    return {"events": events, "alert": alert}
