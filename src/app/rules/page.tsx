"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  Plus,
  CheckCircle2,
  Check,
  Percent,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFamilyStore } from "@/state/use-family-store";
import { useWalletStore } from "@/state/use-wallet-store";
import { useTransactionStore } from "@/state/use-transaction-store";
import { useActivityStore } from "@/state/use-activity-store";
import { AddressPill } from "@/components/shared/address-pill";
import { formatTimestamp, bpsToPercentage, stroopsToXlm } from "@/lib/formatters";

export default function RulesPage() {
  const { families, selectedFamilyId, rules, getSelectedFamily, activateRule, deactivateRule } = useFamilyStore();
  const { address } = useWalletStore();
  const { addTransaction } = useTransactionStore();
  const { addEvent } = useActivityStore();

  const family = getSelectedFamily();
  const familyRules = rules[selectedFamilyId] || [];

  const [loadingVersion, setLoadingVersion] = useState<number | null>(null);

  const handleActivate = async (version: number) => {
    if (!family) return;
    setLoadingVersion(version);
    try {
      await activateRule(family.id, version);

      const fakeHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      addTransaction({
        hash: fakeHash,
        type: "ACTIVATE_RULE",
        status: "CONFIRMED",
        familyId: family.id,
        familyName: family.name,
        depositor: address || family.owner,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      addEvent({
        id: `evt-${Date.now()}`,
        type: "RULE_ACTIVATED",
        familyId: family.id,
        actor: address || family.owner,
        timestamp: Date.now(),
        txHash: fakeHash,
        details: `Activated Rule Version ${version} for ${family.name}`,
      });
    } finally {
      setLoadingVersion(null);
    }
  };

  const handleDeactivate = async () => {
    if (!family) return;
    if (confirm("Are you sure you want to deactivate the active rule? Deposits will be paused until a new rule is activated.")) {
      await deactivateRule(family.id);

      const fakeHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      addTransaction({
        hash: fakeHash,
        type: "ACTIVATE_RULE",
        status: "CONFIRMED",
        familyId: family.id,
        familyName: family.name,
        depositor: address || family.owner,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      addEvent({
        id: `evt-${Date.now()}`,
        type: "RULE_DEACTIVATED",
        familyId: family.id,
        actor: address || family.owner,
        timestamp: Date.now(),
        txHash: fakeHash,
        details: `Deactivated active rule for ${family.name}`,
      });
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b-4 border-[#111111] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#737373] block">
              ALGORITHMIC SPLIT RULES · ON-CHAIN VERSIONING
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-[#111111]">
              Rule Version Archive
            </h1>
            <p className="font-body text-xs sm:text-sm text-[#525252]">
              Historical ledger of programmable remittance rules and active distribution algorithms.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/rules/builder">
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Build New Rule
              </Button>
            </Link>
          </div>
        </div>

        {/* Rules Archive */}
        <div className="space-y-6">
          {familyRules.length === 0 ? (
            <div className="border-2 border-dashed border-[#111111] p-12 text-center space-y-4">
              <Sliders className="h-10 w-10 mx-auto text-[#737373]" />
              <h3 className="font-serif text-xl font-bold text-[#111111]">No Rules Formulated Yet</h3>
              <p className="font-body text-xs text-[#525252] max-w-sm mx-auto">
                Define how remittances should be split among family members using percentages, fixed amounts, or waterfall priorities.
              </p>
              <Link href="/rules/builder">
                <Button variant="default" size="sm">
                  Create First Split Rule
                </Button>
              </Link>
            </div>
          ) : (
            familyRules.map((rule) => {
              const isActive = family?.activeRuleVersion === rule.version;

              return (
                <div
                  key={rule.version}
                  className={`border-2 border-[#111111] bg-[#F9F9F7] ${
                    isActive ? "shadow-[6px_6px_0px_0px_#111111]" : "opacity-90"
                  }`}
                >
                  <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-serif text-xl font-bold text-[#111111]">
                          Rule Version {rule.version}
                        </span>
                        <Badge variant={rule.strategy === "Percentage" ? "default" : "secondary"}>
                          {rule.strategy}
                        </Badge>
                        {isActive && (
                          <Badge variant="editorial">
                            ● ACTIVE IN PROTOCOL
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-[#737373] block uppercase tracking-wider">
                        Created by {rule.createdBy.slice(0, 6)}... on {formatTimestamp(rule.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeactivate}
                          className="border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white"
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          disabled={loadingVersion === rule.version}
                          onClick={() => handleActivate(rule.version)}
                        >
                          <Check className="h-4 w-4 mr-1.5" />
                          {loadingVersion === rule.version ? "Activating..." : "Set as Active Rule"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 border border-[#111111] divide-y md:divide-y-0 md:divide-x divide-[#111111] bg-[#F5F5F5] font-mono text-xs">
                      {rule.allocations.map((alloc, idx) => (
                        <div key={idx} className="p-4 space-y-2">
                          <div className="flex items-center justify-between font-bold">
                            <span className="font-serif text-sm text-[#111111]">{alloc.label}</span>
                            <span className="text-[#111111] font-black">
                              {rule.strategy === "Percentage"
                                ? bpsToPercentage(alloc.shareOrAmount)
                                : rule.strategy === "FixedAmount"
                                ? `${stroopsToXlm(alloc.shareOrAmount)} XLM`
                                : alloc.shareOrAmount === 0n
                                ? "Remainder"
                                : `≤ ${stroopsToXlm(alloc.shareOrAmount)} XLM`}
                            </span>
                          </div>
                          <AddressPill address={alloc.recipient} showExplorer={false} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
