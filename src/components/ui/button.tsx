import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-mono uppercase tracking-widest text-xs font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 min-h-[44px] px-5 py-2.5 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#111111] text-[#F9F9F7] border border-[#111111] hover:bg-[#F9F9F7] hover:text-[#111111] hover:shadow-[4px_4px_0px_0px_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none",
        outline:
          "border-2 border-[#111111] bg-transparent text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] hover:shadow-[4px_4px_0px_0px_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none",
        secondary:
          "border border-[#111111] bg-[#E5E5E0] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]",
        editorial:
          "bg-[#CC0000] text-white border border-[#CC0000] hover:bg-[#111111] hover:border-[#111111] hover:shadow-[4px_4px_0px_0px_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5",
        destructive:
          "bg-[#CC0000] text-white border border-[#CC0000] hover:bg-white hover:text-[#CC0000]",
        ghost:
          "bg-transparent text-[#111111] hover:bg-[#E5E5E0] hover:text-[#111111]",
        link:
          "text-[#111111] underline-offset-4 decoration-2 decoration-[#CC0000] hover:underline p-0 min-h-0 bg-transparent",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3.5 text-[11px] min-h-[36px]",
        lg: "h-13 px-8 text-sm min-h-[48px]",
        icon: "h-11 w-11 p-0 min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
