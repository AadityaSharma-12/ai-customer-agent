import * as React from "react";
import { Shield, Mail, Calendar, User, TrendingUp, AlertTriangle } from "lucide-react";
import { CustomerProfile } from "../../data/scenarios";

interface ProfileProps {
  customer: CustomerProfile;
}

export const Profile: React.FC<ProfileProps> = ({ customer }) => {
  // Churn risk ring calculation
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (customer.churnRiskScore / 100) * circumference;

  // Probability ring calculation
  const probStrokeDashoffset = circumference - (customer.cancellationProbability / 100) * circumference;

  // Determine colors based on risk
  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-rose-500 stroke-rose-500";
    if (score >= 50) return "text-amber-500 stroke-amber-500";
    return "text-emerald-500 stroke-emerald-500";
  };

  return (
    <div className="glass-panel rounded-xl flex flex-col h-full overflow-hidden border border-zinc-800/80 shadow-2xl relative">
      {/* Panel Header */}
      <div className="px-4 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/20">
        <div className="flex items-center gap-2">
          <User size={16} className="text-purple-400" />
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
            Customer Profile
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Shield size={12} className="text-zinc-500" />
          <span className="text-[10px] text-zinc-500 font-mono">Verified Account</span>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-5 flex-1 space-y-6">
        {/* User Card */}
        <div className="flex items-center gap-3.5 border-b border-zinc-900 pb-5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-purple-600/30 to-blue-600/30 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-purple-200 tracking-wider">
            {customer.avatar}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">
              {customer.name}
            </h3>
            <p className="text-[10px] text-zinc-500 truncate">{customer.company}</p>
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1 font-mono">
              <Mail size={10} className="text-zinc-600" />
              <span className="truncate">{customer.email}</span>
            </div>
          </div>
        </div>

        {/* Churn Risk Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 border-b border-zinc-900 pb-5">
          {/* Churn Risk Ring Meter */}
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-3 flex flex-col items-center justify-center relative">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
              Churn Risk
            </span>
            <div className="relative h-20 w-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-zinc-800"
                  strokeWidth="5"
                  fill="transparent"
                />
                {/* Active Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className={`transition-all duration-500 ease-out ${getRiskColor(
                    customer.churnRiskScore
                  )}`}
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-bold text-zinc-100">
                  {customer.churnRiskScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Probability Ring Meter */}
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-3 flex flex-col items-center justify-center relative">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
              Cancel Prob
            </span>
            <div className="relative h-20 w-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-zinc-800"
                  strokeWidth="5"
                  fill="transparent"
                />
                {/* Active Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className={`transition-all duration-500 ease-out ${getRiskColor(
                    customer.cancellationProbability
                  )}`}
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={probStrokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-bold text-zinc-100">
                  {customer.cancellationProbability}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plan details */}
        <div className="space-y-3.5 border-b border-zinc-900 pb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono uppercase text-[9px]">Subscription Tier</span>
            <span className="font-semibold text-zinc-200 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
              {customer.subscriptionPlan}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono uppercase text-[9px]">Monthly Recurring (MRR)</span>
            <span className="font-mono font-semibold text-zinc-100">
              ${customer.monthlyPayment.toLocaleString()}/mo
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono uppercase text-[9px]">Remaining Contract</span>
            <span className="font-mono text-zinc-100 flex items-center gap-1">
              <Calendar size={10} className="text-zinc-500" />
              <span>{customer.remainingDays} days</span>
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2.5">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">
            System Tags / Alert Drivers
          </span>
          <div className="flex flex-wrap gap-1.5">
            {customer.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
