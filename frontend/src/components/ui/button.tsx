import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "glass-accent" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "glass", size = "md", ...props }, ref) => {
    return (
      <button
        className={clsx(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            // Primary Solid
            "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:from-purple-500 hover:to-blue-500 border border-purple-500/20":
              variant === "primary",
            // Secondary
            "bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700/80 hover:text-zinc-100":
              variant === "secondary",
            // Standard Glass
            "bg-zinc-900/40 backdrop-blur-md text-zinc-300 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-100":
              variant === "glass",
            // Glowing Purple Glass
            "bg-purple-950/20 backdrop-blur-md text-purple-200 border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-950/30":
              variant === "glass-accent",
            // Ghost
            "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100":
              variant === "ghost",
          },
          {
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
