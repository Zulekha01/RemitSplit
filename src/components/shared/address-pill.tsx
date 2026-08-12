"use client";

import React, { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { truncateAddress, getExplorerUrl } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface AddressPillProps {
  address: string;
  label?: string;
  showCopy?: boolean;
  showExplorer?: boolean;
  type?: "account" | "contract";
  className?: string;
}

export function AddressPill({
  address,
  label,
  showCopy = true,
  showExplorer = true,
  type = "account",
  className,
}: AddressPillProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center space-x-1.5 rounded-lg border bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1 text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm",
        className
      )}
    >
      {label && <span className="font-sans font-semibold text-slate-900 dark:text-slate-100 mr-1">{label}:</span>}
      <span>{truncateAddress(address)}</span>

      {showCopy && (
        <button
          onClick={handleCopy}
          type="button"
          title="Copy address"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}

      {showExplorer && (
        <a
          href={getExplorerUrl(type, address)}
          target="_blank"
          rel="noopener noreferrer"
          title="View on StellarExpert"
          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-0.5 rounded"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
