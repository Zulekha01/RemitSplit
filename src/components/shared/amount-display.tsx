import React from "react";
import { stroopsToXlm } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface AmountDisplayProps {
  stroops: bigint | string | number;
  assetSymbol?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AmountDisplay({
  stroops,
  assetSymbol = "XLM",
  size = "md",
  className,
}: AmountDisplayProps) {
  const formatted = stroopsToXlm(stroops);

  const sizeClasses = {
    sm: "text-sm font-medium",
    md: "text-base font-semibold",
    lg: "text-xl font-bold",
    xl: "text-3xl font-extrabold tracking-tight",
  };

  return (
    <span className={cn("inline-flex items-baseline space-x-1", sizeClasses[size], className)}>
      <span>{formatted}</span>
      <span className="text-xs font-semibold text-muted-foreground uppercase">{assetSymbol}</span>
    </span>
  );
}
