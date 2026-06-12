"use client";

import * as React from "react";
import { Header } from "../components/workspace/Header";
import { Conversation } from "../components/workspace/Conversation";
import { Workflow } from "../components/workspace/Workflow";
import { ToolsLog } from "../components/workspace/ToolsLog";
import { Profile } from "../components/workspace/Profile";
import { Reasoning } from "../components/workspace/Reasoning";
import { GlowEffect } from "../components/shared/GlowEffect";
import { useSimulation } from "../hooks/useSimulation";
import { Sparkles, Activity } from "lucide-react";

export default function WorkspacePage() {
  const {
    scenarios,
    currentScenario,
    currentStep,
    currentStepIndex,
    totalSteps,
    isAutoplay,
    setIsAutoplay,
    selectScenario,
    nextStep,
    prevStep,
    resetSimulation,
  } = useSimulation();

  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-x-hidden selection:bg-purple-500/20">
      {/* Background Decorator Grids and Glowing Radial Vectors */}
      <div className="absolute inset-0 bg-grid-overlay z-0" />
      <GlowEffect color="purple" size={500} className="top-[-10%] left-[-10%]" />
      <GlowEffect color="blue" size={600} className="bottom-[-10%] right-[-10%]" />
      <GlowEffect color="emerald" size={400} className="top-[30%] left-[50%] -translate-x-1/2" />

      {/* Header Controller */}
      <Header
        scenarios={scenarios}
        currentScenario={currentScenario}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        isAutoplay={isAutoplay}
        setIsAutoplay={setIsAutoplay}
        selectScenario={selectScenario}
        nextStep={nextStep}
        prevStep={prevStep}
        resetSimulation={resetSimulation}
      />

      {/* Main Command Center Dashboard */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 relative z-10">
        
        {/* Scenario description alert box */}
        <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-2 border-l-purple-500 bg-purple-950/5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Activity size={14} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-200">
                {currentScenario.title}
              </h2>
              <p className="text-[11px] text-zinc-400 leading-normal mt-0.5">
                {currentScenario.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-[10px] font-mono text-zinc-400">
            <span>Simulation Status: </span>
            <span className="text-purple-400 font-bold uppercase tracking-wider">
              {currentStepIndex === totalSteps - 1 ? "Completed" : "Running"}
            </span>
          </div>
        </div>

        {/* Dashboard 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column 1: Chat/Interactive Interface (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <Conversation
              chatMessages={currentStep.chat}
              currentStepIndex={currentStepIndex}
            />
          </div>

          {/* Column 2: Workflow Timeline & Live Tool Log Output (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex-1 min-h-[300px]">
              <Workflow states={currentStep.workflow} />
            </div>
            <div>
              <ToolsLog logs={currentStep.tools} />
            </div>
          </div>

          {/* Column 3: Customer Profile Panel (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col">
            <Profile customer={currentScenario.customer} />
          </div>

        </div>

        {/* Collapsible reasoning panel bottom bar */}
        <div className="w-full">
          <Reasoning steps={currentStep.reasoning} />
        </div>

      </main>

      {/* Footer credits bar */}
      <footer className="border-t border-zinc-900/60 bg-zinc-950/80 backdrop-blur py-4 text-center text-[9px] text-zinc-600 font-mono relative z-10">
        Aethelgard AI Command Center Console. Built with Google ADK, Gemini 1.5 Pro, and Zoho MCP.
      </footer>
    </div>
  );
}
