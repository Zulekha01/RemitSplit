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

  // Calculate metrics
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
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {family?.name || "Remittance Dashboard"}
              </h1>
              <Badge variant="stellar">Family #{family?.id || 1}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Automated cross-border family remittance rule and distribution hub.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/deposit">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20">
                <Send className="h-4 w-4 mr-2" />
                Deposit &amp; Split
              </Button>
            </Link>
          </div>
        </div>

        {/* Wallet Status Banner if disconnected */}
        {!isConnected && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-blue-900 dark:text-blue-200">
                  Connect your Stellar wallet to submit on-chain remittances.
                </span>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  You can explore current family allocations and testnet simulation right now.
                </p>
              </div>
            </div>
            <Button onClick={() => connect()} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium shrink-0">
              Connect Wallet
            </Button>
          </div>
        )}

        {/* Primary Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                Total Remitted
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <AmountDisplay stroops={totalDistributedStroops} size="xl" />
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <span>{successfulDistributions} completed distributions</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                Active Rule
              </CardTitle>
              <Sliders className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {activeRule ? `Version ${activeRule.version}` : "No Active Rule"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Strategy: <span className="font-medium text-foreground">{activeRule?.strategy || "None"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                Family Recipients
              </CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {members.filter((m) => m.role === "Recipient").length} Approved
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total members: <span className="font-medium text-foreground">{members.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                Pending Execution
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {pendingDistributions}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {pendingDistributions === 0 ? "All distributions settled" : "Processing transactions"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Allocation Rule Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <CardTitle>Active Split Rule Allocations</CardTitle>
                  {activeRule && <Badge variant="success">Active v{activeRule.version}</Badge>}
                </div>
                <CardDescription className="mt-1">
                  On-chain allocation percentages executed automatically upon sender deposit.
                </CardDescription>
              </div>
              <Link href="/rules/builder">
                <Button variant="outline" size="sm">
                  <Sliders className="h-3.5 w-3.5 mr-1.5" />
                  Edit / New Rule
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="space-y-5">
              {activeRule && activeRule.allocations.length > 0 ? (
                activeRule.allocations.map((alloc, idx) => {
                  const sharePercentage = activeRule.strategy === "Percentage"
                    ? Number(alloc.shareOrAmount) / 100
                    : activeRule.strategy === "FixedAmount"
                    ? 33.33
                    : 40;

                  return (
                    <div key={idx} className="space-y-2 p-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {alloc.label || `Beneficiary ${idx + 1}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {activeRule.strategy === "Percentage"
                              ? bpsToPercentage(alloc.shareOrAmount)
                              : activeRule.strategy === "FixedAmount"
                              ? `${stroopsToXlm(alloc.shareOrAmount)} XLM (Fixed)`
                              : alloc.shareOrAmount === 0n
                              ? "Remaining Balance"
                              : `Up to ${stroopsToXlm(alloc.shareOrAmount)} XLM`}
                          </span>
                        </div>
                      </div>

                      <Progress value={sharePercentage} className="h-2" />

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <AddressPill address={alloc.recipient} showExplorer={false} />
                        <span>Recipient #{idx + 1}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No active rule configured. Create a rule to start splitting remittances.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Family Snapshot */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Family Members</CardTitle>
              <Link href="/families">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                  Manage
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.address}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-white dark:bg-slate-900/80 text-xs"
                >
                  <div className="flex flex-col space-y-0.5">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {member.name}
                    </span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {member.address.slice(0, 4)}...{member.address.slice(-4)}
                    </span>
                  </div>
                  <Badge
                    variant={
                      member.role === "Sender"
                        ? "stellar"
                        : member.role === "CoAdmin"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {member.role}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Distributions */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Remittance Distributions</CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                  View All
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 3).map((tx) => (
                  <div
                    key={tx.hash}
                    className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {tx.type.replace("_", " ")}
                        </span>
                        <StatusBadge status={tx.status} />
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        {formatTimestamp(tx.createdAt)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      {tx.amount && <AmountDisplay stroops={tx.amount} size="sm" />}
                      <ExplorerLink type="tx" value={tx.hash} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Real-time Blockchain Activity */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base">Live Activity Feed</CardTitle>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <Link href="/activity">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                  Full Stream
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.slice(0, 4).map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start space-x-3 p-2.5 rounded-lg border bg-white dark:bg-slate-900/80 text-xs"
                  >
                    <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {evt.details}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{formatTimestamp(evt.timestamp)}</span>
                        {evt.txHash && <ExplorerLink type="tx" value={evt.txHash} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
