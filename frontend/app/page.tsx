"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type PipelineResult, type DashboardData, API_CONFIGURED, API_BASE } from "@/lib/api";
import { PipelineRunButton } from "@/components/PipelineRunButton";
import { IncidentCard } from "@/components/IncidentCard";
import { DashboardStats } from "@/components/DashboardStats";
import { ModeTag } from "@/components/ModeTag";

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!API_CONFIGURED) {
      setError("NEXT_PUBLIC_API_URL is not set. Configure it in Vercel project settings.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const d = await api.dashboard();
      setDashboard(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reach backend");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRunPipeline = async () => {
    setRunning(true);
    setError(null);
    try {
      const result = await api.runPipeline();
      setPipeline(result);
      setDashboard((prev) =>
        prev
          ? {
              ...prev,
              total_incidents: result.summary.total_incidents,
              auto_remediated: result.summary.auto_remediated,
              pending_hitl: result.summary.pending_hitl,
              total_monthly_savings_usd: result.summary.total_monthly_savings_usd,
              last_run: result.started_at,
              mode: result.mode,
              model: result.model,
            }
          : prev
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline run failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-lg font-bold">
              ⚡
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Nova DevOps Copilot</h1>
              <p className="text-xs text-gray-400">Amazon Nova AI Hackathon 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {dashboard && <ModeTag mode={dashboard.mode} model={dashboard.model} credentialsConfigured={dashboard.aws_credentials_configured} />}
            <PipelineRunButton onClick={handleRunPipeline} loading={running} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Config error banner */}
        {!API_CONFIGURED && (
          <div className="bg-red-950 border border-red-700 rounded-lg p-4 text-red-200">
            <p className="font-semibold">⚠️ Backend not configured</p>
            <p className="text-sm mt-1">
              Set <code className="bg-red-900 px-1 rounded">NEXT_PUBLIC_API_URL</code> to your
              backend URL in Vercel project settings → Environment Variables.
            </p>
          </div>
        )}

        {/* Runtime error banner */}
        {error && API_CONFIGURED && (
          <div className="bg-red-950 border border-red-700 rounded-lg p-4 text-red-200">
            <p className="font-semibold">⚠️ Backend error</p>
            <p className="text-sm mt-1 font-mono">{error}</p>
            <p className="text-xs mt-2 text-red-400">
              Backend URL: <code>{API_BASE}</code>
            </p>
            <button
              onClick={fetchDashboard}
              className="mt-2 text-xs underline text-red-300 hover:text-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Connecting to backend…</p>
          </div>
        )}

        {/* Dashboard stats */}
        {dashboard && <DashboardStats data={dashboard} />}

        {/* Pipeline results */}
        {pipeline && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pipeline Results</h2>
              <span className="text-xs text-gray-500">
                Run ID: {pipeline.pipeline_run_id} · {pipeline.duration_ms}ms
              </span>
            </div>

            {pipeline.incidents.length === 0 ? (
              <div className="bg-green-950 border border-green-800 rounded-lg p-6 text-center text-green-300">
                ✅ No incidents detected — infrastructure is healthy
              </div>
            ) : (
              <div className="space-y-4">
                {pipeline.incidents.map((incident) => (
                  <IncidentCard
                    key={incident.incident_id}
                    incident={incident}
                    onApprove={(id) =>
                      api.approveIncident(id, true).then(() =>
                        setPipeline((prev) =>
                          prev
                            ? {
                                ...prev,
                                incidents: prev.incidents.map((i) =>
                                  i.incident_id === id ? { ...i, status: "APPROVED_HITL" } : i
                                ),
                              }
                            : prev
                        )
                      )
                    }
                    onReject={(id) =>
                      api.approveIncident(id, false).then(() =>
                        setPipeline((prev) =>
                          prev
                            ? {
                                ...prev,
                                incidents: prev.incidents.map((i) =>
                                  i.incident_id === id ? { ...i, status: "REJECTED_HITL" } : i
                                ),
                              }
                            : prev
                        )
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Empty state */}
        {!loading && !error && !pipeline && dashboard && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium text-gray-300">Ready to scan your infrastructure</p>
            <p className="text-sm mt-2">
              Click <strong>Run Pipeline</strong> to start the 4-agent Nova analysis
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
