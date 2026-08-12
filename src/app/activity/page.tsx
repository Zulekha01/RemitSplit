"use client";

import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Filter,
  Send,
  Sliders,
  DollarSign,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { useActivityStore } from "@/state/use-activity-store";
import { AmountDisplay } from "@/components/shared/amount-display";
import { ExplorerLink } from "@/components/shared/explorer-link";
import { formatTimestamp } from "@/lib/formatters";

export default function ActivityPage() {
  const { events, filterType, setFilterType, getFilteredEvents } = useActivityStore();
  const filteredEvents = getFilteredEvents();

  const eventFilters = [
    { label: "All Wire Feeds", value: "ALL" },
    { label: "Dispatches", value: "DISTRIBUTION_COMPLETED" },
    { label: "Payouts", value: "RECIPIENT_PAID" },
    { label: "Deposits", value: "DEPOSIT_FUNDED" },
    { label: "Rules", value: "RULE_ACTIVATED" },
    { label: "Family", value: "FAMILY_CREATED" },
  ];

  return (
    <AppShell>
      <div className="space-y-8 font-mono text-xs">
        {/* Header */}
        <div className="border-b-4 border-[#111111] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#737373] block">
              SOROBAN TELEGRAPH WIRE · LIVE EMISSIONS
            </span>
            <div className="flex items-center space-x-3">
              <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-[#111111]">
                Live Wire Feed
              </h1>
              <span className="text-[#CC0000] font-black text-sm animate-pulse">● LIVE STREAM</span>
            </div>
            <p className="font-body text-xs sm:text-sm text-[#525252]">
              Direct Soroban RPC event decodings emitted by Stellar Testnet contracts.
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="border-2 border-[#111111] bg-[#F5F5F5] p-3 flex flex-wrap items-center gap-1.5">
          <Filter className="h-4 w-4 text-[#737373] ml-1 mr-2" />
          {eventFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`px-3 py-1 font-bold uppercase tracking-wider transition-colors border ${
                filterType === f.value
                  ? "border-[#111111] bg-[#111111] text-[#F9F9F7]"
                  : "border-transparent text-[#525252] hover:border-[#111111] hover:bg-[#E5E5E0]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Wire Stream List */}
        <div className="border-2 border-[#111111] bg-[#F9F9F7]">
          <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
              RECORDED WIRE MESSAGES ({filteredEvents.length})
            </span>
          </div>

          <div className="divide-y-2 divide-[#111111]">
            {filteredEvents.length === 0 ? (
              <div className="py-16 text-center text-[#737373]">
                No telegram wire emissions recorded under this category.
              </div>
            ) : (
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-[#F5F5F5] transition-colors"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center space-x-2.5">
                      <Badge variant="default" className="text-[9px]">
                        {evt.type.replace("_", " ")}
                      </Badge>
                      <span className="text-[10px] text-[#737373]">
                        {formatTimestamp(evt.timestamp)}
                      </span>
                    </div>

                    <p className="font-serif font-bold text-base text-[#111111]">
                      {evt.details}
                    </p>

                    <div className="text-[11px] text-[#525252] flex flex-wrap items-center gap-3 pt-0.5">
                      <span>Family Vault: #{evt.familyId}</span>
                      {evt.recipient && (
                        <>
                          <span>·</span>
                          <span>Recipient: {evt.recipient.slice(0, 6)}...{evt.recipient.slice(-6)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end space-y-1.5 shrink-0 pt-2 sm:pt-0">
                    {evt.amount && <AmountDisplay stroops={evt.amount} size="sm" />}
                    {evt.txHash && <ExplorerLink type="tx" value={evt.txHash} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
