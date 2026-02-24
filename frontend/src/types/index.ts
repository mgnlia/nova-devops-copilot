// Types re-exported from lib/api for backward compat
export type { InfraEvent, Analysis, PipelineResult, PipelineRun, DashboardSummary, Escalation } from "@/lib/api";

// Agent result type used by pipeline components
export interface AgentResult {
  status: "pending" | "running" | "done" | "error";
  output?: string;
  error?: string;
}

// Agent configuration for pipeline display
export interface AgentConfig {
  name: string;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    name: "planner",
    label: "PlannerAgent",
    emoji: "🗺️",
    description: "Breaks your request into ordered DevOps steps",
    color: "blue",
  },
  {
    name: "coder",
    label: "CodeAgent",
    emoji: "⚙️",
    description: "Generates Terraform HCL + GitHub Actions YAML",
    color: "purple",
  },
  {
    name: "reviewer",
    label: "ReviewAgent",
    emoji: "🔒",
    description: "Security audit & best practices review",
    color: "green",
  },
  {
    name: "explainer",
    label: "ExplainerAgent",
    emoji: "📖",
    description: "Plain-English explanation for your team",
    color: "orange",
  },
];
