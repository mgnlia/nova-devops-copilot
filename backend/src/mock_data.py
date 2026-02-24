"""Mock AWS DevOps alerts and metrics for demo purposes."""

from datetime import datetime, timedelta
import random

MOCK_ALERTS = [
    {
        "id": "alert-001",
        "title": "Lambda function error rate spike — 45% errors in prod",
        "severity": "critical",
        "service": "AWS Lambda",
        "region": "us-east-1",
        "account": "123456789012",
        "timestamp": (datetime.utcnow() - timedelta(minutes=3)).isoformat(),
        "details": "Function: payment-processor | Error rate: 45.2% (threshold: 5%) | Invocations: 1,240/min | Duration p99: 28,400ms | Memory: 512MB | Runtime: python3.11",
        "cloudwatch_url": "https://console.aws.amazon.com/cloudwatch/",
        "tags": {"env": "prod", "team": "payments", "cost-center": "cc-0042"},
    },
    {
        "id": "alert-002",
        "title": "RDS CPU utilization at 94% — query performance degraded",
        "severity": "high",
        "service": "Amazon RDS",
        "region": "us-east-1",
        "account": "123456789012",
        "timestamp": (datetime.utcnow() - timedelta(minutes=7)).isoformat(),
        "details": "Instance: db-prod-primary | CPU: 94% | Connections: 498/500 | Read IOPS: 12,400 | Write IOPS: 8,200 | Free storage: 12GB | Engine: PostgreSQL 15.4",
        "cloudwatch_url": "https://console.aws.amazon.com/cloudwatch/",
        "tags": {"env": "prod", "team": "platform", "cost-center": "cc-0011"},
    },
    {
        "id": "alert-003",
        "title": "ECS service unhealthy — 3/5 tasks failing health checks",
        "severity": "high",
        "service": "Amazon ECS",
        "region": "us-west-2",
        "account": "123456789012",
        "timestamp": (datetime.utcnow() - timedelta(minutes=12)).isoformat(),
        "details": "Cluster: prod-cluster | Service: api-gateway-svc | Running: 2/5 | Health check: /health returning 503 | Last deployment: 22 minutes ago | Image: api-gateway:v2.4.1",
        "cloudwatch_url": "https://console.aws.amazon.com/cloudwatch/",
        "tags": {"env": "prod", "team": "api", "cost-center": "cc-0033"},
    },
    {
        "id": "alert-004",
        "title": "S3 bucket policy misconfiguration — public access detected",
        "severity": "critical",
        "service": "Amazon S3",
        "region": "us-east-1",
        "account": "123456789012",
        "timestamp": (datetime.utcnow() - timedelta(minutes=1)).isoformat(),
        "details": "Bucket: prod-user-uploads-2024 | Issue: Block Public Access disabled | ACL: public-read on 3 objects | Last modified: 8 minutes ago | Size: 2.4TB | Objects: 1.2M",
        "cloudwatch_url": "https://console.aws.amazon.com/cloudwatch/",
        "tags": {"env": "prod", "team": "security", "cost-center": "cc-0099"},
    },
    {
        "id": "alert-005",
        "title": "EC2 cost anomaly — $8,400 unexpected spend in 24h",
        "severity": "medium",
        "service": "AWS Cost Explorer",
        "region": "us-east-1",
        "account": "123456789012",
        "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "details": "Service: EC2 | Anomaly: +340% vs 30-day baseline | Estimated overage: $8,400 | Instance type: p3.8xlarge (x12 running) | Started: ~26h ago | Team tag: ml-experiments",
        "cloudwatch_url": "https://console.aws.amazon.com/cloudwatch/",
        "tags": {"env": "dev", "team": "ml-experiments", "cost-center": "cc-0077"},
    },
]

MOCK_METRICS = {
    "lambda_error_rate": [
        {"time": (datetime.utcnow() - timedelta(minutes=i)).isoformat(), "value": max(0, 45 - i * 0.5 + (i % 3) * 2)}
        for i in range(30, 0, -1)
    ],
    "rds_cpu": [
        {"time": (datetime.utcnow() - timedelta(minutes=i)).isoformat(), "value": min(100, 60 + i * 1.2 + (i % 4) * 3)}
        for i in range(30, 0, -1)
    ],
    "ecs_healthy_tasks": [
        {"time": (datetime.utcnow() - timedelta(minutes=i)).isoformat(), "value": 5 if i > 22 else max(2, 5 - (22 - i) // 5)}
        for i in range(30, 0, -1)
    ],
    "cost_daily": [
        {"date": (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"), "value": 2400 + (30 - i) * 50 + (i % 7) * 200}
        for i in range(30, 0, -1)
    ],
}
