"use client";

import type { DashboardSummary } from "@/lib/api";

interface Props {
  data: DashboardSummary;
}

export function DashboardStats({ data }: Props) {
  const stats = [
    {
      label: "Total Events",
      value: data.total_events,
      icon: "🚨",
      color: "text-orange-400",
    },
    {
      label: "Pipeline Runs",
      value: data.total_pipeline_runs,
      icon: "✅",
      color: "text-green-400",
    },
    {
      label: "Pending Escalations",
      value: data.pending_escalations,
      icon: "👤",
      color: "text-yellow-400",
    },
    {
      label: "Model",
      value: data.model.replace("amazon.", "").replace("-v1:0", ""),
      icon: "🤖",
      color: "text-emerald-400",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-200">Infrastructure Dashboard</h2>
        {data.last_run && (
          <span className="text-xs text-gray-500">
            Last run: {new Date(data.last_run).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-1"
          >
            <div className="text-2xl">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Severity breakdown */}
      {Object.keys(data.severity_breakdown).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(data.severity_breakdown).map(([sev, count]) => (
            <span
              key={sev}
              className={`px-2 py-0.5 rounded-full text-xs font-mono border ${SEVERITY_COLORS[sev] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}
            >
              {sev}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-950 text-red-300 border-red-800",
  high: "bg-orange-950 text-orange-300 border-orange-800",
  medium: "bg-yellow-950 text-yellow-300 border-yellow-800",
  low: "bg-blue-950 text-blue-300 border-blue-800",
  info: "bg-gray-800 text-gray-400 border-gray-700",
};
