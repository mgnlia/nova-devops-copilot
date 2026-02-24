/**
 * API client for Nova DevOps Copilot backend.
 *
 * NEXT_PUBLIC_API_URL must point to the deployed backend (Railway).
 * Routes match backend main.py exactly — no /api/ prefix.
 */

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/** True only when the env var is explicitly set to a non-empty string. */
export const API_CONFIGURED = API_BASE.length > 0;

// ─── Types — aligned to backend response shapes ───────────────────────────────

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type PipelineMode = "live" | "mock";

/** A single infrastructure event from MonitorAgent */
export interface Event {
  id: string;
  source: string;
  severity: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** ReasonAgent analysis of one event */
export interface Analysis {
  event_id: string;
  root_cause: string;
  confidence_score: number;
  reasoning_chain: string[];
  recommended_action: "auto_fix" | "escalate" | "monitor";
  estimated_resolution_time?: string;
  model?: string;
}

/** One result entry inside a pipeline run */
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

/** /dashboard/summary response */
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

/** Escalation entry from EscalateAgent */
export interface Escalation {
  escalation_id: string;
  event_id: string;
  event: Event;
  analysis: Analysis;
  status: "pending" | "approved" | "rejected" | "deferred";
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution?: string;
}

export interface HealthData {
  ok: boolean;
  timestamp: string;
}

// Legacy aliases for components that import the old names
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
