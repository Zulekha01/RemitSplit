"use client";

import React from "react";
import { useWalletStore } from "@/state/use-wallet-store";

export function NetworkBanner() {
  const { network } = useWalletStore();

  const tickerItems = [
    "★ THE OFFICIAL DISPATCH FOR PROGRAMMATIC CROSS-BORDER REMITTANCES",
    "★ STELLAR TESTNET LIVE",
    "★ SOROBAN PROTOCOL v26 ACTIVE",
    "★ LOSSLESS INTEGER ARITHMETIC ENFORCED (10,000 BPS)",
    "★ IDEMPOTENT ESCROW RETRY ENGINE: RUNNING",
    "★ AVERAGE SETTLEMENT TIME: < 4 SECONDS",
  ];

  return (
    <div className="bg-[#111111] text-[#F9F9F7] py-0.5 px-4 overflow-hidden border-b border-[#222222] select-none text-[9.5px] font-mono font-bold tracking-widest uppercase">
      <div className="animate-marquee whitespace-nowrap flex items-center space-x-8">
        {[...tickerItems, ...tickerItems].map((item, idx) => (
          <span key={idx} className="inline-flex items-center space-x-2">
            <span className="text-[#CC0000] font-black">●</span>
            <span>{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
