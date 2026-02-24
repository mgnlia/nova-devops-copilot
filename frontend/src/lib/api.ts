/**
 * API client for Nova DevOps Copilot backend.
 *
 * NEXT_PUBLIC_API_URL must point to the deployed backend.
 * There is NO localhost fallback — explicit error shown when not configured.
 */

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/** True only when the env var is explicitly set to a non-empty string. */
export const API_CONFIGURED = API_BASE.length > 0;

// ─── Types ────────────────────────────────────────────────────────────────────

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type IncidentStatus =
  | "PENDING"
  | "PENDING_HITL"
  | "REMEDIATED"
  | "APPROVED_HITL"
  | "REJECTED_HITL";
export type PipelineMode = "live" | "sandbox" | "demo";

export interface Incident {
  incident_id: string;
  title: string;
  severity: Severity;
  affected_resources: string[];
  cross_service_signals: string[];
  reasoning_chain: string[];
  root_cause: string;
  confidence_score: number;
  recommended_action: string;
  auto_remediable: boolean;
  estimated_monthly_savings_usd: number;
  status: IncidentStatus;
  created_at: string;
}

export interface Remediation {
  incident_id: string;
  action: string;
  result: {
    status: "SUCCESS" | "FAILED";
    steps?: string[];
    error?: string;
    estimated_monthly_savings_usd?: number;
  };
}

export interface Escalation {
  incident_id: string;
  title: string;
  summary: string;
  proposed_action: string;
  risk_of_inaction: string;
  risk_of_action: string;
  recommendation: string;
  confidence_score: number;
  requires_approval: boolean;
}

export interface PipelineResult {
  pipeline_run_id: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  mode: PipelineMode;
  model: string;
  incidents: Incident[];
  remediations: Remediation[];
  escalations: Escalation[];
  summary: {
    total_incidents: number;
    auto_remediated: number;
    pending_hitl: number;
    total_monthly_savings_usd: number;
    mode: PipelineMode;
    model: string;
  };
}

export interface DashboardData {
  total_incidents: number;
  severity_breakdown: Record<string, number>;
  pending_hitl: number;
  auto_remediated: number;
  total_monthly_savings_usd: number;
  last_run: string | null;
  model: string;
  mode: PipelineMode;
  aws_credentials_configured: boolean;
}

export interface HealthData {
  status: string;
  timestamp: string;
  mode: PipelineMode;
  model: string;
  aws_credentials_configured: boolean;
  demo_mode: boolean;
}

// ─── Legacy type aliases for backward compat with older components ─────────────

/** @deprecated Use DashboardData instead */
export type DashboardSummary = DashboardData;

/** @deprecated Use PipelineResult instead */
export type PipelineRun = PipelineResult;

// ─── Client ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_CONFIGURED) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured. Set it in Vercel environment variables."
    );
  }

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} at ${path}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => apiFetch<HealthData>("/health"),
  dashboard: () => apiFetch<DashboardData>("/api/dashboard"),
  runPipeline: () => apiFetch<PipelineResult>("/api/pipeline/run", { method: "POST" }),
  latestPipeline: () => apiFetch<PipelineResult>("/api/pipeline/latest"),
  incidents: () => apiFetch<{ incidents: Incident[]; count: number; mode: string }>("/api/incidents"),
  incident: (id: string) => apiFetch<Incident>(`/api/incidents/${id}`),
  approveIncident: (id: string, approved: boolean, note = "", resolvedBy = "operator") =>
    apiFetch(`/api/incidents/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ approved, operator_note: note, resolved_by: resolvedBy }),
    }),
  escalations: () => apiFetch<{ escalations: Incident[]; count: number }>("/api/escalations"),
  signals: () => apiFetch("/api/signals"),
  // Legacy aliases
  summary: () => apiFetch<DashboardData>("/api/dashboard"),
};

// Legacy export for backward compat
export const runPipelineWithFallback = api.runPipeline;
