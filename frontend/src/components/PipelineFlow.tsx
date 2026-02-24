"use client";

import React from "react";
import { AgentResult, AGENT_CONFIGS } from "@/types";
import AgentCard from "./AgentCard";
import clsx from "clsx";

interface PipelineFlowProps {
  results: Partial<Record<string, AgentResult>>;
  activeAgent: string | null;
}

export default function PipelineFlow({ results, activeAgent }: PipelineFlowProps) {
  return (
    <div className="space-y-3">
      {AGENT_CONFIGS.map((config, idx) => {
        const result = results[config.name];
        const isActive = activeAgent === config.name;

        return (
          <React.Fragment key={config.name}>
            <AgentCard
              config={config}
              result={result}
              isActive={isActive}
            />
            {idx < AGENT_CONFIGS.length - 1 && (
              <div className="flex justify-center">
                <div
                  className={clsx(
                    "flex flex-col items-center gap-0.5 transition-all duration-300",
                    result?.status === "done" ? "opacity-100" : "opacity-20"
                  )}
                >
                  <div className="w-0.5 h-3 bg-gradient-to-b from-gray-500 to-gray-600" />
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M6 8L0 0h12L6 8z" fill="#6b7280" />
                  </svg>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
