"use client";

import React, { useState } from "react";
import {
  History,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useTransactionStore } from "@/state/use-transaction-store";
import { useActivityStore } from "@/state/use-activity-store";
import { StatusBadge } from "@/components/shared/status-badge";
import { AmountDisplay } from "@/components/shared/amount-display";
import { ExplorerLink } from "@/components/shared/explorer-link";
import { formatTimestamp } from "@/lib/formatters";
import { TransactionStatus } from "@/types";

export default function TransactionsPage() {
  const { transactions, filterStatus, setFilterStatus, getFilteredTransactions, updateStatus } = useTransactionStore();
  const { addEvent } = useActivityStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [retryingHash, setRetryingHash] = useState<string | null>(null);

  const filtered = getFilteredTransactions().filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.hash.toLowerCase().includes(q) ||
      tx.type.toLowerCase().includes(q) ||
      (tx.familyName && tx.familyName.toLowerCase().includes(q))
    );
  });

  const handleRetry = async (hash: string) => {
    setRetryingHash(hash);
    updateStatus(hash, "PROCESSING");

    // Simulate safe retry on-chain
    await new Promise((res) => setTimeout(res, 2000));

    updateStatus(hash, "CONFIRMED");
    addEvent({
      id: `evt-${Date.now()}-retry`,
      type: "DISTRIBUTION_COMPLETED",
      familyId: 1,
      actor: "Sender",
      timestamp: Date.now(),
      txHash: hash,
      details: `Safely retried and finalized pending recipient payouts for transaction ${hash.slice(0, 8)}...`,
    });

    setRetryingHash(null);
  };

  const statusFilters: (TransactionStatus | "ALL")[] = [
    "ALL",
    "CONFIRMED",
    "PENDING",
    "PROCESSING",
    "RETRYABLE",
    "FAILED",
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Transaction Center
              </h1>
              <Badge variant="stellar">Lifecycle Tracked</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Authoritative on-chain transaction lifecycle states, cryptographic proofs, and retry controls.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === s
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full md:w-64 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by hash, type, family..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Transaction Records ({filtered.length})</CardTitle>
            <CardDescription>
              Real-time ledger state for family deposits, rule activations, and payouts.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No transaction records match the selected filter.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Family Group</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Transaction Hash</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tx) => (
                    <TableRow key={tx.hash}>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {tx.type.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {tx.familyName || "Family #1"}
                      </TableCell>
                      <TableCell>
                        {tx.amount ? (
                          <AmountDisplay stroops={tx.amount} size="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tx.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimestamp(tx.createdAt)}
                      </TableCell>
                      <TableCell>
                        <ExplorerLink type="tx" value={tx.hash} />
                      </TableCell>
                      <TableCell className="text-right">
                        {(tx.status === "RETRYABLE" || tx.status === "FAILED") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(tx.hash)}
                            disabled={retryingHash === tx.hash}
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${retryingHash === tx.hash ? "animate-spin" : ""}`} />
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
