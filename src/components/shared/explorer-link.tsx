import React from "react";
import { ExternalLink } from "lucide-react";
import { getExplorerUrl, truncateHash, truncateAddress } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ExplorerLinkProps {
  type: "account" | "contract" | "tx";
  value: string;
  truncate?: boolean;
  network?: string;
  className?: string;
}

export function ExplorerLink({
  type,
  value,
  truncate = true,
  network = "testnet",
  className,
}: ExplorerLinkProps) {
  if (!value) return <span className="text-muted-foreground">-</span>;

  const url = getExplorerUrl(type, value, network);
  const displayText = truncate
    ? type === "tx"
      ? truncateHash(value)
      : truncateAddress(value)
    : value;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center space-x-1 font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors",
        className
      )}
    >
      <span>{displayText}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
