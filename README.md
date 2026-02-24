# 🚀 Nova DevOps Copilot

> **Amazon Nova AI Hackathon submission** — 4-agent DevOps pipeline assistant powered by [Amazon Nova](https://aws.amazon.com/ai/nova/) via AWS Bedrock.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://nova-devops-copilot.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Railway-purple?logo=railway)](https://nova-devops-copilot-backend.up.railway.app)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Model](https://img.shields.io/badge/Model-amazon.nova--pro--v1%3A0-orange?logo=amazon-aws)](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)

---

## 🎬 Demo Video

**3-Minute Walkthrough:**

1. **[0:00–0:30]** — Open the live demo. The UI shows 4 agent cards: PlannerAgent 🗺️ → CodeAgent ⚙️ → ReviewAgent 🔒 → ExplainerAgent 📖
2. **[0:30–1:00]** — Type: *"Deploy my Node.js app to AWS ECS with Fargate, ALB, and auto-scaling"* and hit **Run Pipeline**
3. **[1:00–1:45]** — Watch the pipeline execute in real-time via SSE streaming:
   - PlannerAgent breaks the request into 8 ordered steps
   - CodeAgent generates Terraform HCL + GitHub Actions YAML
   - ReviewAgent scores the code 9/10 with security recommendations
   - ExplainerAgent writes a plain-English walkthrough
4. **[1:45–2:15]** — Try a second example: *"Create a serverless API with Lambda and API Gateway"*
5. **[2:15–3:00]** — Show the backend `/docs` (FastAPI Swagger), explain the Nova Bedrock integration, and the 4-agent architecture

---

## ✨ What It Does

Nova DevOps Copilot turns a plain-English DevOps request into a complete, reviewed, and explained infrastructure plan — in seconds.

```
User: "Deploy my app to ECS"
         ↓
🗺️  PlannerAgent  →  8-step ordered DevOps plan
         ↓
⚙️  CodeAgent     →  Terraform IaC + GitHub Actions CI/CD
         ↓
🔒  ReviewAgent   →  Security audit + best practices (scored /10)
         ↓
📖  ExplainerAgent →  Plain-English explanation for your team
```

### Why 4 Agents?

Each agent is a specialist with a focused system prompt and a single responsibility. This mirrors how real DevOps teams work: architect → engineer → security reviewer → tech writer. Chaining them produces output that's better than any single prompt could achieve.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                   │
│              (Vercel · TypeScript · Tailwind)            │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Planner  │→ │  Coder   │→ │ Reviewer │→ │Explain │  │
│  │  Card    │  │  Card    │  │  Card    │  │  Card  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │ SSE streaming / REST
┌───────────────────────▼─────────────────────────────────┐
│                   FastAPI Backend                        │
│                  (Railway · Python · uv)                 │
│                                                          │
│  PlannerAgent → CodeAgent → ReviewAgent → ExplainerAgent │
└───────────────────────┬─────────────────────────────────┘
                        │ boto3 / bedrock-runtime
┌───────────────────────▼─────────────────────────────────┐
│              AWS Bedrock                                 │
│         amazon.nova-pro-v1:0                             │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend
cp .env.example .env  # Add your AWS credentials
uv run uvicorn app.main:app --reload --port 8000
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
| `USE_MOCK` | Use mock responses (no AWS needed) | `true` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend URL | Railway URL |

---

## 🤖 The 4 Agents

### 🗺️ PlannerAgent
**System prompt:** Senior DevOps architect. Takes a user request and produces an ordered, numbered list of concrete steps with AWS service recommendations.

### ⚙️ CodeAgent
**System prompt:** IaC engineer. Takes the plan and generates production-ready Terraform HCL + GitHub Actions YAML. Follows security best practices by default (immutable tags, private subnets, OIDC auth).

### 🔒 ReviewAgent
**System prompt:** Cloud security expert. Reviews generated code for hardcoded secrets, over-permissive IAM, missing logging, and provides a scored security report.

### 📖 ExplainerAgent
**System prompt:** Technical writer. Translates the entire pipeline into plain English with analogies, flow diagrams, and actionable next steps.

---

## 📡 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check |
| `/pipeline` | POST | Run full 4-agent pipeline (sync) |
| `/pipeline/stream` | POST | Run pipeline with SSE streaming |
| `/agents/planner` | POST | Run PlannerAgent only |
| `/agents/coder` | POST | Run PlannerAgent + CodeAgent |
| `/agents/reviewer` | POST | Run first 3 agents |
| `/agents/explainer` | POST | Run all 4 agents |

**Request body:**
```json
{ "request": "Deploy my app to ECS" }
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| AI Model | Amazon Nova Pro (`amazon.nova-pro-v1:0`) via AWS Bedrock |
| Backend | Python 3.11, FastAPI, uv, boto3 |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Streaming | Server-Sent Events (SSE) |
| Deploy (FE) | Vercel |
| Deploy (BE) | Railway |
| IaC (generated) | Terraform, GitHub Actions |

---

## 📝 Mock Mode

When `USE_MOCK=true` (default) or AWS credentials are unavailable, the backend returns realistic pre-generated responses for each agent. This lets you demo the full pipeline without AWS credentials.

To use live Amazon Nova:
1. Set `USE_MOCK=false` in `.env`
2. Add valid `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
3. Ensure your IAM user has `bedrock:InvokeModel` permission for `amazon.nova-pro-v1:0`

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

*Built with ❤️ for the Amazon Nova AI Hackathon — $40K cash + $55K AWS credits prize pool*
