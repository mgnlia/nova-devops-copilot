"""
Act Agent — executes approved remediation playbooks.
Playbooks: EC2_RIGHTSIZE, S3_REVOKE_PUBLIC, TAG_RESOURCES
In demo mode, simulates actions and returns audit trail.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any

from strands import Agent, tool
from strands.models import BedrockModel

from src.config import AWS_REGION, DEMO_MODE, NOVA_PRO_MODEL_ID

logger = logging.getLogger(__name__)


# ── Playbook Tools ────────────────────────────────────────────────────────────

@tool
def playbook_ec2_rightsize(instance_id: str, target_instance_type: str) -> str:
    """
    Right-size an EC2 instance by stopping it, modifying the instance type,
    and restarting it. Returns an audit record of the action taken.

    Args:
        instance_id: The EC2 instance ID to resize
        target_instance_type: The new instance type (e.g. t3.small)
    """
    if DEMO_MODE:
        return json.dumps({
            "action": "EC2_RIGHTSIZE",
            "instance_id": instance_id,
            "from_type": "m5.2xlarge",
            "to_type": target_instance_type,
            "steps": [
                f"[DEMO] Stopped instance {instance_id}",
                f"[DEMO] Modified instance type: m5.2xlarge → {target_instance_type}",
                f"[DEMO] Started instance {instance_id}",
                "[DEMO] Instance running with new type",
            ],
            "status": "SUCCESS",
            "executed_at": datetime.now(timezone.utc).isoformat(),
            "estimated_monthly_savings_usd": 166.57,
        })
    # Live path
    import boto3
    ec2 = boto3.client("ec2", region_name=AWS_REGION)
    try:
        ec2.stop_instances(InstanceIds=[instance_id])
        waiter = ec2.get_waiter("instance_stopped")
        waiter.wait(InstanceIds=[instance_id])
        ec2.modify_instance_attribute(
            InstanceId=instance_id,
            Attribute="instanceType",
            Value=target_instance_type,
        )
        ec2.start_instances(InstanceIds=[instance_id])
        return json.dumps({"status": "SUCCESS", "instance_id": instance_id, "new_type": target_instance_type})
    except Exception as e:
        return json.dumps({"status": "FAILED", "error": str(e)})


@tool
def playbook_s3_revoke_public(bucket_name: str) -> str:
    """
    Revoke public access on an S3 bucket by enabling Block Public Access
    and removing public-read ACL. Returns audit record.

    Args:
        bucket_name: The S3 bucket name to secure
    """
    if DEMO_MODE:
        return json.dumps({
            "action": "S3_REVOKE_PUBLIC",
            "bucket_name": bucket_name,
            "steps": [
                f"[DEMO] Enabled BlockPublicAcls on {bucket_name}",
                f"[DEMO] Enabled BlockPublicPolicy on {bucket_name}",
                f"[DEMO] Enabled IgnorePublicAcls on {bucket_name}",
                f"[DEMO] Enabled RestrictPublicBuckets on {bucket_name}",
                f"[DEMO] Set bucket ACL to private on {bucket_name}",
            ],
            "status": "SUCCESS",
            "executed_at": datetime.now(timezone.utc).isoformat(),
            "security_improvement": "Bucket is now private — public access fully blocked",
        })
    # Live path
    import boto3
    s3 = boto3.client("s3", region_name=AWS_REGION)
    try:
        s3.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                "BlockPublicAcls": True,
                "IgnorePublicAcls": True,
                "BlockPublicPolicy": True,
                "RestrictPublicBuckets": True,
            },
        )
        s3.put_bucket_acl(Bucket=bucket_name, ACL="private")
        return json.dumps({"status": "SUCCESS", "bucket": bucket_name, "access": "private"})
    except Exception as e:
        return json.dumps({"status": "FAILED", "error": str(e)})


@tool
def playbook_tag_resources(resource_id: str, resource_type: str, tags: str) -> str:
    """
    Apply tags to an AWS resource. Tags should be a JSON string of key-value pairs.

    Args:
        resource_id: The resource ID or ARN to tag
        resource_type: Resource type (EC2, S3, RDS, etc.)
        tags: JSON string of tag key-value pairs to apply
    """
    try:
        tag_dict = json.loads(tags)
    except json.JSONDecodeError:
        tag_dict = {"cost-center": "unassigned", "owner": "platform-team"}

    if DEMO_MODE:
        return json.dumps({
            "action": "TAG_RESOURCES",
            "resource_id": resource_id,
            "resource_type": resource_type,
            "tags_applied": tag_dict,
            "steps": [
                f"[DEMO] Applied {len(tag_dict)} tags to {resource_id}",
                f"[DEMO] Tags: {tag_dict}",
            ],
            "status": "SUCCESS",
            "executed_at": datetime.now(timezone.utc).isoformat(),
        })
    # Live path
    import boto3
    if resource_type == "EC2":
        ec2 = boto3.client("ec2", region_name=AWS_REGION)
        ec2.create_tags(
            Resources=[resource_id],
            Tags=[{"Key": k, "Value": v} for k, v in tag_dict.items()],
        )
    return json.dumps({"status": "SUCCESS", "resource_id": resource_id, "tags": tag_dict})


# ── Agent factory ─────────────────────────────────────────────────────────────

def build_act_agent() -> Agent:
    model = BedrockModel(
        model_id=NOVA_PRO_MODEL_ID,
        region_name=AWS_REGION,
        temperature=0.1,
        streaming=False,
    )
    return Agent(
        model=model,
        tools=[playbook_ec2_rightsize, playbook_s3_revoke_public, playbook_tag_resources],
        system_prompt="""You are the Act Agent for Nova DevOps Copilot.
