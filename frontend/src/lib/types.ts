export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type IncidentStatus =
  | "PENDING"
  | "PENDING_HITL"
  | "APPROVED_HITL"
  | "REJECTED_HITL"
  | "REMEDIATED";
export type RecommendedAction =
  | "EC2_RIGHTSIZE"
  | "S3_REVOKE_PUBLIC"
  | "TAG_RESOURCES"
  | "MANUAL_REVIEW";

export interface Incident {
  incident_id: string;
  title: string;
  severity: Severity;
  affected_resources: string[];
  cross_service_signals: string[];
  reasoning_chain: string[];
  root_cause: string;
  confidence_score: number;
  recommended_action: RecommendedAction;
  auto_remediable: boolean;
  estimated_monthly_savings_usd: number;
  status: IncidentStatus;
  created_at: string;
  operator_note?: string;
  approved_at?: string;
  rejected_at?: string;
}

export interface Remediation {
  incident_id: string;
  action: RecommendedAction;
  result: {
    action: string;
    status: string;
    steps?: string[];
    executed_at?: string;
    estimated_monthly_savings_usd?: number;
    [key: string]: unknown;
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
  incidents: Incident[];
  remediations: Remediation[];
  escalations: Escalation[];
  summary: {
    total_incidents: number;
    auto_remediated: number;
    pending_hitl: number;
    total_savings_usd: number;
  };
}
