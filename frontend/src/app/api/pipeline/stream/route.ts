import { NextRequest } from 'next/server'

// Mock agent responses — used when backend is unavailable
const MOCK_PLAN = `## DevOps Plan

1. **Containerize** — Write a production-ready Dockerfile with multi-stage build (builder → runner). Use a non-root user and minimal base image.
2. **ECR Repository** — Create an Amazon ECR repository to store Docker images. Enable image scanning and tag immutability.
3. **ECS Cluster** — Provision an ECS Fargate cluster. No EC2 instances to manage; AWS handles the control plane.
4. **Task Definition** — Define CPU/memory (512 CPU, 1024 MB RAM), container port mapping, CloudWatch log group, and IAM task execution role.
5. **ALB Setup** — Create an Application Load Balancer in public subnets. Add target group with health check on \`/health\`. HTTPS listener with ACM certificate.
6. **ECS Service** — Deploy the task definition as an ECS service behind the ALB target group. Minimum 2 tasks for HA.
7. **Auto-Scaling** — Configure Application Auto Scaling: scale out at 70% CPU, scale in at 30%. Min 2, max 10 tasks.
8. **CI/CD Pipeline** — GitHub Actions workflow: build → push to ECR → deploy new task definition revision → wait for service stability.`

const MOCK_CODE = `## Infrastructure as Code

### \`terraform/main.tf\`
\`\`\`hcl
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket = "my-tfstate-bucket"
    key    = "nova-app/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" { region = var.region }

# ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = var.app_name
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "\${var.app_name}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = var.app_name
    image     = "\${aws_ecr_repository.app.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 8080, protocol = "tcp" }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/\${var.app_name}"
        awslogs-region        = var.region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])
}
\`\`\`

### \`.github/workflows/deploy.yml\`
\`\`\`yaml
name: Build & Deploy to ECS

on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: nova-app

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: \${{ secrets.AWS_ROLE_ARN }}
          aws-region: \${{ env.AWS_REGION }}

      - name: Build, tag, and push image
        run: |
          docker build -t \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG .
          docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-definition.json
          service: nova-app-service
          cluster: nova-app-cluster
          wait-for-service-stability: true
\`\`\``

const MOCK_REVIEW = `## Security Review — Score: 9/10

### ✅ Passed Checks
- **No hardcoded secrets** — All credentials via OIDC/IAM roles, no static keys in code
- **IMMUTABLE image tags** — ECR tag immutability prevents image tampering
- **Image scanning enabled** — ECR scans on push for known CVEs
- **Private subnets** — ECS tasks run in private subnets, not publicly accessible
- **OIDC auth** — GitHub Actions uses OIDC (no long-lived AWS keys stored in secrets)
- **Least-privilege IAM** — Task execution role has minimal permissions
- **Container Insights** — Monitoring enabled on ECS cluster

### ⚠️ Recommendations
1. **Add WAF** — Attach AWS WAF to the ALB to block OWASP Top 10 attacks
2. **Enable VPC Flow Logs** — Critical for security incident investigation
3. **S3 State Encryption** — Ensure Terraform state bucket has SSE-S3 or SSE-KMS
4. **Secrets Manager** — Move any app secrets to AWS Secrets Manager

### 📊 Scoring Breakdown
| Category | Score |
|----------|-------|
| IAM & Auth | 10/10 |
| Network Security | 9/10 |
| Image Security | 10/10 |
| Secrets Management | 8/10 |
| Monitoring | 9/10 |
| **Overall** | **9/10** |`

const MOCK_EXPLAIN = `## Plain-English Explanation

### What We Just Built

Think of this as setting up a **self-healing, auto-scaling factory** for your app on AWS.

🏭 **ECR** = Your app's warehouse. Every time you push code, a new "product" (Docker image) gets manufactured and stored here with a unique label (immutable tag).

🚦 **ALB (Load Balancer)** = The traffic cop at the front door. It receives all incoming requests and distributes them evenly across your app instances. If one instance crashes, traffic automatically goes elsewhere.

🤖 **ECS Fargate** = Your robot workforce. Instead of managing servers yourself, AWS runs your containers. You just say "I need 2 workers" and they appear.

🔄 **GitHub Actions** = Your automated assembly line. Every time you push code to \`main\`, it automatically: builds → tests → packages → ships to production.

### What Happens When You Push Code

1. Developer pushes to \`main\` branch
2. GitHub Actions wakes up automatically
3. Your app gets packaged into a Docker container
4. Container gets uploaded to ECR (your private registry)
5. ECS gets told "use this new version"
6. ECS gradually replaces old containers with new ones (zero downtime)
7. ALB health checks confirm new containers are healthy

### Next Steps

1. **Run \`terraform init && terraform apply\`** in the \`terraform/\` directory
2. **Add \`AWS_ROLE_ARN\`** to your GitHub repository secrets
3. **Push to \`main\`** — your first automated deployment will kick off
4. **Set up a custom domain** in Route 53 pointing to the ALB DNS name`

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const request: string = body.request || 'Deploy my app'

  const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

  // Try real backend first
  if (API_URL && !API_URL.includes('localhost')) {
    try {
      const upstream = await fetch(`${API_URL}/pipeline/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request }),
        signal: AbortSignal.timeout(30000),
      })
      if (upstream.ok && upstream.body) {
        return new Response(upstream.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
          },
        })
      }
    } catch {
      // Fall through to mock
    }
  }

  // Mock SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sse = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      sse('start', { request, agents: 4, mock: true })

      const agents = [
        { name: 'PlannerAgent', output: MOCK_PLAN },
        { name: 'CodeAgent', output: MOCK_CODE },
        { name: 'ReviewAgent', output: MOCK_REVIEW },
        { name: 'ExplainerAgent', output: MOCK_EXPLAIN },
      ]

      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i]
        sse('agent_start', { agent: agent.name, index: i })
        await sleep(800 + i * 200)
        sse('agent_done', {
          agent: agent.name,
          index: i,
          output: agent.output,
          duration_ms: 800 + i * 200,
          mock: true,
        })
        await sleep(200)
      }

      sse('complete', { message: 'Pipeline complete', mock: true })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
