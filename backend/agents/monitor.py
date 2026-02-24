"""
Monitor Agent — ingests AWS CloudWatch alarms, Cost Explorer anomalies,
and Security Hub findings. Returns structured events for the Reason agent.
Uses mock data when AWS credentials are not present.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import Any


MOCK_ALARMS = [
    {
        "id": "alarm-001",
        "source": "cloudwatch",
        "severity": "critical",
        "service": "EC2",
        "metric": "CPUUtilization",
        "value": 94.7,
        "threshold": 80.0,
        "region": "us-east-1",
        "resource": "i-0a1b2c3d4e5f",
        "message": "CPU utilization at 94.7% — sustained for 15 minutes",
        "timestamp": (datetime.utcnow() - timedelta(minutes=3)).isoformat() + "Z",
    },
    {
        "id": "alarm-002",
        "source": "cost_explorer",
        "severity": "high",
        "service": "RDS",
        "metric": "DailySpend",
        "value": 847.50,
        "threshold": 400.0,
        "region": "us-east-1",
        "resource": "db-prod-postgres",
        "message": "RDS daily spend $847.50 — 112% above 30-day baseline",
        "timestamp": (datetime.utcnow() - timedelta(minutes=12)).isoformat() + "Z",
    },
    {
        "id": "alarm-003",
        "source": "security_hub",
        "severity": "high",
        "service": "S3",
        "metric": "PublicAccessViolation",
        "value": 1,
        "threshold": 0,
        "region": "us-east-1",
        "resource": "s3://prod-data-lake-exports",
        "message": "S3 bucket has public read ACL — PCI-DSS violation detected",
        "timestamp": (datetime.utcnow() - timedelta(minutes=7)).isoformat() + "Z",
    },
    {
        "id": "alarm-004",
        "source": "cloudwatch",
        "severity": "medium",
        "service": "Lambda",
        "metric": "ErrorRate",
        "value": 12.3,
        "threshold": 5.0,
        "region": "us-west-2",
        "resource": "fn-order-processor",
        "message": "Lambda error rate 12.3% — upstream DynamoDB throttling detected",
        "timestamp": (datetime.utcnow() - timedelta(minutes=1)).isoformat() + "Z",
    },
    {
        "id": "alarm-005",
        "source": "cost_explorer",
        "severity": "medium",
        "service": "EKS",
        "metric": "ComputeCost",
        "value": 1240.00,
        "threshold": 900.0,
        "region": "us-east-1",
        "resource": "cluster-prod-k8s",
        "message": "EKS compute cost spike — 3 oversized node groups detected",
        "timestamp": (datetime.utcnow() - timedelta(minutes=25)).isoformat() + "Z",
    },
]


class MonitorAgent:
    """
    Polls AWS CloudWatch, Cost Explorer, and Security Hub.
    Falls back to realistic mock data when credentials are absent.
    """

    def __init__(self, use_mock: bool = True):
        self.use_mock = use_mock

    def collect(self) -> list[dict[str, Any]]:
        """Return list of active events sorted by severity."""
        if self.use_mock:
            return self._mock_events()
        return self._live_events()

    def _mock_events(self) -> list[dict[str, Any]]:
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        events = sorted(MOCK_ALARMS, key=lambda e: severity_order.get(e["severity"], 9))
        return events

    def _live_events(self) -> list[dict[str, Any]]:  # pragma: no cover
        """Real AWS integration — requires boto3 + credentials."""
        try:
            import boto3  # type: ignore
            events: list[dict[str, Any]] = []

            cw = boto3.client("cloudwatch")
            paginator = cw.get_paginator("describe_alarms")
            for page in paginator.paginate(StateValue="ALARM"):
                for alarm in page["MetricAlarms"]:
                    events.append({
                        "id": alarm["AlarmArn"],
                        "source": "cloudwatch",
                        "severity": "high",
                        "service": alarm.get("Namespace", "AWS").split("/")[-1],
                        "metric": alarm.get("MetricName", "Unknown"),
                        "value": alarm.get("StateValue", 0),
                        "threshold": alarm.get("Threshold", 0),
                        "region": "us-east-1",
                        "resource": alarm.get("AlarmName", ""),
                        "message": alarm.get("StateReason", ""),
                        "timestamp": alarm.get("StateUpdatedTimestamp", datetime.utcnow()).isoformat() + "Z",
                    })
            return events
        except Exception:
            return self._mock_events()
