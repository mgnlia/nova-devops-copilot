# Nova DevOps Copilot — Amazon Nova AI Hackathon 2026

## Project Description

Nova DevOps Copilot is a proactive infrastructure guardian — a 4-agent agentic system powered by Amazon Nova Pro that monitors AWS infrastructure in real-time, autonomously detects cost anomalies and security drift, and executes remediation workflows with full reasoning chain visibility and human-in-the-loop approval.

The system transforms reactive DevOps into proactive self-healing infrastructure by combining CloudWatch metrics, Cost Explorer anomalies, and Security Hub findings into a single reasoning pass — something no existing AWS tool does today.

## How It Works

1. **Monitor Agent** continuously polls CloudWatch, Cost Explorer, and Security Hub for anomalies
2. **Reason Agent** uses Amazon Nova Pro to synthesize cross-service signals, classify severity, and score confidence (0–1)
3. **Act Agent** executes remediation playbooks for high-confidence issues (EC2 right-sizing, S3 policy revocation, resource tagging)
4. **Escalate Agent** routes low-confidence issues to a HITL dashboard where humans approve or reject with one click

Every decision is logged with its full reasoning chain — making the system auditable, explainable, and trustworthy.

## Tech Stack

- **Amazon Nova Pro** via Amazon Bedrock Runtime — core reasoning engine
- **AWS Strands SDK** — agent orchestration and lifecycle management
- **Python 3.11+ / uv** — backend runtime and dependency management
- **FastAPI** — REST API server
- **Next.js 14** (App Router) — real-time dashboard frontend
- **Vercel** — frontend deployment
- **AWS CloudWatch, Cost Explorer, Security Hub** — data sources (pre-seeded mock data for demo)

## Amazon Nova Usage

Nova Pro is the reasoning backbone of the system:
- **Cross-service synthesis**: Nova Pro receives CloudWatch metrics + Cost Explorer anomalies + Security Hub findings in a single prompt and produces a unified analysis
- **Confidence scoring**: Nova Pro outputs a 0–1 confidence score with natural language justification for each detected issue
- **Remediation planning**: Nova Pro selects and parameterizes the appropriate playbook based on the issue type and severity
- **Chain-of-thought visibility**: Every reasoning step is captured and displayed in the dashboard

## Demo Video

📹 [Demo video placeholder — will be recorded before submission]

## DevOps Guru Differentiation

This is NOT a clone of AWS DevOps Guru. Here's why:

### 1. Full Reasoning Transparency
DevOps Guru uses black-box ML models — you get an alert but no explanation of *why*. Nova DevOps Copilot shows the complete chain-of-thought from Nova Pro in the dashboard. Every decision is auditable.

### 2. Cross-Service Synthesis
DevOps Guru analyzes services in silos. Nova DevOps Copilot feeds CloudWatch + Cost Explorer + Security Hub data into a single Nova Pro reasoning pass, enabling correlations like "this cost spike is caused by that security misconfiguration."

### 3. Human-in-the-Loop Approval
DevOps Guru has no approval workflow — it either alerts or doesn't. Nova DevOps Copilot scores confidence 0–1 and routes low-confidence issues to a dashboard where humans approve or reject remediation with one click.

### 4. Customizable Playbooks
DevOps Guru offers fixed recommendations. Nova DevOps Copilot executes user-defined remediation playbooks that can be extended for any AWS service.

### 5. Agentic Architecture
DevOps Guru is a monolithic service. Nova DevOps Copilot is a composable 4-agent pipeline built on AWS Strands SDK — each agent is independently testable, replaceable, and extensible.

## Links

- **GitHub**: https://github.com/mgnlia/nova-devops-copilot
- **Live Demo**: https://nova-devops-copilot.vercel.app
- **License**: MIT

## Team

Built for the Amazon Nova AI Hackathon 2026 — Track 1: Agentic AI
