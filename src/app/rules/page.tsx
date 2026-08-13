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
  const { families, selectedFamilyId, getSelectedFamily, rules, activateRule, deactivateRule, syncOnChainState } =
    useFamilyStore();
  const { address, isConnected, connect, getSignerOptions } = useWalletStore();
  const { addTransaction } = useTransactionStore();
  const { addEvent } = useActivityStore();

  const userFamilies = address
    ? families.filter((f) => f.owner === address || f.members?.some((m) => m.address === address))
    : [];

  const family = getSelectedFamily();
  const familyRules = selectedFamilyId ? rules[selectedFamilyId] || [] : [];

  const [loadingVersion, setLoadingVersion] = useState<number | null>(null);

  React.useEffect(() => {
    if (selectedFamilyId > 0) {
      syncOnChainState(selectedFamilyId);
    }
  }, [selectedFamilyId, syncOnChainState]);

  const handleActivate = async (version: number) => {
    if (!family) return;
    if (!address) {
      alert("Please connect your Stellar wallet first.");
      return;
    }
    setLoadingVersion(version);
    try {
      const caller = address;
      const signerOpts = getSignerOptions();
      const hash = await activateRule(family.id, version, caller, signerOpts);

      if (hash) {
        addTransaction({
          hash,
          type: "ACTIVATE_RULE",
          status: "CONFIRMED",
          familyId: family.id,
          familyName: family.name,
          depositor: caller,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        addEvent({
          id: `evt-${Date.now()}`,
          type: "RULE_ACTIVATED",
          familyId: family.id,
          actor: caller,
          timestamp: Date.now(),
          txHash: hash,
          details: `Activated Rule Version ${version} for ${family.name} on Stellar Testnet`,
        });
      }

      await syncOnChainState(family.id);
    } catch (err: any) {
      alert(err.message || "Failed to activate rule on-chain");
    } finally {
      setLoadingVersion(null);
    }
  };

  const handleDeactivate = async () => {
    if (!family) return;
    if (!address) {
      alert("Please connect your Stellar wallet first.");
      return;
    }
    if (confirm("Are you sure you want to deactivate the active rule? Deposits will be paused until a new rule is activated.")) {
      const caller = address;
      const signerOpts = getSignerOptions();
      try {
        const hash = await deactivateRule(family.id, caller, signerOpts);

        if (hash) {
          addTransaction({
            hash,
            type: "ACTIVATE_RULE",
            status: "CONFIRMED",
            familyId: family.id,
            familyName: family.name,
            depositor: caller,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          addEvent({
            id: `evt-${Date.now()}`,
            type: "RULE_DEACTIVATED",
            familyId: family.id,
            actor: caller,
            timestamp: Date.now(),
            txHash: hash,
            details: `Deactivated active rule for ${family.name} on Stellar Testnet`,
          });
        }

        await syncOnChainState(family.id);
      } catch (err: any) {
        alert(err.message || "Failed to deactivate rule on-chain");
      }
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-[#111111] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block">
              ALGORITHMIC SPLIT RULES · ON-CHAIN VERSIONING
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#111111]">
              Rule Version Archive
            </h1>
            <p className="font-body text-xs text-[#525252]">
              Historical ledger of programmable remittance rules and active distribution algorithms.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/rules/builder">
              <Button variant="default" size="sm" disabled={!family}>
                <Plus className="h-4 w-4 mr-1.5" />
                Build New Rule
              </Button>
            </Link>
          </div>
        </div>

        {/* Rules View */}
        {!isConnected ? (
          <div className="border-2 border-dashed border-[#111111] p-12 text-center space-y-4 bg-[#F9F9F7]">
            <Sliders className="h-10 w-10 mx-auto text-[#737373]" />
            <h3 className="font-serif text-xl font-bold text-[#111111]">
              No Stellar Wallet Connected
            </h3>
            <p className="font-body text-xs text-[#525252] max-w-md mx-auto">
              Connect your Stellar Testnet wallet to view and manage programmable remittance split rules for your family group.
            </p>
            <Button variant="default" onClick={() => connect()}>
              Connect Stellar Wallet
            </Button>
          </div>
        ) : !family ? (
          <div className="border-2 border-dashed border-[#111111] p-12 text-center space-y-4 bg-[#F9F9F7]">
            <Sliders className="h-10 w-10 mx-auto text-[#737373]" />
            <h3 className="font-serif text-xl font-bold text-[#111111]">
              No On-Chain Family Vault Selected
            </h3>
            <p className="font-body text-xs text-[#525252] max-w-md mx-auto">
              {userFamilies.length > 0
                ? "Select a family vault from the sidebar to view its algorithmic rule archive."
                : "No family records registered yet on Stellar Testnet for your account. Register a family group first before creating split rules."}
            </p>
            <Link href="/families">
              <Button variant="default">
                Go to Family Registry
              </Button>
            </Link>
          </div>
        ) : (
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
      )}
    </div>
    </AppShell>
  );
}
