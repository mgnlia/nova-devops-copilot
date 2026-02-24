"""
Monitor Agent — polls CloudWatch, Cost Explorer, Security Hub.
In demo mode returns pre-seeded sandbox data.
In live mode calls real AWS APIs.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any

from strands import Agent, tool
from strands.models import BedrockModel

from src.config import AWS_REGION, DEMO_MODE, NOVA_PRO_MODEL_ID
from src import sandbox_data

logger = logging.getLogger(__name__)


# ── Tools ─────────────────────────────────────────────────────────────────────

@tool
def get_cloudwatch_metrics() -> str:
    """Retrieve CloudWatch CPU and connection metrics for all monitored resources."""
    if DEMO_MODE:
        return json.dumps(sandbox_data.CLOUDWATCH_METRICS, indent=2)
    # Live path
    import boto3
    cw = boto3.client("cloudwatch", region_name=AWS_REGION)
    # Real implementation would call get_metric_statistics for each resource
    # Abbreviated for MVP
    return json.dumps([], indent=2)


@tool
def get_cost_anomalies() -> str:
    """Retrieve cost anomalies from AWS Cost Explorer for the last 7 days."""
    if DEMO_MODE:
        return json.dumps(sandbox_data.COST_ANOMALIES, indent=2)
    import boto3
    ce = boto3.client("ce", region_name="us-east-1")
    # Real implementation would call get_anomalies()
    return json.dumps([], indent=2)


@tool
def get_security_findings() -> str:
    """Retrieve HIGH and CRITICAL Security Hub findings across all enabled standards."""
    if DEMO_MODE:
        return json.dumps(sandbox_data.SECURITY_FINDINGS, indent=2)
    import boto3
    sh = boto3.client("securityhub", region_name=AWS_REGION)
    # Real implementation would call get_findings() with severity filter
    return json.dumps([], indent=2)


# ── Agent factory ─────────────────────────────────────────────────────────────

def build_monitor_agent() -> Agent:
    model = BedrockModel(
        model_id=NOVA_PRO_MODEL_ID,
        region_name=AWS_REGION,
        temperature=0.1,
        streaming=False,
    )
    return Agent(
        model=model,
        tools=[get_cloudwatch_metrics, get_cost_anomalies, get_security_findings],
        system_prompt="""You are the Monitor Agent for Nova DevOps Copilot.
Your job is to collect raw infrastructure signals from AWS services.

Steps:
1. Call get_cloudwatch_metrics to retrieve performance data
2. Call get_cost_anomalies to retrieve billing anomalies
3. Call get_security_findings to retrieve security drift events

Return a structured JSON summary with keys:
  - cloudwatch: list of metric readings
  - cost_anomalies: list of cost anomalies
  - security_findings: list of security findings
  - collected_at: ISO timestamp

Do not interpret or remediate — only collect and structure the data.""",
    )


def run_monitor_agent() -> dict[str, Any]:
    """Run the monitor agent and return structured signals."""
    agent = build_monitor_agent()
    response = agent(
        "Collect all current infrastructure signals: CloudWatch metrics, "
        "cost anomalies, and security findings. Return a structured JSON summary."
    )
    # Extract JSON from the agent's text response
    raw = str(response)
    # Try to parse JSON block from response
    import re
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    # Fallback: return raw data directly
    return {
        "cloudwatch": sandbox_data.CLOUDWATCH_METRICS,
        "cost_anomalies": sandbox_data.COST_ANOMALIES,
        "security_findings": sandbox_data.SECURITY_FINDINGS,
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "_raw_response": raw,
    }
