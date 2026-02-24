"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import SeverityBadge from "./SeverityBadge";
import { api, type Escalation } from "@/lib/api";

interface Props {
  escalations: Escalation[];
  onResolved: () => void;
}

export default function EscalationQueue({ escalations, onResolved }: Props) {
  const [resolving, setResolving] = useState<string | null>(null);

  const resolve = async (escalationId: string, resolution: "approved" | "rejected" | "deferred") => {
    setResolving(escalationId);
    try {
      await api.resolveEscalation(escalationId, resolution);
      onResolved();
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(null);
    }
  };

  if (escalations.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500/40" />
        <p className="text-sm">No pending escalations — run the pipeline to generate events</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {escalations.map(esc => (
        <div key={esc.escalation_id} className="bg-slate-800/60 border border-orange-500/20 rounded-xl p-4 fade-in">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <SeverityBadge severity={esc.event.severity} />
                <span className="text-xs font-mono text-slate-400">
                  {esc.event.service} · {esc.event.resource}
                </span>
              </div>
              <p className="text-sm text-slate-200">{esc.event.message}</p>
              <p className="text-xs text-slate-400 mt-1">{esc.analysis?.root_cause}</p>
              {esc.analysis?.confidence !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Confidence</span>
                    <span className="font-mono">{Math.round(esc.analysis.confidence * 100)}%</span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: `${Math.round(esc.analysis.confidence * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1.5 font-mono">ID: {esc.escalation_id}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {resolving === esc.escalation_id ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : esc.status === "pending" ? (
                <>
                  <button
                    onClick={() => resolve(esc.escalation_id, "approved")}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors font-medium"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => resolve(esc.escalation_id, "rejected")}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors font-medium"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => resolve(esc.escalation_id, "deferred")}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600 transition-colors font-medium"
                  >
                    <Clock className="w-3.5 h-3.5" /> Defer
                  </button>
                </>
              ) : (
                <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 border border-slate-600 font-medium capitalize">
                  {esc.status}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
