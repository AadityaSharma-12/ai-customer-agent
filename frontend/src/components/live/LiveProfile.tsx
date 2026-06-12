import * as React from "react";
import { Shield, Mail, Calendar, User } from "lucide-react";
import { CustomerSummary } from "../../lib/types";

interface LiveProfileProps {
  customer: CustomerSummary | null;
}

export const LiveProfile: React.FC<LiveProfileProps> = ({ customer }) => {
  return (
    <div className="glass-panel rounded-xl flex flex-col h-full overflow-hidden border border-zinc-800/80 shadow-2xl relative">
      <div className="px-4 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/20">
        <div className="flex items-center gap-2">
          <User size={16} className="text-purple-400" />
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
            Customer Profile
          </span>
        </div>
        {customer && (
          <div className="flex items-center gap-1">
            <Shield size={12} className="text-zinc-500" />
            <span className="text-[10px] text-zinc-500 font-mono">Verified Account</span>
          </div>
        )}
      </div>

      {!customer ? (
        <div className="p-5 text-xs text-zinc-500">
          No customer profile yet. Authenticate a customer to see their real
          Zoho account details here.
        </div>
      ) : (
        <div className="p-5 flex-1 space-y-5">
          <div className="flex items-center gap-3.5 border-b border-zinc-900 pb-5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-purple-600/30 to-blue-600/30 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-purple-200 tracking-wider">
              {customer.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100 truncate">
                {customer.name}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1 font-mono">
                <Mail size={10} className="text-zinc-600" />
                <span className="truncate">{customer.email}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 border-b border-zinc-900 pb-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono uppercase text-[9px]">Plan</span>
              <span className="font-semibold text-zinc-200 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                {customer.plan}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono uppercase text-[9px]">Status</span>
              <span className="font-mono font-semibold text-zinc-100">
                {customer.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono uppercase text-[9px]">Subscribed since</span>
              <span className="font-mono text-zinc-100 flex items-center gap-1">
                <Calendar size={10} className="text-zinc-500" />
                <span>{customer.subscription_start}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
