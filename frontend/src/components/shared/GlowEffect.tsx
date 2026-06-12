import * as React from "react";

interface GlowEffectProps {
  color?: "purple" | "blue" | "emerald" | "amber";
  className?: string;
  size?: number;
}

export const GlowEffect: React.FC<GlowEffectProps> = ({
  color = "purple",
  className = "",
  size = 400,
}) => {
  const colorMap = {
    purple: "from-purple-600/10 to-transparent",
    blue: "from-blue-600/10 to-transparent",
    emerald: "from-emerald-500/5 to-transparent",
    amber: "from-amber-500/5 to-transparent",
  };

  return (
    <div
      style={{ width: size, height: size }}
      className={`pointer-events-none absolute rounded-full bg-gradient-radial filter blur-[80px] opacity-60 mix-blend-screen glow-glow-effect ${colorMap[color]} ${className}`}
    />
  );
};
export default GlowEffect;
