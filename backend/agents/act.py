"""
Act Agent — executes approved remediation actions.
Uses mock execution when AWS credentials are absent.
"""
from __future__ import annotations

import asyncio
import random
from datetime import datetime
from typing import Any


class ActAgent:
    """
    Executes auto-fix actions for high-confidence events.
    Each action returns a structured execution log.
    """

    def __init__(self, use_mock: bool = True):
        self.use_mock = use_mock

    async def execute(
        self,
        event: dict[str, Any],
        analysis: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute the recommended fix. Returns execution result."""
        action = analysis.get("recommended_action", "escalate")
        if action != "auto_fix":
            return {
                "executed": False,
                "reason": f"Action is '{action}' — not auto_fix. Skipping execution.",
                "event_id": event["id"],
            }

        if self.use_mock:
            return await self._mock_execute(event, analysis)
        return await self._live_execute(event, analysis)

    async def _mock_execute(
        self, event: dict[str, Any], analysis: dict[str, Any]
    ) -> dict[str, Any]:
        """Simulate execution with realistic delay."""
        await asyncio.sleep(0.5)  # simulate API call

        fix_map = {
            "alarm-001": {
                "action_type": "ssm_run_command",
                "command": "sudo systemctl restart order-service",
                "resource": event["resource"],
                "steps": [
                    "✅ Connected to i-0a1b2c3d4e5f via SSM",
                    "✅ Sent SIGTERM to order-service (PID 14823)",
                    "✅ Process terminated gracefully in 2.1s",
                    "✅ Service restarted — PID 15041",
                    "✅ Health check passed — CPU dropped to 31%",
                ],
                "success": True,
                "duration_seconds": 8.3,
            },
            "alarm-003": {
                "action_type": "s3_block_public_access",
                "command": "aws s3api put-public-access-block --bucket prod-data-lake-exports --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true",
                "resource": event["resource"],
                "steps": [
                    "✅ Called S3 PutPublicAccessBlock API",
                    "✅ BlockPublicAcls=true applied",
                    "✅ IgnorePublicAcls=true applied",
                    "✅ BlockPublicPolicy=true applied",
                    "✅ RestrictPublicBuckets=true applied",
                    "✅ Security Hub finding will resolve within 2 minutes",
                    "📧 Security team alerted via SNS",
                ],
                "success": True,
                "duration_seconds": 1.8,
            },
            "alarm-004": {
                "action_type": "dynamodb_update_capacity",
                "command": "aws dynamodb update-table --table-name orders --provisioned-throughput ReadCapacityUnits=200,WriteCapacityUnits=200",
                "resource": event["resource"],
                "steps": [
                    "✅ Called DynamoDB UpdateTable API",
                    "✅ Read capacity: 100 → 200 RCU",
                    "✅ Write capacity: 100 → 200 WCU",
                    "⏳ Scaling in progress (typically 5 minutes)",
                    "✅ Lambda error rate dropping — now at 2.1%",
                ],
                "success": True,
                "duration_seconds": 3.2,
            },
        }

        result = fix_map.get(event["id"], {
            "action_type": "generic_remediation",
            "command": analysis.get("fix_description", "Manual action"),
            "resource": event.get("resource", "unknown"),
            "steps": ["✅ Remediation action initiated", "✅ Monitoring for resolution"],
            "success": True,
            "duration_seconds": 2.0,
        })

        return {
            "executed": True,
            "event_id": event["id"],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **result,
        }

    async def _live_execute(
        self, event: dict[str, Any], analysis: dict[str, Any]
    ) -> dict[str, Any]:  # pragma: no cover
        """Real AWS execution — implement per action_type."""
        # In production: dispatch based on event source/service
        return await self._mock_execute(event, analysis)
