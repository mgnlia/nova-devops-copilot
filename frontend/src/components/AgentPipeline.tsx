"use client";

import { Eye, Brain, Zap, Bell, ChevronRight } from "lucide-react";

const AGENTS = [
  { id: "monitor",  label: "Monitor",  icon: Eye,    desc: "CloudWatch · Cost · SecHub", color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  { id: "reason",   label: "Reason",   icon: Brain,  desc: "Nova Pro root-cause analysis", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { id: "act",      label: "Act",      icon: Zap,    desc: "Auto-fix high-confidence", color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
  { id: "escalate", label: "Escalate", icon: Bell,   desc: "HITL queue for review", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
];

interface Props {
  activeAgent?: string;
  running?: boolean;
}

export default function AgentPipeline({ activeAgent, running }: Props) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {AGENTS.map((agent, i) => {
        const Icon = agent.icon;
        const isActive = activeAgent === agent.id;
        return (
          <div key={agent.id} className="flex items-center gap-1">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border agent-card ${agent.bg} ${isActive && running ? "ring-2 ring-white/20 scale-105" : ""}`}>
              <div className={`relative ${isActive && running ? "animate-pulse" : ""}`}>
                <Icon className={`w-4 h-4 ${agent.color}`} />
              </div>
              <div>
                <p className={`text-xs font-semibold ${agent.color}`}>{agent.label}</p>
                <p className="text-[10px] text-slate-500 hidden sm:block">{agent.desc}</p>
              </div>
            </div>
            {i < AGENTS.length - 1 && (
              <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
