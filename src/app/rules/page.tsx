"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  Plus,
  CheckCircle2,
  AlertTriangle,
  History,
  Check,
  Percent,
  Zap,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Programmable Split Rules
              </h1>
              <Badge variant="stellar">Versioned</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Create, version, and activate deterministic remittance distribution algorithms.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/rules/builder">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20">
                <Plus className="h-4 w-4 mr-2" />
                Build New Rule
              </Button>
            </Link>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="space-y-6">
          {familyRules.length === 0 ? (
            <Card className="border border-dashed p-12 text-center">
              <Sliders className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <h3 className="text-lg font-bold">No Split Rules Created Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                Define how remittances should be split among family members using percentages, fixed amounts, or waterfall priorities.
              </p>
              <Link href="/rules/builder">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rule
                </Button>
              </Link>
            </Card>
          ) : (
            familyRules.map((rule) => {
              const isActive = family?.activeRuleVersion === rule.version;

              return (
                <Card
                  key={rule.version}
                  className={`border shadow-sm transition-all ${
                    isActive
                      ? "ring-2 ring-blue-500/50 bg-blue-50/10 dark:bg-blue-950/10"
                      : "opacity-90"
                  }`}
                >
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-lg">
                          Rule Version {rule.version}
                        </CardTitle>
                        <Badge
                          variant={
                            rule.strategy === "Percentage"
                              ? "stellar"
                              : rule.strategy === "FixedAmount"
                              ? "success"
                              : "warning"
                          }
                        >
                          {rule.strategy}
                        </Badge>
                        {isActive && <Badge variant="success">Active</Badge>}
                      </div>
                      <CardDescription>
                        Created by <span className="font-mono">{rule.createdBy.slice(0, 4)}...{rule.createdBy.slice(-4)}</span> on {formatTimestamp(rule.createdAt)}
                      </CardDescription>
                    </div>

                    <div className="flex items-center space-x-3">
                      {isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeactivate}
                          className="text-amber-600 border-amber-300 hover:bg-amber-50"
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={loadingVersion === rule.version}
                          onClick={() => handleActivate(rule.version)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                          <Check className="h-4 w-4 mr-1.5" />
                          {loadingVersion === rule.version ? "Activating..." : "Set as Active Rule"}
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {rule.allocations.map((alloc, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border bg-white dark:bg-slate-900/60 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-slate-100">
                            <span>{alloc.label}</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">
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
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
