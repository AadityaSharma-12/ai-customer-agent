"use client";

import * as React from "react";
import { Sparkles, AlertTriangle, Activity } from "lucide-react";
import { ModeNav } from "../../components/shared/ModeNav";
import { GlowEffect } from "../../components/shared/GlowEffect";
import { CustomerPicker } from "../../components/live/CustomerPicker";
import { LiveChat, LiveChatMessage } from "../../components/live/LiveChat";
import { LiveWorkflow, buildWorkflowStates } from "../../components/live/LiveWorkflow";
import { LiveResultPanel } from "../../components/live/LiveResultPanel";
import { LiveProfile } from "../../components/live/LiveProfile";
import { cancelAccount, resetSession } from "../../lib/api";
import { CancelAccountResponse } from "../../lib/types";

function timestamp(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function LivePage() {
  const [customerId, setCustomerId] = React.useState("123");
  const [messages, setMessages] = React.useState<LiveChatMessage[]>([]);
  const [response, setResponse] = React.useState<CancelAccountResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const workflowStates = buildWorkflowStates(response);

  const handleSend = async (text: string) => {
    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { sender: "customer", text, timestamp: timestamp() }]);

    try {
      const result = await cancelAccount({ customer_id: customerId, message: text });
      setResponse(result);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: result.message, timestamp: timestamp() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    setError(null);
    setMessages([]);
    setResponse(null);
    try {
      await resetSession(customerId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };

  const handleCustomerIdChange = (id: string) => {
    setCustomerId(id);
    setMessages([]);
    setResponse(null);
    setError(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-x-hidden selection:bg-purple-500/20">
      <div className="absolute inset-0 bg-grid-overlay z-0" />
      <GlowEffect color="purple" size={500} className="top-[-10%] left-[-10%]" />
      <GlowEffect color="blue" size={600} className="bottom-[-10%] right-[-10%]" />
      <GlowEffect color="emerald" size={400} className="top-[30%] left-[50%] -translate-x-1/2" />

      <header className="glass-panel w-full border-b border-zinc-800/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-zinc-950 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-zinc-100 uppercase">
              INNOVATENOW
            </h1>
            <span className="text-[9px] text-zinc-500 font-mono">
              v4.1.0-RETAIN-AGENT — Live Mode
            </span>
          </div>
        </div>

        <ModeNav active="live" />
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 relative z-10">
        <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-2 border-l-emerald-500 bg-emerald-950/5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Activity size={14} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-200">
                Live Agent — Real Backend Calls
              </h2>
              <p className="text-[11px] text-zinc-400 leading-normal mt-0.5">
                Every response here comes from the actual{" "}
                <code className="text-zinc-300">POST /cancel-account</code> endpoint —
                no scripted or fabricated data.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="glass-panel rounded-xl p-4 flex items-center gap-3 border-l-2 border-l-rose-500 bg-rose-950/5">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <p className="text-xs text-rose-300">
              {error} — is the FastAPI backend running and reachable?
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <CustomerPicker
              customerId={customerId}
              setCustomerId={handleCustomerIdChange}
              onNewConversation={handleNewConversation}
              disabled={loading}
            />
            <div className="flex-1 min-h-[400px]">
              <LiveChat messages={messages} loading={loading} onSend={handleSend} />
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex-1 min-h-[300px]">
              <LiveWorkflow states={workflowStates} />
            </div>
            <LiveResultPanel response={response} />
          </div>

          <div className="lg:col-span-3 flex flex-col">
            <LiveProfile customer={response?.customer ?? null} />
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-900/60 bg-zinc-950/80 backdrop-blur py-4 text-center text-[9px] text-zinc-600 font-mono relative z-10">
        InnovateNow AI Command Center Console — Live Agent Mode. Calls the real FastAPI backend.
      </footer>
    </div>
  );
}
