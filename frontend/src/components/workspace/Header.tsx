import * as React from "react";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Server, Terminal, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { ModeNav } from "../shared/ModeNav";
import { Scenario } from "../../data/scenarios";

interface HeaderProps {
  scenarios: Scenario[];
  currentScenario: Scenario;
  currentStepIndex: number;
  totalSteps: number;
  isAutoplay: boolean;
  setIsAutoplay: (play: boolean) => void;
  selectScenario: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetSimulation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  currentScenario,
  currentStepIndex,
  totalSteps,
  isAutoplay,
  setIsAutoplay,
  selectScenario,
  nextStep,
  prevStep,
  resetSimulation,
}) => {
  return (
    <header className="glass-panel w-full border-b border-zinc-800/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
      {/* Brand Logo & Platform Node Status */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-zinc-950 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-zinc-100 uppercase">
              AETHELGARD
            </h1>
            <span className="text-[9px] text-zinc-500 font-mono">
              v4.1.0-RETAIN-AGENT
            </span>
          </div>
        </div>

        {/* Dynamic Nodes status indicators */}
        <div className="hidden lg:flex items-center gap-3 ml-8 border-l border-zinc-800/80 pl-6">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400">Gemini</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400">Zoho-MCP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400">FastAPI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400">CloudRun</span>
          </div>
        </div>
      </div>

      {/* Scenario Selector & Simulation Controls */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        <ModeNav active="showcase" />

        {/* Scenario drop down */}
        <div className="relative">
          <select
            value={currentScenario.id}
            onChange={(e) => selectScenario(e.target.value)}
            className="h-9 rounded-lg bg-zinc-900 border border-zinc-800 px-3 pr-8 text-xs font-medium text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500/50 appearance-none cursor-pointer hover:border-zinc-700 transition-colors"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-500">
            <svg
              className="fill-current h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        {/* Navigation Step controls */}
        <div className="flex items-center gap-1 bg-zinc-950/60 border border-zinc-900 rounded-lg p-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
          >
            <ChevronLeft size={16} />
          </Button>

          {/* Current Step indicators */}
          <div className="px-2 text-[10px] font-mono text-zinc-400 min-w-[70px] text-center">
            Step {currentStepIndex + 1} / {totalSteps}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextStep}
            disabled={currentStepIndex === totalSteps - 1}
            className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Play / Reset buttons */}
        <Button
          variant={isAutoplay ? "glass-accent" : "glass"}
          onClick={() => setIsAutoplay(!isAutoplay)}
          className="h-9 px-3.5 text-xs flex items-center gap-1.5"
        >
          {isAutoplay ? (
            <>
              <Pause size={12} className="text-purple-400 animate-pulse" />
              <span>Pause Auto</span>
            </>
          ) : (
            <>
              <Play size={12} className="text-zinc-400" />
              <span>Autoplay</span>
            </>
          )}
        </Button>

        <Button
          variant="glass"
          onClick={resetSimulation}
          className="h-9 w-9 p-0"
        >
          <RotateCcw size={12} />
        </Button>
      </div>
    </header>
  );
};
