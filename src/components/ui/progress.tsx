import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ className, value = 0, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={cn(
        "relative h-3 w-full overflow-hidden border border-[#111111] bg-[#E5E5E0] sharp-corners",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-[#111111] transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
