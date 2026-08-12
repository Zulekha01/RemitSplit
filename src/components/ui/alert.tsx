import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full border-2 border-[#111111] p-4 text-xs font-body text-[#111111] sharp-corners [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-[#111111]",
  {
    variants: {
      variant: {
        default: "bg-[#F9F9F7] text-[#111111] border-l-8 border-l-[#111111]",
        destructive:
          "bg-[#F9F9F7] text-[#111111] border-l-8 border-l-[#CC0000] [&>svg]:text-[#CC0000]",
        editorial:
          "bg-[#111111] text-[#F9F9F7] border-[#111111] [&>svg]:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn("mb-1 font-serif text-sm font-bold tracking-tight leading-none text-inherit", className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn("text-xs font-body leading-relaxed text-inherit opacity-90", className)}
      {...props}
    />
  );
}
