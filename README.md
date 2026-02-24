# 🚀 Nova DevOps Copilot

> **Amazon Nova AI Hackathon submission** — Autonomous infrastructure operations powered by [Amazon Nova Pro](https://aws.amazon.com/ai/nova/) via AWS Bedrock. A 4-agent pipeline that monitors AWS events, reasons about root causes with AI, auto-fixes high-confidence issues, and escalates the rest to a human review queue.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://frontend-delta-drab-85.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Model](https://img.shields.io/badge/Model-amazon.nova--pro--v1%3A0-orange?logo=amazon-aws)](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)

---

## ✨ What It Does

Nova DevOps Copilot ingests live AWS infrastructure events (CloudWatch alarms, Cost Explorer anomalies, Security Hub findings) and runs them through a 4-agent AI pipeline:

```
CloudWatch / Cost Explorer / Security Hub
         ↓
🔍  MonitorAgent   →  collects & structures infrastructure events
         ↓
🧠  ReasonAgent    →  Amazon Nova Pro root-cause analysis + confidence score
         ↓
    confidence ≥ 0.80?
    ┌── YES ──────────────────────────────────┐
    ↓                                         ↓
⚡  ActAgent        →  auto-remediation    🔔  EscalateAgent  →  HITL queue
    (SSM, API calls)                           (approve / reject / defer)
```

### Why this matters

Traditional DevOps alerting drowns on-call engineers in noise. Nova DevOps Copilot uses Amazon Nova Pro's reasoning capability to triage events, explain *why* something is broken, and take safe automated action — only escalating the genuinely ambiguous cases to humans.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                   │
│              (Vercel · TypeScript · Tailwind)            │
│                                                          │
│  Dashboard · Agent Pipeline · Event Cards · HITL Queue  │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────┐
│                   FastAPI Backend                        │
│                  (Railway · Python · uv)                 │
│                                                          │
│  MonitorAgent → ReasonAgent → ActAgent / EscalateAgent  │
└───────────────────────┬─────────────────────────────────┘
                        │ boto3 / bedrock-runtime Converse API
┌───────────────────────▼─────────────────────────────────┐
│              AWS Bedrock                                 │
│         amazon.nova-pro-v1:0                             │
└──────────────────────────────────────────────────────────┘
```

---

## 🤖 The 4 Agents

### 🔍 MonitorAgent
Ingests events from three AWS sources:
- **CloudWatch** — CPU, memory, error rate alarms
- **Cost Explorer** — spend anomalies vs. 30-day baseline
- **Security Hub** — misconfigurations, compliance violations

### 🧠 ReasonAgent *(Amazon Nova Pro)*
For each event, calls `amazon.nova-pro-v1:0` via the Bedrock Converse API with a structured system prompt. Returns:
- Root cause (1-2 sentences)
- Confidence score (0.0–1.0)
- Reasoning chain (step-by-step)
- Recommended action: `auto_fix` | `escalate` | `monitor`
- Estimated resolution time

### ⚡ ActAgent
Executes automated remediation for high-confidence events (≥ 0.80):
- EC2: restart via SSM Run Command
- S3: apply Block Public Access
- DynamoDB: increase provisioned capacity
- Full audit trail of every action taken

### 🔔 EscalateAgent
Queues low-confidence or high-risk events for human review. Operators can **approve**, **reject**, or **defer** each escalation from the dashboard.

---

## 🚀 Quick Start

### Backend

```bash
cd backend
cp .env.example .env  # Add your AWS credentials
uv run uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open: http://localhost:3000

---

## 🔧 Environment Variables

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | — |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | — |
| `AWS_REGION` | AWS region | `us-east-1` |
| `NOVA_MODEL_ID` | Bedrock model ID | `amazon.nova-pro-v1:0` |
| `USE_MOCK` | Use mock responses (no AWS needed) | `false` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | Vercel + localhost |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend URL | Railway URL |

---

## 📡 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info + mode |
| `/health` | GET | Health check |
| `/events` | GET | Current infrastructure events |
| `/pipeline/run` | POST | Run full 4-agent pipeline |
| `/pipeline/runs` | GET | Recent pipeline run history |
| `/dashboard/summary` | GET | Aggregated metrics |
| `/escalations` | GET | Pending HITL queue |
| `/escalations/{id}/resolve` | POST | Approve / reject / defer |
| `/analyze/{event_id}` | GET | Analyze single event |

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| AI Model | Amazon Nova Pro (`amazon.nova-pro-v1:0`) via AWS Bedrock Converse API |
| Backend | Python 3.11, FastAPI, uv, boto3 |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Deploy (FE) | Vercel |
| Deploy (BE) | Railway |

---

## 📝 Mock Mode

When `USE_MOCK=true` or AWS credentials are unavailable, the backend returns realistic pre-generated responses for all 5 sample events (EC2 CPU spike, RDS cost anomaly, S3 public exposure, Lambda throttling, EKS right-sizing). This lets you demo the full pipeline without AWS credentials.

To use live Amazon Nova:
1. Set `USE_MOCK=false` in Railway environment variables
2. Add valid `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
3. Ensure your IAM user has `bedrock:InvokeModel` permission for `amazon.nova-pro-v1:0` in `us-east-1`

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

*Built for the [Amazon Nova AI Hackathon](https://amazonnovahackathon.devpost.com) — $40K cash + $55K AWS credits prize pool*
