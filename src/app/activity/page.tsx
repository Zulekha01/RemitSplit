"use client";

import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Filter,
  ArrowRightLeft,
  Users,
  Sliders,
  DollarSign,
  Send,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActivityStore } from "@/state/use-activity-store";
import { AmountDisplay } from "@/components/shared/amount-display";
import { AddressPill } from "@/components/shared/address-pill";
import { ExplorerLink } from "@/components/shared/explorer-link";
import { formatTimestamp } from "@/lib/formatters";

export default function ActivityPage() {
  const { events, filterType, setFilterType, getFilteredEvents } = useActivityStore();
  const filteredEvents = getFilteredEvents();

  const eventFilters = [
    { label: "All Events", value: "ALL" },
    { label: "Distributions", value: "DISTRIBUTION_COMPLETED" },
    { label: "Recipient Payouts", value: "RECIPIENT_PAID" },
    { label: "Deposits", value: "DEPOSIT_FUNDED" },
    { label: "Rules", value: "RULE_ACTIVATED" },
    { label: "Family", value: "FAMILY_CREATED" },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case "DISTRIBUTION_COMPLETED":
        return <Send className="h-4 w-4 text-emerald-500" />;
      case "RECIPIENT_PAID":
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case "DEPOSIT_FUNDED":
      case "DEPOSIT_CREATED":
        return <ArrowRightLeft className="h-4 w-4 text-indigo-500" />;
      case "RULE_ACTIVATED":
      case "RULE_CREATED":
        return <Sliders className="h-4 w-4 text-amber-500" />;
      case "FAMILY_CREATED":
      case "MEMBER_ADDED":
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Real-Time Activity Feed
              </h1>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Live Soroban RPC event stream decoded from Stellar Testnet contract logs.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border shadow-sm">
          <Filter className="h-4 w-4 text-muted-foreground ml-1 mr-2" />
          {eventFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === f.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Event Stream List */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Blockchain Audit Trail ({filteredEvents.length} Events)</CardTitle>
            <CardDescription>
              Every family split, deposit, and recipient transfer is permanently verifiable on Stellar.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No events recorded for this category.
              </div>
            ) : (
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border shadow-sm shrink-0 mt-0.5">
                      {getEventIcon(evt.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {evt.details}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {evt.type.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-[11px] pt-1">
                        <span>Family ID: #{evt.familyId}</span>
                        <span>•</span>
                        <span>{formatTimestamp(evt.timestamp)}</span>
                        {evt.recipient && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-foreground">
                              Recipient: {evt.recipient.slice(0, 4)}...{evt.recipient.slice(-4)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end space-y-1.5 shrink-0 pt-2 sm:pt-0">
                    {evt.amount && <AmountDisplay stroops={evt.amount} size="sm" />}
                    {evt.txHash && <ExplorerLink type="tx" value={evt.txHash} />}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
