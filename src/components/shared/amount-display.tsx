import React from "react";
import { stroopsToXlm } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface AmountDisplayProps {
  stroops: bigint | string;
  size?: "sm" | "md" | "lg" | "xl";
  currency?: string;
  className?: string;
}

export function AmountDisplay({
  stroops,
  size = "md",
  currency = "XLM",
  className,
}: AmountDisplayProps) {
  const xlmValue = stroopsToXlm(stroops);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base font-semibold",
    lg: "text-xl font-bold",
    xl: "text-3xl sm:text-4xl font-extrabold font-serif",
  };

  return (
    <div className={cn("inline-flex items-baseline space-x-1 font-mono text-[#111111]", className)}>
      <span className={cn(sizeClasses[size], "tracking-tight")}>{xlmValue}</span>
      <span className="text-[11px] font-mono uppercase tracking-widest text-[#737373]">{currency}</span>
    </div>
  );
}
