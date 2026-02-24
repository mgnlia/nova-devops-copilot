"""
Nova DevOps Copilot — FastAPI Backend
4-agent pipeline: Planner → Coder → Reviewer → Explainer
"""
import os
import json
import asyncio
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .agents import run_planner, run_coder, run_reviewer, run_explainer, run_pipeline

app = FastAPI(
    title="Nova DevOps Copilot",
    description="4-agent DevOps pipeline powered by Amazon Nova via AWS Bedrock",
    version="1.0.0",
)

# CORS — allow all origins for the hackathon demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class PipelineRequest(BaseModel):
    request: str
    stream: bool = False


class AgentResult(BaseModel):
    agent: str
    output: str
    status: str = "done"


class PipelineResponse(BaseModel):
    request: str
    agents: list[AgentResult]
    model: str = "amazon.nova-pro-v1:0"
    mock: bool


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "service": "Nova DevOps Copilot",
        "version": "1.0.0",
        "model": "amazon.nova-pro-v1:0",
        "agents": ["PlannerAgent", "CodeAgent", "ReviewAgent", "ExplainerAgent"],
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "mock": os.getenv("USE_MOCK", "true").lower() == "true"}


@app.post("/pipeline", response_model=PipelineResponse)
async def run_full_pipeline(req: PipelineRequest):
    """Run all 4 agents in sequence and return the complete pipeline output."""
    if not req.request.strip():
        raise HTTPException(status_code=400, detail="Request cannot be empty")

    results = run_pipeline(req.request)
    is_mock = os.getenv("USE_MOCK", "true").lower() == "true"

    return PipelineResponse(
        request=req.request,
        agents=[
            AgentResult(agent="PlannerAgent", output=results["planner"]),
            AgentResult(agent="CodeAgent", output=results["coder"]),
            AgentResult(agent="ReviewAgent", output=results["reviewer"]),
            AgentResult(agent="ExplainerAgent", output=results["explainer"]),
        ],
        mock=is_mock,
    )


@app.post("/pipeline/stream")
async def stream_pipeline(req: PipelineRequest):
    """Stream agent outputs as Server-Sent Events for real-time UI updates."""
    if not req.request.strip():
        raise HTTPException(status_code=400, detail="Request cannot be empty")

    async def generate() -> AsyncGenerator[str, None]:
        is_mock = os.getenv("USE_MOCK", "true").lower() == "true"

        agents = [
            ("PlannerAgent", lambda: run_planner(req.request)),
            ("CodeAgent", None),   # depends on planner output
            ("ReviewAgent", None), # depends on coder output
            ("ExplainerAgent", None), # depends on all
        ]

        planner_out = ""
        coder_out = ""
        reviewer_out = ""

        # Agent 1: Planner
        yield _sse_event("agent_start", {"agent": "PlannerAgent", "message": "Analyzing your DevOps request..."})
        await asyncio.sleep(0.1)
        planner_out = run_planner(req.request)
        yield _sse_event("agent_done", {"agent": "PlannerAgent", "output": planner_out})
        await asyncio.sleep(0.1)

        # Agent 2: Coder
        yield _sse_event("agent_start", {"agent": "CodeAgent", "message": "Generating Terraform & CI/CD code..."})
        await asyncio.sleep(0.1)
        coder_out = run_coder(planner_out, req.request)
        yield _sse_event("agent_done", {"agent": "CodeAgent", "output": coder_out})
        await asyncio.sleep(0.1)

        # Agent 3: Reviewer
        yield _sse_event("agent_start", {"agent": "ReviewAgent", "message": "Reviewing code for security & best practices..."})
        await asyncio.sleep(0.1)
        reviewer_out = run_reviewer(coder_out, planner_out)
        yield _sse_event("agent_done", {"agent": "ReviewAgent", "output": reviewer_out})
        await asyncio.sleep(0.1)

        # Agent 4: Explainer
        yield _sse_event("agent_start", {"agent": "ExplainerAgent", "message": "Writing plain-English explanation..."})
        await asyncio.sleep(0.1)
        explainer_out = run_explainer(planner_out, coder_out, reviewer_out, req.request)
        yield _sse_event("agent_done", {"agent": "ExplainerAgent", "output": explainer_out})
        await asyncio.sleep(0.1)

        # Done
        yield _sse_event("pipeline_done", {
            "message": "Pipeline complete!",
            "model": "amazon.nova-pro-v1:0",
            "mock": is_mock,
        })

    return StreamingResponse(generate(), media_type="text/event-stream")


def _sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


# ---------------------------------------------------------------------------
# Individual agent endpoints (for testing)
# ---------------------------------------------------------------------------

@app.post("/agents/planner")
async def planner_endpoint(req: PipelineRequest):
    return {"agent": "PlannerAgent", "output": run_planner(req.request)}


@app.post("/agents/coder")
async def coder_endpoint(req: PipelineRequest):
    planner_out = run_planner(req.request)
    return {"agent": "CodeAgent", "output": run_coder(planner_out, req.request)}


@app.post("/agents/reviewer")
async def reviewer_endpoint(req: PipelineRequest):
    planner_out = run_planner(req.request)
    coder_out = run_coder(planner_out, req.request)
    return {"agent": "ReviewAgent", "output": run_reviewer(coder_out, planner_out)}


@app.post("/agents/explainer")
async def explainer_endpoint(req: PipelineRequest):
    results = run_pipeline(req.request)
    return {"agent": "ExplainerAgent", "output": results["explainer"]}
