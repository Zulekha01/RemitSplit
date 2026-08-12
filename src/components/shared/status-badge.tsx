import React from "react";
import { Badge } from "@/components/ui/badge";
import { TransactionStatus, DistributionStatus } from "@/types";
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: TransactionStatus | DistributionStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case "CONFIRMED":
    case "COMPLETED":
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge variant="stellar" className={className}>
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case "PENDING":
    case "DEPOSITPENDING":
    case "CREATED":
      return (
        <Badge variant="secondary" className={className}>
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "FUNDED":
      return (
        <Badge variant="stellar" className={className}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Escrow Funded
        </Badge>
      );
    case "PARTIALLYCOMPLETED":
      return (
        <Badge variant="warning" className={className}>
          <AlertTriangle className="w-3 h-3 mr-1" />
          Partial Payout
        </Badge>
      );
    case "RETRYABLE":
      return (
        <Badge variant="warning" className={className}>
          <RefreshCw className="w-3 h-3 mr-1" />
          Retryable
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive" className={className}>
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
}
