"use client";

import React from "react";
import { Sparkles, ShieldCheck, AlertCircle } from "lucide-react";
import { useWalletStore } from "@/state/use-wallet-store";

export function NetworkBanner() {
  const { network } = useWalletStore();

  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white text-xs py-2 px-4 shadow-sm flex items-center justify-between">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold uppercase tracking-wider text-[11px] bg-white/15 px-2 py-0.5 rounded">
            Stellar {network}
          </span>
          <span className="hidden sm:inline text-white/80">
            Soroban Programmable Cross-Border Remittance Protocol
          </span>
        </div>

        <div className="flex items-center space-x-4 text-[11px] text-white/90">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span className="font-medium">On-Chain RBAC Verified</span>
          </span>
          <span className="hidden md:flex items-center space-x-1">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span>Dual Soroban Inter-Contract Calls</span>
          </span>
        </div>
      </div>
    </div>
  );
}
