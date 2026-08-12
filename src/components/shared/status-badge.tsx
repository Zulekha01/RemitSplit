import React from "react";
import { Badge } from "@/components/ui/badge";
import { TransactionStatus } from "@/types";

interface StatusBadgeProps {
  status: TransactionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "CONFIRMED":
      return (
        <Badge variant="default" className="bg-[#111111] text-[#F9F9F7]">
          SETTLED [OK]
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="secondary" className="bg-[#E5E5E0] text-[#111111]">
          QUEUED...
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge variant="secondary" className="border-[#111111] bg-white text-[#111111] animate-pulse">
          PROCESSING...
        </Badge>
      );
    case "RETRYABLE":
      return (
        <Badge variant="editorial" className="bg-[#CC0000] text-white">
          RETRYABLE !
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive" className="bg-[#CC0000] text-white font-black">
          FAILED [ERR]
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
