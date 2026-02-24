"use client";

import React, { useState, useRef, useCallback } from "react";
import { AgentResult, AgentName, AGENT_CONFIGS } from "@/types";
import { runPipelineWithFallback } from "@/lib/api";
import Header from "@/components/Header";
import PipelineFlow from "@/components/PipelineFlow";
import ExamplePrompts from "@/components/ExamplePrompts";
import clsx from "clsx";

type PipelineState = "idle" | "running" | "done" | "error";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [results, setResults] = useState<Partial<Record<AgentName, AgentResult>>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [lastRequest, setLastRequest] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(async (requestText?: string) => {
    const req = (requestText ?? input).trim();
    if (!req || pipelineState === "running") return;

    // Reset state
    setResults({});
    setActiveAgent(null);
    setErrorMsg(null);
    setIsMock(false);
    setLastRequest(req);
    setPipelineState("running");

    // Abort any previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    try {
      await runPipelineWithFallback(req, (event, data) => {
        if (event === "agent_start") {
          const agentName = data.agent as AgentName;
          setActiveAgent(agentName);
          setResults((prev) => ({
            ...prev,
            [agentName]: {
              agent: agentName,
              output: data.message || "Processing...",
              status: "running",
            },
          }));
        } else if (event === "agent_done") {
          const agentName = data.agent as AgentName;
          setResults((prev) => ({
            ...prev,
            [agentName]: {
              agent: agentName,
              output: data.output || "",
              status: "done",
            },
          }));
        } else if (event === "pipeline_done") {
          setActiveAgent(null);
          setPipelineState("done");
          setIsMock(data.mock ?? false);
        } else if (event === "error") {
          setErrorMsg(data.message || "An error occurred");
          setPipelineState("error");
        }
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setErrorMsg(err?.message || "Failed to connect to backend");
        setPipelineState("error");
      }
    }
  }, [input, pipelineState]);

  const handleReset = () => {
    abortRef.current?.abort();
    setPipelineState("idle");
    setResults({});
    setActiveAgent(null);
    setErrorMsg(null);
    setInput("");
  };

  const handleExampleSelect = (prompt: string) => {
    setInput(prompt);
    handleSubmit(prompt);
  };

  const isRunning = pipelineState === "running";
  const isDone = pipelineState === "done";
  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-aws-orange/10 border border-aws-orange/20 mb-4">
            <span className="text-aws-orange text-xs font-semibold">🏆 Amazon Nova AI Hackathon</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            DevOps Copilot
            <span className="text-aws-orange"> Powered by Nova</span>
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            Describe any DevOps task. Four AI agents — Planner, Coder, Reviewer, and Explainer —
            collaborate to generate a production-ready pipeline.
          </p>
        </div>

        {/* Agent Pipeline Visual */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {AGENT_CONFIGS.map((cfg, i) => (
            <React.Fragment key={cfg.name}>
              <div className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-300",
                cfg.borderColor,
                cfg.bgColor,
                cfg.color,
                activeAgent === cfg.name && "scale-110 shadow-lg",
                results[cfg.name]?.status === "done" && "opacity-100",
                !results[cfg.name] && activeAgent !== cfg.name && "opacity-40"
              )}>
                <span>{cfg.icon}</span>
                <span>{cfg.name}</span>
              </div>
              {i < AGENT_CONFIGS.length - 1 && (
                <span className="text-gray-600 text-xs">→</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Input */}
        {!hasResults && (
          <ExamplePrompts onSelect={handleExampleSelect} />
        )}

        <div className="relative mb-8">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
            placeholder="Describe your DevOps task... e.g. 'Deploy my Python API to AWS ECS with auto-scaling and a CI/CD pipeline'"
            rows={3}
            disabled={isRunning}
            className={clsx(
              "w-full px-4 py-3 pr-32 rounded-xl bg-white/5 border text-white placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-aws-orange/50 focus:border-aws-orange/50",
              "resize-none transition-all duration-200",
              isRunning ? "border-white/10 opacity-60" : "border-white/20 hover:border-white/30"
            )}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {hasResults && !isRunning && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isRunning}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
                "flex items-center gap-2",
                input.trim() && !isRunning
                  ? "bg-aws-orange hover:bg-orange-500 text-white shadow-lg hover:shadow-aws-orange/30"
                  : "bg-white/10 text-gray-500 cursor-not-allowed"
              )}
            >
              {isRunning ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <span>Run Pipeline</span>
                  <span className="text-xs opacity-60">⌘↵</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div ref={resultsRef} className="animate-slide-up">
            {/* Status bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Pipeline Results</h3>
                {isDone && isMock && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                    mock mode
                  </span>
                )}
                {isDone && !isMock && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                    ✓ live Nova
                  </span>
                )}
              </div>
              {lastRequest && (
                <p className="text-xs text-gray-500 truncate max-w-xs">
                  "{lastRequest}"
                </p>
              )}
            </div>

            <PipelineFlow results={results} activeAgent={activeAgent} />

            {isDone && (
              <div className="mt-6 p-4 rounded-xl bg-aws-orange/5 border border-aws-orange/20 text-center animate-fade-in">
                <p className="text-sm text-aws-orange font-medium mb-1">
                  🎉 Pipeline complete!
                </p>
                <p className="text-xs text-gray-400">
                  Generated by 4 Amazon Nova agents via AWS Bedrock
                  {isMock && " (demo mode — connect AWS credentials for live AI)"}
                </p>
                <button
                  onClick={handleReset}
                  className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium bg-aws-orange/20 hover:bg-aws-orange/30 text-aws-orange transition-all"
                >
                  Try another request
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasResults && pipelineState === "idle" && (
          <div className="text-center py-12 text-gray-600">
            <div className="text-5xl mb-4">🚀</div>
            <p className="text-sm">Enter a DevOps request above to start the pipeline</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 px-4 text-center">
        <p className="text-xs text-gray-600">
          Nova DevOps Copilot · Built for the{" "}
          <span className="text-aws-orange">Amazon Nova AI Hackathon</span>{" "}
          · Powered by{" "}
          <code className="text-xs bg-white/5 px-1 rounded">amazon.nova-pro-v1:0</code>
        </p>
      </footer>
    </div>
  );
}
