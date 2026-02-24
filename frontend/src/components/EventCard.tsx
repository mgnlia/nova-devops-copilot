"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Server, DollarSign, Shield, Activity } from "lucide-react";
import SeverityBadge from "./SeverityBadge";
import type { PipelineResult } from "@/lib/api";

const sourceIcon = (source: string) => {
  if (source === "cloudwatch")   return <Activity className="w-4 h-4 text-blue-400" />;
  if (source === "cost_explorer") return <DollarSign className="w-4 h-4 text-green-400" />;
  if (source === "security_hub")  return <Shield className="w-4 h-4 text-orange-400" />;
  return <Server className="w-4 h-4 text-slate-400" />;
};

const actionBadge = (action: string) => {
  if (action === "auto_fix") return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">⚡ Auto-fixed</span>;
  if (action === "escalate") return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">🔔 Escalated</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">👁 Monitoring</span>;
};

export default function EventCard({ result }: { result: PipelineResult }) {
  const [open, setOpen] = useState(false);
  const { event, analysis } = result;
  const conf = Math.round((analysis?.confidence ?? 0) * 100);

  return (
    <div className={`border rounded-xl overflow-hidden fade-in bg-sev-${event.severity}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors"
      >
        <div className="mt-0.5 flex-shrink-0">{sourceIcon(event.source)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={event.severity} />
            <span className="text-xs text-slate-400 font-mono">{event.service} · {event.metric}</span>
            {actionBadge(result.action_taken)}
          </div>
          <p className="text-sm text-slate-200 mt-1 leading-snug">{event.message}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">{event.resource}</p>
        </div>
        <div className="flex-shrink-0 text-slate-500 mt-1">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && analysis && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4 bg-slate-900/60">
          {/* Root cause */}
          <div>
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-1">🧠 Nova Pro Root Cause</p>
            <p className="text-sm text-slate-200">{analysis.root_cause}</p>
          </div>

          {/* Confidence bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Confidence</span>
              <span className="font-mono font-semibold text-slate-200">{conf}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${conf >= 80 ? "bg-green-400" : conf >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
                style={{ width: `${conf}%` }}
              />
            </div>
          </div>

          {/* Reasoning steps */}
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">Reasoning Chain</p>
            <ol className="space-y-1">
              {analysis.reasoning_steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-[10px]">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Impact + Fix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-400 mb-1">Impact</p>
              <p className="text-xs text-slate-300">{analysis.impact}</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-400 mb-1">Remediation · {analysis.estimated_resolution_time}</p>
              <p className="text-xs text-slate-300">{analysis.fix_description}</p>
            </div>
          </div>

          {/* Execution / Escalation result */}
          {result.execution && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-400 mb-1">⚡ Auto-fix executed</p>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap">{JSON.stringify(result.execution, null, 2)}</pre>
            </div>
          )}
          {result.escalation && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-400 mb-1">🔔 Escalated to HITL queue</p>
              <p className="text-xs text-slate-300">ID: <span className="font-mono">{(result.escalation as { id?: string }).id}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
