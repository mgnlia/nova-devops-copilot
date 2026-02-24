const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface InfraEvent {
  id: string;
  source: "cloudwatch" | "cost_explorer" | "security_hub";
  severity: "critical" | "high" | "medium" | "low";
  service: string;
  metric: string;
  value: number;
  threshold: number;
  region: string;
  resource: string;
  message: string;
  timestamp: string;
}

export interface Analysis {
  root_cause: string;
  confidence: number;
  impact: string;
  reasoning_steps: string[];
  recommended_action: "auto_fix" | "escalate" | "monitor";
  fix_description: string;
  related_services: string[];
  estimated_resolution_time: string;
}

export interface PipelineResult {
  event: InfraEvent;
  analysis: Analysis;
  action_taken: string;
  execution: Record<string, unknown> | null;
  escalation: Record<string, unknown> | null;
}

export interface PipelineRun {
  run_id: string;
  started_at: string;
  completed_at: string;
  events_processed: number;
  auto_fixed: number;
  escalated: number;
  results: PipelineResult[];
}

export interface DashboardSummary {
  total_events: number;
  severity_breakdown: Record<string, number>;
  source_breakdown: Record<string, number>;
  pending_escalations: number;
  total_pipeline_runs: number;
  last_run: string | null;
  model: string;
  mode: string;
}

export interface Escalation {
  id: string;
  event: InfraEvent;
  analysis: Analysis;
  status: "pending" | "approved" | "rejected" | "deferred";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution: string | null;
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  summary: () => apiFetch<DashboardSummary>("/dashboard/summary"),
  events: () => apiFetch<{ events: InfraEvent[]; count: number }>("/events"),
  runPipeline: () => apiFetch<PipelineRun>("/pipeline/run", { method: "POST" }),
  runs: () => apiFetch<{ runs: PipelineRun[]; count: number }>("/pipeline/runs"),
  escalations: () => apiFetch<{ escalations: Escalation[]; count: number }>("/escalations"),
  resolveEscalation: (id: string, resolution: string, resolved_by = "operator") =>
    apiFetch(`/escalations/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution, resolved_by }),
    }),
  health: () => apiFetch<{ ok: boolean }>("/health"),
};

// Legacy export for backward compat
export const runPipelineWithFallback = api.runPipeline;
