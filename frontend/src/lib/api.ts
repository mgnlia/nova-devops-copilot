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

/** Alias used by EventCard component */
export type PipelineResultEntry = PipelineResult;

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
  escalation_id: string;
  event_id: string;
  event: InfraEvent;
  analysis: Analysis;
  status: "pending" | "approved" | "rejected" | "deferred";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution: string | null;
}

/**
 * Fetch with a configurable timeout. Throws a user-friendly error if the
 * backend is unreachable or takes too long — prevents silent empty states.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timerId);
    return response;
  } catch (err) {
    clearTimeout(timerId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Backend not responding — request timed out after 10s. Is the API online?");
    }
    throw new Error("Cannot reach backend — check that the API server is running.");
  }
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetchWithTimeout(`${API_URL}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `API error ${res.status}: ${res.statusText}`);
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
