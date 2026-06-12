import * as React from "react";
import { Terminal, Shield, CheckCircle, Info } from "lucide-react";
import { ToolLog } from "../../data/scenarios";

interface ToolsLogProps {
  logs: ToolLog[];
}

export const ToolsLog: React.FC<ToolsLogProps> = ({ logs }) => {
  const terminalRef = React.useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of logs
  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel rounded-xl flex flex-col h-[280px] overflow-hidden border border-zinc-800/80 shadow-2xl relative">
      {/* Scanline decoration for retro/high-tech feel */}
      <div className="absolute inset-0 bg-scanline pointer-events-none opacity-[0.02]" />

      {/* Terminal Title Bar */}
      <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40 relative z-10">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-cyan-400" />
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300 font-sans">
            Live Tool Execution Logs
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
          <span>Active Connections: {logs.length}</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 bg-zinc-950/90 overflow-y-auto p-4 space-y-3 font-mono text-[11px] leading-relaxed scroll-smooth relative z-10"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 gap-2">
            <Info size={12} />
            <span>Awaiting platform agent trigger...</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="border-b border-zinc-900/50 pb-2 last:border-0 last:pb-0">
              {/* Log Status & Title */}
              <div className="flex items-center justify-between gap-4 text-zinc-400 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-cyan-500 font-bold">❯</span>
                  <span className="text-zinc-300 font-semibold">{log.tool}</span>
                  <span className="text-[9px] text-zinc-600">({log.durationMs}ms)</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] text-zinc-600">{log.timestamp}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      log.status === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : log.status === "running"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>

              {/* Log Output Payload */}
              <pre className="text-zinc-500 pl-4 overflow-x-auto bg-zinc-900/30 rounded p-1.5 border border-zinc-900/40 selection:bg-cyan-500/20">
                <code>{log.output}</code>
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
