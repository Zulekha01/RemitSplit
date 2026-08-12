"use client";

import React from "react";
import Link from "next/link";
import {
  Send,
  Users,
  Sliders,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Percent,
  Plus,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWalletStore } from "@/state/use-wallet-store";
import { useFamilyStore } from "@/state/use-family-store";
import { useTransactionStore } from "@/state/use-transaction-store";
import { useActivityStore } from "@/state/use-activity-store";
import { StatusBadge } from "@/components/shared/status-badge";
import { AmountDisplay } from "@/components/shared/amount-display";
import { AddressPill } from "@/components/shared/address-pill";
import { ExplorerLink } from "@/components/shared/explorer-link";
import { formatTimestamp, bpsToPercentage, stroopsToXlm } from "@/lib/formatters";

export default function DashboardPage() {
  const { address, isConnected, balance, connect } = useWalletStore();
  const { families, selectedFamilyId, getSelectedFamily } = useFamilyStore();
  const { transactions } = useTransactionStore();
  const { events } = useActivityStore();

  const family = getSelectedFamily();
  const activeRule = family?.activeRule;
  const members = family?.members || [];

  const totalDistributedStroops = transactions
    .filter((tx) => tx.type === "DISTRIBUTE" && tx.status === "CONFIRMED")
    .reduce((acc, tx) => acc + (tx.amount || 0n), 0n);

  const successfulDistributions = transactions.filter(
    (tx) => tx.type === "DISTRIBUTE" && tx.status === "CONFIRMED"
  ).length;

  const pendingDistributions = transactions.filter(
    (tx) => tx.status === "PENDING" || tx.status === "PROCESSING"
  ).length;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Top Masthead Row */}
        <div className="border-b-4 border-[#111111] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#737373]">
                GROUP LEDGER · #{family?.id || 1}
              </span>
              <Badge variant="editorial">ACTIVE RECORD</Badge>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-[#111111]">
              {family?.name || "Remittance Overview"}
            </h1>
            <p className="font-body text-xs sm:text-sm text-[#525252]">
              Real-time audit log, active allocation distribution, and settlement ledger.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/deposit">
              <Button size="lg" variant="editorial" className="text-xs px-6 font-black shadow-[4px_4px_0px_0px_#111111]">
                <Send className="h-4 w-4 mr-2" />
                Deposit &amp; Split Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Wallet Alert if disconnected */}
        {!isConnected && (
          <div className="border-2 border-[#111111] bg-[#F5F5F5] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-[#CC0000] font-black text-base">●</span>
              <div>
                <span className="font-bold text-[#111111] uppercase tracking-wider block">
                  WALLET NOT CONNECTED:
                </span>
                <span className="text-[#525252]">
                  Connect your Stellar wallet to authorize and sign live on-chain remittance dispatches.
                </span>
              </div>
            </div>
            <Button onClick={() => connect()} size="sm" variant="default">
              Connect Wallet
            </Button>
          </div>
        )}

        {/* Primary 4-Column Stat Grid with Collapsed Borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-2 border-[#111111] divide-y sm:divide-y-0 sm:divide-x divide-[#111111] bg-[#F9F9F7]">
          <div className="p-6 space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block font-bold">
              TOTAL REMITTED [SETTLED]
            </span>
            <AmountDisplay stroops={totalDistributedStroops} size="xl" />
            <div className="font-mono text-[10px] text-[#737373]">
              {successfulDistributions} completed dispatches
            </div>
          </div>

          <div className="p-6 space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block font-bold">
              ACTIVE STRATEGY
            </span>
            <div className="font-serif text-2xl font-bold text-[#111111]">
              {activeRule ? `v${activeRule.version} · ${activeRule.strategy}` : "No Rule"}
            </div>
            <div className="font-mono text-[10px] text-[#737373]">
              {activeRule ? `${activeRule.allocations.length} Approved Recipients` : "Setup required"}
            </div>
          </div>

          <div className="p-6 space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block font-bold">
              FAMILY BENEFICIARIES
            </span>
            <div className="font-serif text-2xl font-bold text-[#111111]">
              {members.filter((m) => m.role === "Recipient").length} Approved
            </div>
            <div className="font-mono text-[10px] text-[#737373]">
              {members.length} Total Registered Members
            </div>
          </div>

          <div className="p-6 space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block font-bold">
              PENDING SETTLEMENTS
            </span>
            <div className="font-serif text-2xl font-bold text-[#111111]">
              {pendingDistributions}
            </div>
            <div className="font-mono text-[10px] text-[#737373]">
              {pendingDistributions === 0 ? "All dispatches cleared" : "Processing on-chain..."}
            </div>
          </div>
        </div>

        {/* 2-Column Split: Active Rule Breakdown & Family Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Active Split Rule (8 cols) */}
          <div className="lg:col-span-8 border-2 border-[#111111] bg-[#F9F9F7]">
            <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-[#CC0000]">
                  ACTIVE RULE SPECIFICATION
                </span>
                <h3 className="font-serif text-xl font-bold text-[#111111]">
                  Current On-Chain Allocations {activeRule && `(v${activeRule.version})`}
                </h3>
              </div>
              <Link href="/rules/builder">
                <Button variant="outline" size="sm">
                  <Sliders className="h-3.5 w-3.5 mr-1.5" />
                  Modify Rule
                </Button>
              </Link>
            </div>

            <div className="p-6 space-y-6">
              {activeRule && activeRule.allocations.length > 0 ? (
                activeRule.allocations.map((alloc, idx) => {
                  const sharePercentage = activeRule.strategy === "Percentage"
                    ? Number(alloc.shareOrAmount) / 100
                    : activeRule.strategy === "FixedAmount"
                    ? 33.33
                    : 40;

                  return (
                    <div key={idx} className="border border-[#111111] p-4 bg-[#F5F5F5] space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="font-serif text-base text-[#111111]">
                          {idx + 1}. {alloc.label || `Beneficiary ${idx + 1}`}
                        </span>
                        <span className="text-[#111111] font-black text-sm">
                          {activeRule.strategy === "Percentage"
                            ? bpsToPercentage(alloc.shareOrAmount)
                            : activeRule.strategy === "FixedAmount"
                            ? `${stroopsToXlm(alloc.shareOrAmount)} XLM (Fixed)`
                            : alloc.shareOrAmount === 0n
                            ? "Remaining Balance"
                            : `Up to ${stroopsToXlm(alloc.shareOrAmount)} XLM`}
                        </span>
                      </div>

                      <Progress value={sharePercentage} className="h-2.5" />

                      <div className="flex items-center justify-between text-[11px] text-[#525252] pt-1">
                        <AddressPill address={alloc.recipient} showExplorer={false} />
                        <span>Share Weight: {sharePercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center font-mono text-xs text-[#737373]">
                  No active rule configured for this family group.
                </div>
              )}
            </div>
          </div>

          {/* Quick Roster (4 cols) */}
          <div className="lg:col-span-4 border-2 border-[#111111] bg-[#F9F9F7] flex flex-col justify-between">
            <div>
              <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
                  MEMBERS ROSTER
                </span>
                <Link href="/families" className="font-mono text-[10px] uppercase font-bold text-[#CC0000] hover:underline">
                  MANAGE →
                </Link>
              </div>

              <div className="divide-y divide-[#111111]">
                {members.map((m) => (
                  <div key={m.address} className="p-3.5 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-serif font-bold block text-[#111111] text-sm">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-[#737373]">
                        {m.address.slice(0, 6)}...{m.address.slice(-6)}
                      </span>
                    </div>
                    <Badge variant={m.role === "Sender" ? "default" : "secondary"}>
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t-2 border-[#111111] bg-[#F5F5F5] text-[10px] font-mono text-[#525252]">
              Family Owner: <span className="font-bold text-[#111111]">{family?.owner.slice(0, 6)}...</span>
            </div>
          </div>
        </div>

        {/* Recent Distributions Table (Broadsheet Style) */}
        <div className="border-2 border-[#111111] bg-[#F9F9F7]">
          <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
              RECENT DISPATCHES &amp; TRANSACTIONS
            </span>
            <Link href="/transactions" className="font-mono text-[10px] uppercase font-bold text-[#CC0000] hover:underline">
              FULL GAZETTE →
            </Link>
          </div>

          <div className="divide-y divide-[#111111]">
            {transactions.slice(0, 4).map((tx) => (
              <div
                key={tx.hash}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:bg-[#F5F5F5] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-[#111111] font-serif">
                      {tx.type.replace("_", " ")}
                    </span>
                    <StatusBadge status={tx.status} />
                  </div>
                  <span className="text-[11px] text-[#737373]">
                    Timestamp: {formatTimestamp(tx.createdAt)}
                  </span>
                </div>

                <div className="flex items-center space-x-6">
                  {tx.amount && <AmountDisplay stroops={tx.amount} size="md" />}
                  <ExplorerLink type="tx" value={tx.hash} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
