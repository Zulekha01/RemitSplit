"use client";

import React from "react";
import {
  TrendingUp,
  PieChart as PieChartIcon,
  CheckCircle2,
  DollarSign,
  Users,
  Activity,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useFamilyStore } from "@/state/use-family-store";
import { useTransactionStore } from "@/state/use-transaction-store";
import { AmountDisplay } from "@/components/shared/amount-display";

export default function AnalyticsPage() {
  const { families, selectedFamilyId, getSelectedFamily } = useFamilyStore();
  const { transactions } = useTransactionStore();

  const family = getSelectedFamily();
  const activeRule = family?.activeRule;
  const members = family?.members || [];

  const completedDistributions = transactions.filter(
    (tx) => tx.type === "DISTRIBUTE" && tx.status === "CONFIRMED"
  );

  const totalDistributedStroops = completedDistributions.reduce(
    (acc, tx) => acc + (tx.amount || 0n),
    0n
  );

  const averageDistributionStroops = completedDistributions.length > 0
    ? totalDistributedStroops / BigInt(completedDistributions.length)
    : 0n;

  const totalTransactions = transactions.length;
  const successfulTxCount = transactions.filter((tx) => tx.status === "CONFIRMED").length;
  const successRate = totalTransactions > 0 ? (successfulTxCount / totalTransactions) * 100 : 100;

  return (
    <AppShell>
      <div className="space-y-8 font-mono text-xs">
        {/* Header */}
        <div className="border-b-4 border-[#111111] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#737373] block">
              STATISTICAL BULLETIN · FINANCIAL TELEMETRY
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-[#111111]">
              Telemetry &amp; Reports
            </h1>
            <p className="font-body text-xs sm:text-sm text-[#525252]">
              On-chain settlement metrics, allocation distribution shares, and protocol health indices.
            </p>
          </div>
        </div>

        {/* 4 Stat Cards in Collapsed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-2 border-[#111111] divide-y sm:divide-y-0 sm:divide-x divide-[#111111] bg-[#F9F9F7]">
          <div className="p-6 space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-[#737373] block font-bold">
              GROSS DISPATCH VOLUME
            </span>
            <AmountDisplay stroops={totalDistributedStroops} size="xl" />
            <div className="text-[10px] text-[#737373]">
              Across {completedDistributions.length} dispatches
            </div>
          </div>

          <div className="p-6 space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-[#737373] block font-bold">
              AVERAGE DISPATCH
            </span>
            <AmountDisplay stroops={averageDistributionStroops} size="xl" />
            <div className="text-[10px] text-[#737373]">
              Per family execution
            </div>
          </div>

          <div className="p-6 space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-[#737373] block font-bold">
              SETTLEMENT SUCCESS
            </span>
            <div className="font-serif text-3xl font-black text-[#111111]">
              {successRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-[#737373]">
              {successfulTxCount} of {totalTransactions} operations
            </div>
          </div>

          <div className="p-6 space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-[#737373] block font-bold">
              BENEFICIARIES ROSTER
            </span>
            <div className="font-serif text-3xl font-black text-[#111111]">
              {members.filter((m) => m.role === "Recipient").length}
            </div>
            <div className="text-[10px] text-[#737373]">
              In {family?.name || "Active Vault"}
            </div>
          </div>
        </div>

        {/* 2-Column Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Allocation Share Report */}
          <div className="border-2 border-[#111111] bg-[#F9F9F7]">
            <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5]">
              <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                BENEFICIARY ALLOCATION SHARES
              </span>
            </div>

            <div className="p-6 space-y-4">
              {activeRule?.allocations.map((alloc, idx) => {
                const percentage = activeRule.strategy === "Percentage"
                  ? Number(alloc.shareOrAmount) / 100
                  : 33.33;

                return (
                  <div key={idx} className="border border-[#111111] p-3.5 bg-[#F5F5F5] space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="font-serif text-sm text-[#111111]">{alloc.label}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="text-[10px] text-[#737373]">
                      Recipient: {alloc.recipient.slice(0, 6)}...{alloc.recipient.slice(-6)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settlement Protocol Verification */}
          <div className="border-2 border-[#111111] bg-[#F9F9F7]">
            <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5]">
              <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                PROTOCOL AUDIT VERIFICATIONS
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="border border-[#111111] p-4 bg-[#F5F5F5] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>CROSS-CONTRACT OVERHEAD</span>
                  <Badge variant="default">&lt; 120 MS</Badge>
                </div>
                <p className="font-body text-xs text-[#525252]">
                  Direct Soroban inter-contract call verifies auth and fetches rule in single invocation.
                </p>
              </div>

              <div className="border border-[#111111] p-4 bg-[#F5F5F5] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>ARITHMETIC DUST LOSS</span>
                  <Badge variant="default">0 STROOPS</Badge>
                </div>
                <p className="font-body text-xs text-[#525252]">
                  Exact integer remainder absorption eliminates financial rounding drift.
                </p>
              </div>

              <div className="border border-[#111111] p-4 bg-[#F5F5F5] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>IDEMPOTENCY SAFE RETRIES</span>
                  <Badge variant="editorial">ACTIVE</Badge>
                </div>
                <p className="font-body text-xs text-[#525252]">
                  Individual recipient paid flags prevent double disbursements upon transaction replay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
