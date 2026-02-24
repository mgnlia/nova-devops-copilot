"""Configuration and environment loading."""
import os
from dotenv import load_dotenv

load_dotenv()

# AWS
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

# Nova Pro model ID via Bedrock
NOVA_PRO_MODEL_ID = os.getenv("NOVA_PRO_MODEL_ID", "us.amazon.nova-pro-v1:0")

# Demo / sandbox mode — uses pre-seeded data instead of live AWS calls
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

# Confidence threshold for auto-remediation (below this → HITL)
AUTO_REMEDIATE_THRESHOLD = float(os.getenv("AUTO_REMEDIATE_THRESHOLD", "0.85"))
