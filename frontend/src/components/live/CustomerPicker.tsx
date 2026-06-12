import * as React from "react";
import { Users, Send } from "lucide-react";
import { Button } from "../ui/button";

const SAMPLE_CUSTOMERS = [
  { id: "123", label: "123 — Premium", description: "Standard flow: 20% discount offer, prorated refund" },
  { id: "456", label: "456 — Enterprise", description: "Account-review retention offer" },
  { id: "789", label: "789 — New Premium", description: "Subscribed today: maximum possible refund" },
  { id: "321", label: "321 — Free", description: "$0 monthly fee: refund is always zero" },
  { id: "000", label: "000 — Sync failure", description: "Simulated Zoho MCP failure" },
];

interface CustomerPickerProps {
  customerId: string;
  setCustomerId: (id: string) => void;
  message: string;
  setMessage: (message: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export const CustomerPicker: React.FC<CustomerPickerProps> = ({
  customerId,
  setCustomerId,
  message,
  setMessage,
  onSubmit,
  disabled,
}) => {
  return (
    <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
      <div className="px-4 py-3.5 border-b border-zinc-800/80 flex items-center gap-2 bg-zinc-950/20">
        <Users size={16} className="text-purple-400" />
        <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
          Live Agent — Customer Lookup
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Sample customer IDs
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_CUSTOMERS.map((c) => (
              <button
                key={c.id}
                title={c.description}
                onClick={() => setCustomerId(c.id)}
                disabled={disabled}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  customerId === c.id
                    ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                    : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Customer ID
          </label>
          <input
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            disabled={disabled}
            placeholder="e.g. 123"
            className="glass-input w-full rounded-lg px-3 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="I want to cancel my subscription."
            className="glass-input w-full rounded-lg px-3 py-2 text-xs resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={disabled || !customerId.trim() || !message.trim()}
          className="w-full flex items-center justify-center gap-1.5 text-xs"
        >
          <Send size={12} />
          Send to agent
        </Button>
      </div>
    </div>
  );
};
