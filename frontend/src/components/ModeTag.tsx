"use client";

import type { PipelineMode } from "@/lib/api";

interface Props {
  mode: PipelineMode;
  model: string;
  credentialsConfigured: boolean;
}

const MODE_CONFIG: Record<
  PipelineMode,
  { label: string; color: string; description: string }
> = {
  live: {
    label: "🟢 LIVE",
    color: "bg-green-900 text-green-300 border-green-700",
    description: "Real AWS Bedrock (Nova Pro) + real AWS APIs",
  },
  sandbox: {
    label: "🟡 SANDBOX",
    color: "bg-yellow-900 text-yellow-300 border-yellow-700",
    description: "Nova Pro reasoning + pre-seeded sandbox signals",
  },
  demo: {
    label: "🔵 DEMO",
    color: "bg-blue-900 text-blue-300 border-blue-700",
    description: "Deterministic fallback — no Bedrock call",
  },
};

export function ModeTag({ mode, model, credentialsConfigured }: Props) {
  const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.demo;
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono ${cfg.color}`}>
      <span>{cfg.label}</span>
      <span className="opacity-60">|</span>
      <span className="truncate max-w-[180px]" title={model}>
        {model.split(".").pop()}
      </span>
      {!credentialsConfigured && mode !== "live" && (
        <span className="ml-1 opacity-50" title="AWS credentials not configured">⚠️</span>
      )}
    </div>
  );
}
