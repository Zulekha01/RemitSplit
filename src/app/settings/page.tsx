"use client";

import React, { useState } from "react";
import {
  Settings,
  Server,
  Terminal,
  Trash2,
  Check,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWalletStore } from "@/state/use-wallet-store";
import { logger } from "@/lib/logger";

export default function SettingsPage() {
  const { network } = useWalletStore();

  const [registryContractId, setRegistryContractId] = useState(
    process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID || "CAXOUQARANNK6E3FIS2DWYK3QMYKWXJSY2HNPGP4XCIKGGNV5LTESS3D"
  );
  const [distributionContractId, setDistributionContractId] = useState(
    process.env.NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID || "CAQXR3PGPCVA7U3MZ3WAMZW7IXGFI6QVTYG34QKVHXYNGHE2SQEZLOM5"
  );
  const [rpcUrl, setRpcUrl] = useState(
    process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"
  );

  const [saved, setSaved] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs());

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    const { registryContractService } = await import("@/services/registry-contract");
    const { distributionContractService } = await import("@/services/distribution-contract");
    registryContractService.setContractId(registryContractId);
    distributionContractService.setContractId(distributionContractId);
    logger.info("Settings", "Updated contract configuration", {
      registryContractId,
      distributionContractId,
      rpcUrl,
    });
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRefreshLogs = () => {
    setLogs(logger.getLogs());
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto font-mono text-xs">
        {/* Header */}
        <div className="border-b-2 border-[#111111] pb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block">
            PROTOCOL CONFIGURATION · CLIENT OBSERVABILITY
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#111111]">
            Settings &amp; Diagnostics
          </h1>
          <p className="font-body text-xs text-[#525252]">
            Configure Stellar RPC endpoints, deployed Soroban contract addresses, and inspect diagnostic logs.
          </p>
        </div>

        {/* Configuration Box */}
        <div className="border-2 border-[#111111] bg-[#F9F9F7]">
          <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
              SMART CONTRACT REGISTRATION
            </span>
            <Badge variant="default">{network.toUpperCase()}</Badge>
          </div>

          <form onSubmit={handleSaveConfig}>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#737373]">
                  Stellar Network
                </label>
                <Input value={network} disabled className="bg-[#E5E5E0] cursor-not-allowed font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#737373]">
                  Soroban RPC Endpoint
                </label>
                <Input
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#737373]">
                  FamilyRegistry Contract ID (C...)
                </label>
                <Input
                  value={registryContractId}
                  onChange={(e) => setRegistryContractId(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#737373]">
                  EscrowDistribution Contract ID (C...)
                </label>
                <Input
                  value={distributionContractId}
                  onChange={(e) => setDistributionContractId(e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 border-t-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
              <span className="text-[#737373] text-[10px]">
                Contract IDs dictate all RPC simulations and signature payloads.
              </span>
              <Button type="submit" variant="default" size="sm">
                {saved ? <Check className="h-4 w-4 mr-1.5" /> : null}
                {saved ? "Saved to Context" : "Save Parameters"}
              </Button>
            </div>
          </form>
        </div>

        {/* Structured Diagnostics Telemetry Log */}
        <div className="border-2 border-[#111111] bg-[#F9F9F7]">
          <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
              STRUCTURED CLIENT DIAGNOSTICS LOG
            </span>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleRefreshLogs} className="h-7 text-[11px] px-2.5">
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearLogs} className="h-7 text-[11px] px-2.5 text-[#CC0000] border-[#CC0000]">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          <div className="p-4 bg-[#111111] text-[#F9F9F7] font-mono text-[11px] h-72 overflow-y-auto space-y-2 border-t border-[#111111]">
            {logs.length === 0 ? (
              <div className="text-[#737373] text-center py-16">
                No telemetry entries captured in current session.
              </div>
            ) : (
              logs.map((entry, idx) => (
                <div key={idx} className="border-b border-[#222222] pb-1.5 last:border-0 leading-relaxed">
                  <span className="text-[#737373] mr-2">[{entry.timestamp.slice(11, 19)}]</span>
                  <span
                    className={`font-bold mr-2 uppercase text-[10px] px-1 py-0.5 ${
                      entry.level === "error"
                        ? "bg-[#CC0000] text-white"
                        : entry.level === "warn"
                        ? "bg-amber-800 text-white"
                        : entry.level === "info"
                        ? "bg-[#333333] text-white"
                        : "text-[#737373]"
                    }`}
                  >
                    {entry.level}
                  </span>
                  <span className="text-[#A3A3A3] font-bold mr-2">[{entry.context}]</span>
                  <span className="text-[#F9F9F7]">{entry.message}</span>
                  {entry.data ? (
                    <pre className="text-[10px] text-[#A3A3A3] pl-4 mt-0.5 overflow-x-auto">
                      {JSON.stringify(entry.data, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
