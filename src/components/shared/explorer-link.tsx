import React from "react";
import { ExternalLink } from "lucide-react";
import { getExplorerUrl, truncateHash } from "@/lib/formatters";

interface ExplorerLinkProps {
  type: "tx" | "account" | "contract";
  value: string;
  network?: string;
  iconOnly?: boolean;
  truncate?: boolean;
}

export function ExplorerLink({
  type,
  value,
  network = "testnet",
  iconOnly = false,
  truncate = true,
}: ExplorerLinkProps) {
  const url = getExplorerUrl(type, value, network);

  if (iconOnly) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#111111] hover:text-[#CC0000] transition-colors p-0.5 inline-block"
        title="View on StellarExpert"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center space-x-1 font-mono text-xs text-[#111111] hover:text-[#CC0000] underline-offset-4 decoration-1 hover:underline transition-colors"
    >
      <span>{truncate ? truncateHash(value) : value}</span>
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}
