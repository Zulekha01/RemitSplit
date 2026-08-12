import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest border transition-colors sharp-corners select-none",
  {
    variants: {
      variant: {
        default:
          "border-[#111111] bg-[#111111] text-[#F9F9F7]",
        secondary:
          "border-[#111111] bg-[#E5E5E0] text-[#111111]",
        destructive:
          "border-[#CC0000] bg-[#CC0000] text-white",
        outline:
          "border-[#111111] bg-transparent text-[#111111]",
        editorial:
          "border-[#CC0000] bg-[#CC0000] text-white font-black animate-pulse",
        success:
          "border-[#111111] bg-emerald-900 text-white",
        warning:
          "border-[#111111] bg-amber-900 text-white",
        stellar:
          "border-[#111111] bg-[#111111] text-[#F9F9F7]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
