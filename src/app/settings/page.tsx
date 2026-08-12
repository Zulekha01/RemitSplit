"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Server,
  Terminal,
  Trash2,
  Download,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWalletStore } from "@/state/use-wallet-store";
import { logger } from "@/lib/logger";

export default function SettingsPage() {
  const { network } = useWalletStore();

  const [registryContractId, setRegistryContractId] = useState(
    process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID || "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  );
  const [distributionContractId, setDistributionContractId] = useState(
    process.env.NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID || "CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
  );
  const [rpcUrl, setRpcUrl] = useState(
    process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"
  );

  const [saved, setSaved] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs());

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
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
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b pb-6">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Protocol Settings &amp; Diagnostics
            </h1>
            <Badge variant="stellar">Observability</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure Stellar network endpoints, contract addresses, and view real-time client diagnostics.
          </p>
        </div>

        {/* Network & Contract Configuration */}
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Soroban Smart Contract Configuration</CardTitle>
            </div>
            <CardDescription>
              Deployed contract IDs on Stellar {network}.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSaveConfig}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Stellar Network
                </label>
                <Input value={network} disabled className="bg-slate-100 dark:bg-slate-800 text-xs font-semibold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Soroban RPC Endpoint URL
                </label>
                <Input
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  FamilyRegistry Contract ID (C...)
                </label>
                <Input
                  value={registryContractId}
                  onChange={(e) => setRegistryContractId(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  EscrowDistribution Contract ID (C...)
                </label>
                <Input
                  value={distributionContractId}
                  onChange={(e) => setDistributionContractId(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t p-4">
              <span className="text-xs text-muted-foreground">
                Configured contract IDs are used for all RPC simulations and transactions.
              </span>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {saved ? <Check className="h-4 w-4 mr-1.5" /> : null}
                {saved ? "Saved" : "Save Settings"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Structured Observability Logs */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base">Structured Observability &amp; Telemetry Logs</CardTitle>
              </div>
              <CardDescription>
                Client-side diagnostics, wallet signatures, contract simulations, and error tracing.
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleRefreshLogs}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearLogs} className="text-red-500 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs h-72 overflow-y-auto space-y-2 border border-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-center py-12">
                  No telemetry logs captured in current session.
                </div>
              ) : (
                logs.map((entry, idx) => (
                  <div key={idx} className="leading-relaxed border-b border-slate-900 pb-1.5 last:border-0">
                    <span className="text-slate-500 mr-2">[{entry.timestamp.slice(11, 19)}]</span>
                    <span
                      className={`font-bold mr-2 uppercase text-[10px] px-1.5 py-0.5 rounded ${
                        entry.level === "error"
                          ? "bg-red-950 text-red-400"
                          : entry.level === "warn"
                          ? "bg-amber-950 text-amber-400"
                          : entry.level === "info"
                          ? "bg-blue-950 text-blue-400"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {entry.level}
                    </span>
                    <span className="text-slate-400 font-semibold mr-2">[{entry.context}]</span>
                    <span className="text-slate-200">{entry.message}</span>
                    {entry.data ? (
                      <pre className="text-[10px] text-slate-400 pl-4 mt-0.5 overflow-x-auto">
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
