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

    await new Promise((res) => setTimeout(res, 2000));

    updateStatus(hash, "CONFIRMED");
    addEvent({
      id: `evt-${Date.now()}-retry`,
      type: "DISTRIBUTION_COMPLETED",
      familyId: 1,
      actor: "Sender",
      timestamp: Date.now(),
      txHash: hash,
      details: `Safely retried pending beneficiary dispatches for tx ${hash.slice(0, 8)}...`,
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
      <div className="space-y-6 font-mono text-xs">
        {/* Header */}
        <div className="border-b-2 border-[#111111] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block">
              PERMANENT LEDGER GAZETTE · AUDIT PROOFS
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#111111]">
              Transaction Gazette
            </h1>
            <p className="font-body text-xs text-[#525252]">
              Cryptographic transaction lifecycle records, execution receipts, and safe retry controls.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="border-2 border-[#111111] bg-[#F5F5F5] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1 w-full md:w-auto">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 font-bold uppercase tracking-wider transition-colors border ${
                  filterStatus === s
                    ? "border-[#111111] bg-[#111111] text-[#F9F9F7]"
                    : "border-transparent text-[#525252] hover:border-[#111111] hover:bg-[#E5E5E0]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full md:w-64 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
            <Input
              placeholder="Search hash, type, family..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border-2 border-[#111111] bg-[#F9F9F7]">
          <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
              DISPATCH ENTRIES ({filtered.length})
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[#737373]">
              No dispatch records match the selected criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation Type</TableHead>
                  <TableHead>Family Vault</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Ledger Time</TableHead>
                  <TableHead>Transaction Hash</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.hash}>
                    <TableCell className="font-serif font-bold text-sm text-[#111111]">
                      {tx.type.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-xs text-[#525252]">
                      {tx.familyName || "Family #1"}
                    </TableCell>
                    <TableCell>
                      {tx.amount ? (
                        <AmountDisplay stroops={tx.amount} size="sm" />
                      ) : (
                        <span className="text-[#737373]">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell className="text-xs text-[#737373]">
                      {formatTimestamp(tx.createdAt)}
                    </TableCell>
                    <TableCell>
                      <ExplorerLink type="tx" value={tx.hash} />
                    </TableCell>
                    <TableCell className="text-right">
                      {(tx.status === "RETRYABLE" || tx.status === "FAILED") && (
                        <Button
                          size="sm"
                          variant="editorial"
                          onClick={() => handleRetry(tx.hash)}
                          disabled={retryingHash === tx.hash}
                          className="text-[11px] h-7 px-3"
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
        </div>
      </div>
    </AppShell>
  );
}
