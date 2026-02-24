"""
Pre-seeded sandbox data for demo mode.
Simulates realistic AWS infrastructure signals without live credentials.
"""
from datetime import datetime, timezone, timedelta

_now = datetime.now(timezone.utc)

# ── CloudWatch Metrics ────────────────────────────────────────────────────────
CLOUDWATCH_METRICS = [
    {
        "resource_id": "i-0abc123def456",
        "resource_type": "EC2",
        "metric": "CPUUtilization",
        "value": 3.2,
        "unit": "Percent",
        "timestamp": (_now - timedelta(minutes=5)).isoformat(),
        "anomaly": False,
    },
    {
        "resource_id": "i-0deadbeef999",
        "resource_type": "EC2",
        "metric": "CPUUtilization",
        "value": 1.1,
        "unit": "Percent",
        "timestamp": (_now - timedelta(minutes=5)).isoformat(),
        "anomaly": True,
        "anomaly_reason": "m5.2xlarge instance averaging <2% CPU for 7 days — severely over-provisioned",
    },
    {
        "resource_id": "rds-prod-db-01",
        "resource_type": "RDS",
        "metric": "DatabaseConnections",
        "value": 412,
        "unit": "Count",
        "timestamp": (_now - timedelta(minutes=3)).isoformat(),
        "anomaly": True,
        "anomaly_reason": "Connection count 3.4× above 30-day baseline (121 avg) — possible connection leak",
    },
]

# ── Cost Explorer ─────────────────────────────────────────────────────────────
COST_ANOMALIES = [
    {
        "service": "Amazon EC2",
        "account_id": "123456789012",
        "date": (_now - timedelta(days=1)).strftime("%Y-%m-%d"),
        "expected_cost_usd": 48.20,
        "actual_cost_usd": 214.77,
        "delta_pct": 345.6,
        "anomaly_id": "cost-anom-001",
        "root_cause_hint": "i-0deadbeef999 (m5.2xlarge) running 24/7 at <2% CPU — idle zombie instance",
    },
    {
        "service": "Amazon S3",
        "account_id": "123456789012",
        "date": (_now - timedelta(days=2)).strftime("%Y-%m-%d"),
        "expected_cost_usd": 5.10,
        "actual_cost_usd": 9.80,
        "delta_pct": 92.2,
        "anomaly_id": "cost-anom-002",
        "root_cause_hint": "Egress spike from bucket prod-assets — possibly public policy allowing external reads",
    },
]

# ── Security Hub Findings ─────────────────────────────────────────────────────
SECURITY_FINDINGS = [
    {
        "finding_id": "sec-find-001",
        "resource_id": "arn:aws:s3:::prod-assets",
        "resource_type": "S3Bucket",
        "title": "S3 bucket has public read access enabled",
        "severity": "HIGH",
        "compliance_status": "FAILED",
        "standard": "AWS Foundational Security Best Practices",
        "control_id": "S3.2",
        "remediation_url": "https://docs.aws.amazon.com/securityhub/latest/userguide/s3-controls.html#s3-2",
        "first_observed": (_now - timedelta(hours=6)).isoformat(),
    },
    {
        "finding_id": "sec-find-002",
        "resource_id": "arn:aws:ec2:us-east-1:123456789012:security-group/sg-0ff1ce",
        "resource_type": "SecurityGroup",
        "title": "Security group allows unrestricted SSH (0.0.0.0/0 port 22)",
        "severity": "CRITICAL",
        "compliance_status": "FAILED",
        "standard": "CIS AWS Foundations Benchmark",
        "control_id": "4.1",
        "remediation_url": "https://docs.aws.amazon.com/securityhub/latest/userguide/ec2-controls.html",
        "first_observed": (_now - timedelta(hours=2)).isoformat(),
    },
    {
        "finding_id": "sec-find-003",
        "resource_id": "arn:aws:ec2:us-east-1:123456789012:instance/i-0deadbeef999",
        "resource_type": "EC2Instance",
        "title": "EC2 instance missing required cost-center and owner tags",
        "severity": "MEDIUM",
        "compliance_status": "FAILED",
        "standard": "Internal Tagging Policy",
        "control_id": "TAG.1",
        "remediation_url": "",
        "first_observed": (_now - timedelta(days=3)).isoformat(),
    },
]

# ── Resource inventory (for remediation context) ──────────────────────────────
EC2_INSTANCES = [
    {
        "instance_id": "i-0abc123def456",
        "instance_type": "t3.medium",
        "state": "running",
        "name": "web-server-prod-01",
        "tags": {"Name": "web-server-prod-01", "Env": "prod", "Owner": "platform-team"},
        "avg_cpu_7d": 34.5,
    },
    {
        "instance_id": "i-0deadbeef999",
        "instance_type": "m5.2xlarge",
        "state": "running",
        "name": "analytics-worker-01",
        "tags": {},
        "avg_cpu_7d": 1.1,
        "recommended_type": "t3.small",
        "monthly_savings_usd": 166.57,
    },
]

S3_BUCKETS = [
    {
        "bucket_name": "prod-assets",
        "region": "us-east-1",
        "public_access_blocked": False,
        "acl": "public-read",
        "versioning": "Enabled",
        "size_gb": 42.3,
    },
    {
        "bucket_name": "internal-logs",
        "region": "us-east-1",
        "public_access_blocked": True,
        "acl": "private",
        "versioning": "Enabled",
        "size_gb": 8.1,
    },
]
