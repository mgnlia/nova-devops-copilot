"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, AlertTriangle, Bell, Bot, CheckCircle2,
  Cpu, Loader2, Play, RefreshCw, Zap,
} from "lucide-react";
import AgentPipeline from "@/components/AgentPipeline";
import EventCard from "@/components/EventCard";
import EscalationQueue from "@/components/EscalationQueue";
import StatCard from "@/components/StatCard";
import { api, type DashboardSummary, type PipelineRun, type Escalation } from "@/lib/api";

type Tab = "pipeline" | "escalations";

export default function Home() {
  const [tab, setTab] = useState<Tab>("pipeline");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [latestRun, setLatestRun] = useState<PipelineRun | null>(null);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [running, setRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, e] = await Promise.all([api.summary(), api.escalations()]);
      setSummary(s);
      setEscalations(e.escalations);
      setApiOnline(true);
      setError(null);
    } catch (err) {
      setApiOnline(false);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to backend API. Please check that the server is running."
      );
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const runPipeline = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    setLatestRun(null);

    const agents = ["monitor", "reason", "act", "escalate"];
    for (const agent of agents) {
      setActiveAgent(agent);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const run = await api.runPipeline();
      setLatestRun(run);
      await refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Pipeline execution failed — backend may be offline.";
      setError(message);
    } finally {
      setRunning(false);
      setActiveAgent(undefined);
    }
  }, [running, refresh]);

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white leading-none">Nova DevOps Copilot</h1>
              <p className="text-xs text-slate-400 mt-0.5">Amazon Nova Pro · 4-Agent Pipeline · AWS Bedrock</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-2 h-2 rounded-full ${apiOnline === true ? "bg-green-400" : apiOnline === false ? "bg-red-400" : "bg-yellow-400 animate-pulse"}`} />
              <span className="text-slate-400">{apiOnline === true ? "API online" : apiOnline === false ? "API offline" : "Connecting…"}</span>
            </div>
            {summary && (
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                {summary.mode === "mock" ? "🎭 mock" : "🟢 live"} · {summary.model}
              </span>
            )}
            <button
              onClick={runPipeline}
              disabled={running}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg"
            >
              {running ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running…</>
              ) : (
                <><Play className="w-4 h-4" /> Run Pipeline</>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Agent Pipeline</p>
          <AgentPipeline activeAgent={activeAgent} running={running} />
        </div>

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Events" value={summary.total_events} icon={Activity} color="text-blue-400" />
            <StatCard label="Critical" value={summary.severity_breakdown.critical ?? 0} icon={AlertTriangle} color="text-red-400" />
            <StatCard label="Pending Escalations" value={summary.pending_escalations} icon={Bell} color="text-orange-400" />
            <StatCard label="Pipeline Runs" value={summary.total_pipeline_runs} icon={Cpu} color="text-purple-400" sub={summary.last_run ? `Last: ${new Date(summary.last_run).toLocaleTimeString()}` : undefined} />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 w-fit">
          {(["pipeline", "escalations"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "escalations" ? `Escalations${escalations.length > 0 ? ` (${escalations.length})` : ""}` : "Pipeline Results"}
            </button>
          ))}
          <button
            onClick={refresh}
            className="ml-1 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {tab === "pipeline" && (
          <div className="space-y-3">
            {running && !latestRun && (
              <div className="text-center py-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
                <p className="text-sm">Running 4-agent pipeline…</p>
                <p className="text-xs text-slate-500 mt-1 capitalize">{activeAgent} agent active</p>
              </div>
            )}
            {!running && !latestRun && !error && (
              <div className="text-center py-12 text-slate-500">
                <Zap className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                <p className="text-sm">Click <strong className="text-slate-400">Run Pipeline</strong> to analyze your infrastructure</p>
                <p className="text-xs mt-1">Monitor → Reason (Nova Pro) → Act → Escalate</p>
              </div>
            )}
            {latestRun && (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Run <span className="font-mono text-slate-300">{latestRun.run_id}</span>
                  </div>
                  <span className="text-xs text-slate-500">{latestRun.events_processed} events · {latestRun.auto_fixed} auto-fixed · {latestRun.escalated} escalated</span>
                </div>
                {latestRun.results.map((result, i) => (
                  <EventCard key={i} result={result} />
                ))}
              </>
            )}
          </div>
        )}

        {tab === "escalations" && (
          <EscalationQueue escalations={escalations} onResolved={refresh} />
        )}
      </main>

      <footer className="text-center text-xs text-slate-600 py-4 border-t border-slate-800">
        Built for the{" "}
        <a href="https://amazonnovahackathon.devpost.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          Amazon Nova AI Hackathon
        </a>
        {" "}· Amazon Nova Pro via AWS Bedrock · 4-Agent Pipeline
      </footer>
    </div>
  );
}
