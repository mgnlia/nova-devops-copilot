/**
 * API client for Nova DevOps Copilot backend.
 *
 * NEXT_PUBLIC_API_URL must point to the deployed backend (Railway).
 * Routes match backend main.py exactly — no /api/ prefix.
 * Types match backend agent field names exactly.
 */

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/** True only when the env var is explicitly set to a non-empty string. */
export const API_CONFIGURED = API_BASE.length > 0;

// ─── Types — aligned to backend agent response shapes ─────────────────────────

export type PipelineMode = "live" | "mock";

/** A single infrastructure event from MonitorAgent */
export interface Event {
  id: string;
  source: string;
  severity: string;
  service: string;
  metric: string;
  value: number;
  threshold: number;
  region: string;
  resource: string;
  message: string;
  timestamp: string;
}

/** ReasonAgent analysis of one event — matches reason.py response */
export interface Analysis {
  event_id: string;
  root_cause: string;
  confidence: number;           // 0.0–1.0 (NOT confidence_score)
  impact: string;
  reasoning_steps: string[];    // array of step strings (NOT reasoning_chain)
  recommended_action: "auto_fix" | "escalate" | "monitor";
  fix_description: string;
  related_services: string[];
  estimated_resolution_time: string;
  model: string;
}

/** One result entry inside a pipeline run — matches main.py run_pipeline() */
export interface PipelineResultEntry {
  event: Event;
  analysis: Analysis;
  action_taken: string;
  execution: Record<string, unknown> | null;
  escalation: Record<string, unknown> | null;
}

/** Full pipeline run — matches /pipeline/run POST response */
export interface PipelineRun {
  run_id: string;
  started_at: string;
  completed_at: string;
  events_processed: number;
  auto_fixed: number;
  escalated: number;
  results: PipelineResultEntry[];
}

/** /dashboard/summary response — matches main.py dashboard_summary() */
export interface DashboardData {
  total_events: number;
  severity_breakdown: Record<string, number>;
  source_breakdown: Record<string, number>;
  pending_escalations: number;
  total_pipeline_runs: number;
  last_run: string | null;
  model: string;
  mode: PipelineMode;
}

/** Escalation record from EscalateAgent — matches escalate.py */
export interface Escalation {
  escalation_id: string;        // "esc-alarm-001" etc
  event_id: string;
  event: Event;
  analysis: Analysis;
  status: "pending" | "resolved";
  created_at: string;
  resolved_at: string | null;
  resolution: string | null;
  resolved_by: string | null;
}

export interface HealthData {
  ok: boolean;
  timestamp: string;
}

// Legacy type aliases — keep for components that import old names
/** @deprecated Use DashboardData */
export type DashboardSummary = DashboardData;
/** @deprecated Use PipelineRun */
export type PipelineResult = PipelineRun;

// ─── Client ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_CONFIGURED) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured. Set it in Vercel environment variables."
    );
  }

  const url = `${API_BASE}${path}`;

  // 10-second timeout — handles Railway cold-start delays gracefully
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status} at ${path}: ${text.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out after 10s — backend may be cold-starting, please retry");
    }
    throw err;
  }
}

export const api = {
  /** GET /health */
  health: () => apiFetch<HealthData>("/health"),

  /** GET /dashboard/summary */
  dashboard: () => apiFetch<DashboardData>("/dashboard/summary"),

  /** Alias used by page.tsx */
  summary: () => apiFetch<DashboardData>("/dashboard/summary"),

  /** POST /pipeline/run — executes Monitor→Reason→Act→Escalate */
  runPipeline: () => apiFetch<PipelineRun>("/pipeline/run", { method: "POST" }),

  /** GET /pipeline/runs — recent run history */
  pipelineRuns: () => apiFetch<{ runs: PipelineRun[]; count: number }>("/pipeline/runs"),

  /** GET /escalations — pending HITL queue */
  escalations: () => apiFetch<{ escalations: Escalation[]; count: number }>("/escalations"),

  /** POST /escalations/{id}/resolve */
  resolveEscalation: (
    id: string,
    resolution: "approved" | "rejected" | "deferred",
    resolvedBy = "operator"
  ) =>
    apiFetch(`/escalations/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution, resolved_by: resolvedBy }),
    }),

  /** GET /events */
  events: () => apiFetch<{ events: Event[]; count: number }>("/events"),
};

// Legacy export
export const runPipelineWithFallback = api.runPipeline;
