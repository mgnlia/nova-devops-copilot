"""
Reason Agent — uses Amazon Nova Pro to analyze events and produce
structured root-cause analysis with full reasoning chain visibility.
"""
from __future__ import annotations

import json
import os
from typing import Any

import boto3  # type: ignore
from botocore.exceptions import ClientError, NoCredentialsError


SYSTEM_PROMPT = """You are an expert AWS DevOps SRE. Analyze the provided infrastructure event and produce a structured root-cause analysis.

Your response MUST be valid JSON with this exact structure:
{
  "root_cause": "concise root cause in 1-2 sentences",
  "confidence": 0.85,
  "impact": "description of business/technical impact",
  "reasoning_steps": [
    "Step 1: observation or deduction",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "recommended_action": "auto_fix | escalate | monitor",
  "fix_description": "specific remediation steps",
  "related_services": ["ServiceA", "ServiceB"],
  "estimated_resolution_time": "5 minutes"
}

confidence must be 0.0-1.0. recommended_action must be exactly one of: auto_fix, escalate, monitor.
Only recommend auto_fix for high-confidence (>0.80), well-understood issues with safe automated remediation.
"""


class ReasonAgent:
    """
    Calls Amazon Nova Pro via Bedrock to reason about infrastructure events.
    Falls back to deterministic mock reasoning when credentials are absent.
    """

    def __init__(self, use_mock: bool = True):
        self.use_mock = use_mock
        self._client = None

    def _get_client(self):
        if self._client is None:
            self._client = boto3.client("bedrock-runtime", region_name=os.getenv("AWS_REGION", "us-east-1"))
        return self._client

    async def analyze(self, event: dict[str, Any]) -> dict[str, Any]:
        """Return structured analysis for a single event."""
        if self.use_mock:
            return self._mock_analysis(event)
        return await self._nova_analysis(event)

    async def _nova_analysis(self, event: dict[str, Any]) -> dict[str, Any]:
        """Call Amazon Nova Pro via Bedrock Converse API."""
        try:
            client = self._get_client()
            user_message = f"""Analyze this AWS infrastructure event:

Source: {event['source']}
Service: {event['service']}
Resource: {event['resource']}
Metric: {event['metric']}
Value: {event['value']} (threshold: {event['threshold']})
Severity: {event['severity']}
Message: {event['message']}
Timestamp: {event['timestamp']}

Provide structured root-cause analysis as JSON."""

            response = client.converse(
                modelId="amazon.nova-pro-v1:0",
                system=[{"text": SYSTEM_PROMPT}],
                messages=[{"role": "user", "content": [{"text": user_message}]}],
                inferenceConfig={"maxTokens": 1024, "temperature": 0.1},
            )

            raw = response["output"]["message"]["content"][0]["text"]
            # Strip markdown fences
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            analysis = json.loads(raw)
            analysis["event_id"] = event["id"]
            analysis["model"] = "amazon.nova-pro-v1:0"
            return analysis

        except (NoCredentialsError, ClientError):
            return self._mock_analysis(event)
        except Exception as exc:
            return {
                "event_id": event["id"],
                "root_cause": f"Analysis failed: {exc}",
                "confidence": 0.0,
                "impact": "Unknown",
                "reasoning_steps": [f"Error: {exc}"],
                "recommended_action": "escalate",
                "fix_description": "Manual investigation required.",
                "related_services": [],
                "estimated_resolution_time": "Unknown",
                "model": "error",
            }

    def _mock_analysis(self, event: dict[str, Any]) -> dict[str, Any]:
        """Deterministic mock analysis for demo/testing."""
        mock_map = {
            "alarm-001": {
                "root_cause": "Sustained CPU spike on EC2 instance i-0a1b2c3d4e5f caused by runaway application thread pool exhaustion.",
                "confidence": 0.91,
                "impact": "Production API latency increased 340ms p99. Risk of instance failure within 10 minutes.",
                "reasoning_steps": [
                    "CPUUtilization at 94.7% for >15 minutes exceeds safe operating threshold of 80%.",
                    "CloudWatch metrics show correlated memory pressure — heap usage at 87% suggests GC pressure.",
                    "No recent deployments in the last 6 hours rules out code change as root cause.",
                    "Traffic volume is normal — rules out load spike. Points to internal thread/process issue.",
                    "Pattern matches known thread pool exhaustion signature in the order-service.",
                ],
                "recommended_action": "auto_fix",
                "fix_description": "Restart application process on i-0a1b2c3d4e5f via SSM Run Command. If CPU doesn't drop below 70% within 3 minutes, trigger instance replacement via Auto Scaling.",
                "related_services": ["EC2", "CloudWatch", "Auto Scaling", "SSM"],
                "estimated_resolution_time": "4 minutes",
            },
            "alarm-002": {
                "root_cause": "RDS PostgreSQL instance running full table scans due to missing index on orders.customer_id after schema migration.",
                "confidence": 0.87,
                "impact": "Database spend 112% above baseline. Query latency degraded. Risk of read replica lag.",
                "reasoning_steps": [
                    "Cost spike of $847.50 vs $400 baseline correlates with schema migration deployed 14 hours ago.",
                    "RDS Performance Insights shows sequential scan queries consuming 78% of DB load.",
                    "Missing index on orders.customer_id identified in slow query log — added in migration but not applied.",
                    "IOPS spike confirms full table scan pattern rather than connection pool issue.",
                ],
                "recommended_action": "escalate",
                "fix_description": "Add index: CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders(customer_id). Requires DBA approval for production schema change.",
                "related_services": ["RDS", "Cost Explorer", "CloudWatch"],
                "estimated_resolution_time": "30 minutes",
            },
            "alarm-003": {
                "root_cause": "S3 bucket prod-data-lake-exports has public-read ACL set — likely misconfigured during Terraform apply for new export pipeline.",
                "confidence": 0.95,
                "impact": "PCI-DSS and SOC2 violation. Sensitive export data potentially exposed. Immediate remediation required.",
                "reasoning_steps": [
                    "Security Hub finding: S3 bucket ACL set to public-read — confirmed via GetBucketAcl API.",
                    "Bucket contains customer export data — classified as PII under GDPR/PCI-DSS.",
                    "CloudTrail shows PutBucketAcl called 2 hours ago by terraform-ci-role during pipeline deployment.",
                    "Terraform state shows missing block_public_acls = true in S3 resource configuration.",
                    "No unauthorized access detected in S3 access logs yet — window is narrow.",
                ],
                "recommended_action": "auto_fix",
                "fix_description": "Immediately apply S3 Block Public Access settings via AWS CLI: aws s3api put-public-access-block. Then revoke public ACL. Alert security team.",
                "related_services": ["S3", "Security Hub", "CloudTrail", "IAM"],
                "estimated_resolution_time": "2 minutes",
            },
            "alarm-004": {
                "root_cause": "Lambda fn-order-processor error rate elevated due to DynamoDB throttling on orders table — insufficient provisioned capacity.",
                "confidence": 0.88,
                "impact": "12.3% of order processing requests failing. Revenue impact estimated $2,400/hour.",
                "reasoning_steps": [
                    "Lambda error rate 12.3% began 8 minutes ago — correlates with traffic surge.",
                    "CloudWatch Logs show ProvisionedThroughputExceededException from DynamoDB.",
                    "DynamoDB orders table consumed capacity at 98% — auto-scaling lag of ~5 minutes.",
                    "Exponential backoff not implemented in Lambda — errors cascade instead of retrying.",
                ],
                "recommended_action": "auto_fix",
                "fix_description": "Temporarily increase DynamoDB orders table provisioned capacity by 2x via UpdateTable API. Auto-scaling will stabilize within 5 minutes.",
                "related_services": ["Lambda", "DynamoDB", "CloudWatch"],
                "estimated_resolution_time": "6 minutes",
            },
            "alarm-005": {
                "root_cause": "EKS cluster running 3 oversized node groups (m5.4xlarge) with average utilization below 15% — right-sizing opportunity.",
                "confidence": 0.82,
                "impact": "Overspend of $340/day. No performance impact — purely cost optimization opportunity.",
                "reasoning_steps": [
                    "Cost Explorer shows $1,240 EKS compute vs $900 baseline — 38% above target.",
                    "Kubernetes metrics show node CPU utilization averaging 14.2% across 3 node groups.",
                    "Pods can be consolidated onto m5.xlarge instances with headroom to spare.",
                    "No scheduled batch jobs or traffic spikes in next 72 hours per capacity plan.",
                ],
                "recommended_action": "escalate",
                "fix_description": "Recommend right-sizing: migrate node groups from m5.4xlarge to m5.xlarge. Requires infrastructure team approval. Estimated savings: $340/day.",
                "related_services": ["EKS", "EC2", "Cost Explorer"],
                "estimated_resolution_time": "2 hours (planned maintenance)",
            },
        }

        analysis = mock_map.get(event["id"], {
            "root_cause": f"Anomaly detected in {event['service']} — {event['metric']} exceeded threshold.",
            "confidence": 0.65,
            "impact": "Service degradation detected. Scope under investigation.",
            "reasoning_steps": [
                f"Metric {event['metric']} = {event['value']} exceeds threshold {event['threshold']}.",
                "Correlating with related services for full impact assessment.",
                "Manual review recommended.",
            ],
            "recommended_action": "escalate",
            "fix_description": "Manual investigation required. Check CloudWatch dashboard for correlated metrics.",
            "related_services": [event["service"]],
            "estimated_resolution_time": "Unknown",
        })

        analysis["event_id"] = event["id"]
        analysis["model"] = "amazon.nova-pro-v1:0 (mock)"
        return analysis
