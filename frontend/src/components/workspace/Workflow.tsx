import * as React from "react";
import { motion } from "framer-motion";
import { Check, Dot, GitCommit, Play, RefreshCw, XCircle } from "lucide-react";
import { WorkflowState } from "../../data/scenarios";

interface WorkflowProps {
  states: WorkflowState[];
}

export const Workflow: React.FC<WorkflowProps> = ({ states }) => {
  return (
    <div className="glass-panel rounded-xl flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/20">
        <div className="flex items-center gap-2">
          <GitCommit size={16} className="text-purple-400 rotate-90" />
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
            Workflow Timeline
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[10px] text-zinc-400 font-mono">Live Agent Engine</span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 p-5 flex flex-col justify-between relative">
        {/* Draw vertical connector line background */}
        <div className="absolute left-[33px] top-[40px] bottom-[40px] w-0.5 bg-zinc-800/80 z-0" />

        {states.map((state, index) => {
          const isCompleted = state.status === "completed";
          const isActive = state.status === "active";
          const isError = state.status === "error";
          const isIdle = state.status === "idle";

          // Calculate connection line fill
          const nextState = states[index + 1];
          const isLineFilled = isCompleted && (nextState?.status === "completed" || nextState?.status === "active");

          return (
            <div key={state.id} className="relative flex items-center gap-4 z-10 py-1">
              {/* Dynamic Line Fill Overlay */}
              {index < states.length - 1 && isLineFilled && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ duration: 0.4 }}
                  className="absolute left-[14px] top-[26px] w-0.5 bg-gradient-to-b from-purple-500 to-blue-500 z-0"
                  style={{ height: "calc(100% + 14px)" }}
                />
              )}

              {/* Node Indicator */}
              <div className="relative flex items-center justify-center shrink-0">
                <motion.div
                  animate={
                    isActive
                      ? {
                          scale: [1, 1.15, 1],
                          borderColor: [
                            "rgba(139, 92, 246, 0.4)",
                            "rgba(139, 92, 246, 0.8)",
                            "rgba(139, 92, 246, 0.4)",
                          ],
                        }
                      : {}
                  }
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`h-7 w-7 rounded-full border flex items-center justify-center transition-colors duration-300 ${
                    isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                      : isActive
                      ? "bg-purple-500/10 border-purple-500 text-purple-400"
                      : isError
                      ? "bg-rose-500/10 border-rose-500 text-rose-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-600"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={12} strokeWidth={3} />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw size={10} className="text-purple-400" />
                    </motion.div>
                  ) : isError ? (
                    <XCircle size={12} />
                  ) : (
                    <span className="text-[10px] font-mono font-bold">{index + 1}</span>
                  )}
                </motion.div>

                {/* Pulsing ring around active step */}
                {isActive && (
                  <span className="absolute -inset-1 rounded-full border border-purple-500/20 animate-ping pointer-events-none" />
                )}
              </div>

              {/* Step Label & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-medium transition-colors duration-300 ${
                      isActive
                        ? "text-purple-300 font-semibold"
                        : isCompleted
                        ? "text-zinc-300"
                        : "text-zinc-500"
                    }`}
                  >
                    {state.label}
                  </h4>

                  {/* Status pills */}
                  {state.updatedAt && (
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {state.updatedAt}
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">
                      PENDING AI
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
