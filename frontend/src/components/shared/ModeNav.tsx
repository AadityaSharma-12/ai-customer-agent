import * as React from "react";
import Link from "next/link";

interface ModeNavProps {
  active: "showcase" | "live";
}

export const ModeNav: React.FC<ModeNavProps> = ({ active }) => {
  return (
    <div className="flex items-center gap-1 bg-zinc-950/60 border border-zinc-900 rounded-lg p-0.5">
      <Link
        href="/"
        className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wide transition-colors ${
          active === "showcase"
            ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Showcase
      </Link>
      <Link
        href="/live"
        className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wide transition-colors ${
          active === "live"
            ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Live Agent
      </Link>
    </div>
  );
};
