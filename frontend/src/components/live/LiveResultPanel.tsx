import * as React from "react";
import { FileJson, Tag, Wallet, ScrollText, ChevronDown, ChevronUp } from "lucide-react";
import { CancelAccountResponse } from "../../lib/types";

interface LiveResultPanelProps {
  response: CancelAccountResponse | null;
}

export const LiveResultPanel: React.FC<LiveResultPanelProps> = ({ response }) => {
  const [showRaw, setShowRaw] = React.useState(false);

  return (
    <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
      <div className="px-4 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/20">
        <div className="flex items-center gap-2">
          <ScrollText size={16} className="text-purple-400" />
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
            Agent Result
          </span>
        </div>
        {response && (
          <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono font-medium uppercase">
            {response.status}
          </span>
        )}
      </div>

      {!response ? (
        <div className="p-4 text-xs text-zinc-500">
          No response yet. Send a message to see the agent&apos;s structured
          output here.
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {response.offer && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                <Tag size={11} className="text-purple-400" />
                Retention offer
              </div>
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-3 space-y-1">
                <div className="text-xs font-semibold text-purple-300">
                  {response.offer.type}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {response.offer.description}
                </div>
                <div className="text-[10px] text-zinc-500 italic">
                  {response.offer.eligibility_reason}
                </div>
              </div>
            </div>
          )}

          {response.refund !== null && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                <Wallet size={11} className="text-purple-400" />
                Refund
              </div>
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-3 text-sm font-mono font-semibold text-zinc-100">
                ₹{response.refund.toFixed(2)}
              </div>
            </div>
          )}

          {response.audit_log_id !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono uppercase text-[9px]">
                Audit log ID
              </span>
              <span className="font-mono font-semibold text-zinc-100">
                #{response.audit_log_id}
              </span>
            </div>
          )}

          <button
            onClick={() => setShowRaw((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
          >
            <FileJson size={11} />
            Raw response
            {showRaw ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {showRaw && (
            <pre className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-3 text-[10px] text-zinc-400 overflow-x-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
