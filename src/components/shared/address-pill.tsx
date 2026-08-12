"use client";

import React, { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { truncateAddress } from "@/lib/formatters";
import { ExplorerLink } from "./explorer-link";

interface AddressPillProps {
  address: string;
  showExplorer?: boolean;
  showCopy?: boolean;
}

export function AddressPill({
  address,
  showExplorer = true,
  showCopy = true,
}: AddressPillProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="inline-flex items-center space-x-1.5 border border-[#111111] bg-[#F5F5F5] px-2 py-0.5 text-xs font-mono text-[#111111] sharp-corners">
      <span title={address} className="font-medium">
        {truncateAddress(address)}
      </span>

      {showCopy && (
        <button
          onClick={handleCopy}
          className="text-[#737373] hover:text-[#111111] transition-colors p-0.5"
          title="Copy address"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-700" /> : <Copy className="h-3 w-3" />}
        </button>
      )}

      {showExplorer && <ExplorerLink type="account" value={address} iconOnly />}
    </div>
  );
}
