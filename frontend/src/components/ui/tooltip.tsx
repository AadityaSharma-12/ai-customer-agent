import * as React from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
}) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-30 px-2 py-1 text-[10px] font-medium text-zinc-100 bg-zinc-900 border border-zinc-800 rounded shadow-md whitespace-nowrap transition-opacity duration-150 ${
            position === "top"
              ? "bottom-full left-1/2 -translate-x-1/2 mb-1.5"
              : position === "bottom"
              ? "top-full left-1/2 -translate-x-1/2 mt-1.5"
              : position === "left"
              ? "right-full top-1/2 -translate-y-1/2 mr-1.5"
              : "left-full top-1/2 -translate-y-1/2 ml-1.5"
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
