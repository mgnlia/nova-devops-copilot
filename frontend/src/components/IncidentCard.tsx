"use client";

import { useState } from "react";
import type { Incident } from "@/lib/api";

const SEVERITY_BORDER: Record<string, string> = {
  CRITICAL: "border-red-700",
  HIGH: "border-orange-600",
  MEDIUM: "border-yellow-600",
  LOW: "border-blue-700",
  INFO: "border-gray-700",
};

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-red-950 text-red-300",
  HIGH: "bg-orange-950 text-orange-300",
  MEDIUM: "bg-yellow-950 text-yellow-300",
  LOW: "bg-blue-950 text-blue-300",
  INFO: "bg-gray-800 text-gray-400",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-gray-800 text-gray-300",
  PENDING_HITL: "bg-yellow-950 text-yellow-300",
  REMEDIATED: "bg-green-950 text-green-300",
  APPROVED_HITL: "bg-green-950 text-green-300",
  REJECTED_HITL: "bg-red-950 text-red-300",
};

interface Props {
  incident: Incident;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function IncidentCard({ incident, onApprove, onReject }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [approving, setApproving] = useState(false);

  const border = SEVERITY_BORDER[incident.severity] ?? SEVERITY_BORDER.INFO;
  const sevBadge = SEVERITY_BADGE[incident.severity] ?? SEVERITY_BADGE.INFO;
  const statusBadge = STATUS_BADGE[incident.status] ?? STATUS_BADGE.PENDING;

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove(incident.incident_id);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setApproving(true);
    try {
      await onReject(incident.incident_id);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className={`bg-gray-900 border-l-4 ${border} border border-gray-800 rounded-xl overflow-hidden`}>
      {/* Header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-800/40 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${sevBadge}`}>
              {incident.severity}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs ${statusBadge}`}>
              {incident.status}
            </span>
            {incident.auto_remediable && (
              <span className="px-2 py-0.5 rounded text-xs bg-green-950 text-green-400">
                AUTO-REMEDIABLE
              </span>
            )}
            {incident.estimated_monthly_savings_usd > 0 && (
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-950 text-emerald-300">
                ${incident.estimated_monthly_savings_usd.toLocaleString()}/mo savings
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white text-sm leading-tight">{incident.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {incident.affected_resources.join(", ")}
          </p>
        </div>
        <div className="ml-4 flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">
            {Math.round(incident.confidence_score * 100)}% confidence
          </span>
          <span className="text-gray-600 text-lg">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-800 p-4 space-y-4 text-sm">
          {/* Root cause */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Root Cause</p>
            <p className="text-gray-300">{incident.root_cause}</p>
          </div>

          {/* Nova reasoning chain */}
          {incident.reasoning_chain.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Nova Pro Reasoning Chain
              </p>
              <ol className="space-y-1">
                {incident.reasoning_chain.map((step, i) => (
                  <li key={i} className="flex gap-2 text-gray-400">
                    <span className="text-orange-500 shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Cross-service signals */}
          {incident.cross_service_signals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Cross-Service Signals
              </p>
              <ul className="space-y-1">
                {incident.cross_service_signals.map((sig, i) => (
                  <li key={i} className="text-gray-400 flex gap-2">
                    <span className="text-blue-500">→</span>
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended action */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Recommended Action
            </p>
            <p className="text-gray-300 font-mono text-xs bg-gray-950 p-2 rounded">
              {incident.recommended_action}
            </p>
          </div>

          {/* HITL approval buttons */}
          {incident.status === "PENDING_HITL" && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 py-2 rounded-lg bg-green-700 hover:bg-green-600 disabled:bg-green-900 text-white text-sm font-semibold transition-colors"
              >
                {approving ? "Processing…" : "✅ Approve & Execute"}
              </button>
              <button
                onClick={handleReject}
                disabled={approving}
                className="flex-1 py-2 rounded-lg bg-red-900 hover:bg-red-800 disabled:bg-red-950 text-white text-sm font-semibold transition-colors"
              >
                ❌ Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