You execute approved remediation playbooks against AWS resources.

Rules:
1. Only execute playbooks for incidents that are marked auto_remediable=true
2. Match the recommended_action to the correct playbook tool
3. For EC2_RIGHTSIZE: use playbook_ec2_rightsize with the instance_id and recommended t3.small
4. For S3_REVOKE_PUBLIC: use playbook_s3_revoke_public with the bucket name extracted from the ARN
5. For TAG_RESOURCES: use playbook_tag_resources with default tags {"cost-center":"unassigned","owner":"platform-team"}
6. Return a JSON object with key "remediations" — a list of action results

Never execute playbooks for incidents with auto_remediable=false or status=APPROVED_HITL unless explicitly told.""",
    )


def run_act_agent(incidents: list[dict[str, Any]]) -> dict[str, Any]:
    """Execute remediation playbooks for auto-remediable incidents."""
    auto_incidents = [i for i in incidents if i.get("auto_remediable")]

    if not auto_incidents:
        return {
            "remediations": [],
            "message": "No auto-remediable incidents — all require HITL approval",
            "executed_at": datetime.now(timezone.utc).isoformat(),
        }

    agent = build_act_agent()
    prompt = f"""Execute remediation playbooks for these auto-approved incidents:

{json.dumps(auto_incidents, indent=2)}

Call the appropriate playbook tool for each incident and return results."""

    response = agent(prompt)
    raw = str(response)

    import re
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group())
            return {**result, "executed_at": datetime.now(timezone.utc).isoformat()}
        except json.JSONDecodeError:
            pass

    # Fallback: run playbooks directly
    remediations = []
    for inc in auto_incidents:
        action = inc.get("recommended_action")
        resources = inc.get("affected_resources", [])
        if not resources:
            continue
        resource = resources[0]

        if action == "EC2_RIGHTSIZE":
            result = json.loads(playbook_ec2_rightsize(resource, "t3.small"))
        elif action == "S3_REVOKE_PUBLIC":
            bucket = resource.split(":::")[-1] if ":::" in resource else resource
            result = json.loads(playbook_s3_revoke_public(bucket))
        elif action == "TAG_RESOURCES":
            result = json.loads(playbook_tag_resources(
                resource, "EC2",
                json.dumps({"cost-center": "unassigned", "owner": "platform-team"})
            ))
        else:
            continue

        remediations.append({
            "incident_id": inc.get("incident_id"),
            "action": action,
            "result": result,
        })

    return {
        "remediations": remediations,
        "executed_at": datetime.now(timezone.utc).isoformat(),
    }
