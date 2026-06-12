import * as React from "react";
import { ChevronDown, ChevronUp, Brain, Percent, Info } from "lucide-react";
import { ReasoningStep } from "../../data/scenarios";

interface ReasoningProps {
  steps: ReasoningStep[];
}

export const Reasoning: React.FC<ReasoningProps> = ({ steps }) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(true);

  return (
    <div className="glass-panel rounded-xl flex flex-col overflow-hidden border border-zinc-800/80 shadow-2xl transition-all duration-300">
      {/* Panel Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/20 w-full hover:bg-zinc-900/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-purple-400" />
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
            Agent Thought Visualization
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
            Reasoning Chain v1.0
          </span>
          {isOpen ? (
            <ChevronUp size={14} className="text-zinc-400" />
          ) : (
            <ChevronDown size={14} className="text-zinc-400" />
          )}
        </div>
      </button>

      {/* Panel Content (Collapsible) */}
      {isOpen && (
        <div className="p-4 space-y-3 bg-zinc-950/25">
          {steps.length === 0 ? (
            <div className="text-center py-6 text-zinc-600 flex items-center justify-center gap-2 text-xs font-mono">
              <Info size={12} />
              <span>Awaiting agent calculations...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-3 text-xs leading-relaxed flex flex-col justify-between"
                >
                  <div>
                    {/* Step Title */}
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-300 mb-1.5 font-sans">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      {step.title}
                    </div>

                    {/* Step Details */}
                    <p className="text-zinc-400 font-mono text-[10px] mb-2">
                      {step.details}
                    </p>
                  </div>

                  {/* Formula and Outcome tags */}
                  {(step.formula || step.result) && (
                    <div className="mt-2 pt-2 border-t border-zinc-900/80 space-y-1.5">
                      {step.formula && (
                        <div className="bg-zinc-950/60 p-1.5 rounded text-[9px] font-mono text-cyan-400/90 border border-zinc-900">
                          <span className="text-zinc-600 select-none">eq:</span> {step.formula}
                        </div>
                      )}
                      {step.result && (
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span className="text-zinc-600">OUTCOME:</span>
                          <span className="text-purple-400 font-bold tracking-tight">
                            {step.result}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Reasoning;
