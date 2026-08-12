"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Percent,
  Zap,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useFamilyStore } from "@/state/use-family-store";
import { useWalletStore } from "@/state/use-wallet-store";
import { useTransactionStore } from "@/state/use-transaction-store";
import { useActivityStore } from "@/state/use-activity-store";
import { AllocationStrategy, AllocationItem } from "@/types";
import { xlmToStroops, bpsToPercentage } from "@/lib/formatters";

interface BuilderItem {
  recipient: string;
  amountStr: string; // e.g. "50" for 50%, or "500" for 500 XLM
  label: string;
}

export default function RuleBuilderPage() {
  const router = useRouter();
  const { families, selectedFamilyId, getSelectedFamily, createRule, activateRule } = useFamilyStore();
  const { address } = useWalletStore();
  const { addTransaction } = useTransactionStore();
  const { addEvent } = useActivityStore();

  const family = getSelectedFamily();
  const members = family?.members || [];
  const recipientMembers = members.filter((m) => m.role === "Recipient");

  const [strategy, setStrategy] = useState<AllocationStrategy>("Percentage");
  const [items, setItems] = useState<BuilderItem[]>([
    {
      recipient: recipientMembers[0]?.address || members[0]?.address || "",
      amountStr: "50",
      label: "Parents Support",
    },
    {
      recipient: recipientMembers[1]?.address || members[1]?.address || "",
      amountStr: "30",
      label: "Sibling Tuition",
    },
    {
      recipient: recipientMembers[2]?.address || members[2]?.address || "",
      amountStr: "20",
      label: "Emergency Reserve",
    },
  ]);

  const [autoActivate, setAutoActivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Live Math Validation
  let isValid = true;
  let validationMessage = "";

  if (strategy === "Percentage") {
    const totalPct = items.reduce((acc, it) => acc + (parseFloat(it.amountStr) || 0), 0);
    const roundedTotal = Math.round(totalPct * 100) / 100;
    if (Math.abs(roundedTotal - 100) > 0.001) {
      isValid = false;
      validationMessage = `Total allocation is currently ${roundedTotal}% (Must equal exactly 100%).`;
    }
  } else if (strategy === "FixedAmount") {
    const hasZero = items.some((it) => (parseFloat(it.amountStr) || 0) <= 0);
    if (hasZero) {
      isValid = false;
      validationMessage = "All fixed amounts must be greater than 0 XLM.";
    }
  } else if (strategy === "Waterfall") {
    // Valid by default
  }

  // Check for duplicate recipients
  const recipientSet = new Set(items.map((it) => it.recipient).filter(Boolean));
  if (recipientSet.size !== items.filter((it) => it.recipient).length) {
    isValid = false;
    validationMessage = "Each beneficiary recipient address must be unique.";
  }

  const handleAddItem = () => {
    const unusedMember = recipientMembers.find(
      (m) => !items.some((it) => it.recipient === m.address)
    );

    setItems([
      ...items,
      {
        recipient: unusedMember?.address || "",
        amountStr: strategy === "Percentage" ? "10" : "100",
        label: unusedMember?.name || `Beneficiary ${items.length + 1}`,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof BuilderItem, value: string) => {
    setItems(
      items.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !family) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const creator = address || family.owner;

      const formattedAllocations: AllocationItem[] = items.map((it) => {
        if (strategy === "Percentage") {
          const bps = BigInt(Math.round((parseFloat(it.amountStr) || 0) * 100));
          return {
            recipient: it.recipient,
            shareOrAmount: bps,
            label: it.label,
          };
        } else if (strategy === "FixedAmount") {
          const stroops = xlmToStroops(it.amountStr);
          return {
            recipient: it.recipient,
            shareOrAmount: stroops,
            label: it.label,
          };
        } else {
          // Waterfall
          const stroops = it.amountStr === "0" || !it.amountStr ? 0n : xlmToStroops(it.amountStr);
          return {
            recipient: it.recipient,
            shareOrAmount: stroops,
            label: it.label,
          };
        }
      });

      const newVersion = await createRule(family.id, strategy, formattedAllocations, creator);

      if (autoActivate) {
        await activateRule(family.id, newVersion);
      }

      const fakeHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      addTransaction({
        hash: fakeHash,
        type: "CREATE_RULE",
        status: "CONFIRMED",
        familyId: family.id,
        familyName: family.name,
        depositor: creator,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      addEvent({
        id: `evt-${Date.now()}`,
        type: "RULE_CREATED",
        familyId: family.id,
        actor: creator,
        timestamp: Date.now(),
        txHash: fakeHash,
        details: `Created programmable Rule Version ${newVersion} (${strategy})`,
      });

      router.push("/rules");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create rule on-chain");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-6">
          <div className="space-y-1">
            <Link
              href="/rules"
              className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to Split Rules
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Programmable Rule Builder
            </h1>
            <p className="text-sm text-muted-foreground">
              Define deterministic split algorithms for <span className="font-semibold text-foreground">{family?.name}</span>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Strategy Selection */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">1. Choose Allocation Strategy</CardTitle>
              <CardDescription>
                Select how the smart contract will compute multi-recipient splits upon deposit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setStrategy("Percentage")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    strategy === "Percentage"
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                    <Percent className="h-4 w-4 text-blue-600" />
                    <span>Percentage Split</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Recipients receive exact basis point percentages of the deposit. Sum = 100%.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStrategy("FixedAmount")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    strategy === "FixedAmount"
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    <span>Fixed Amounts</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Recipients receive predefined fixed XLM sums. Total must match deposit.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStrategy("Waterfall")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    strategy === "Waterfall"
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                    <Sliders className="h-4 w-4 text-purple-600" />
                    <span>Priority Waterfall</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Priority tiers receive up to a max cap; last tier receives all remaining balance.
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Allocation Items */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">2. Configure Beneficiary Allocations</CardTitle>
                <CardDescription>
                  Select approved family recipients and set their allocated shares or caps.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Beneficiary
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  {/* Label */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Label / Purpose
                    </label>
                    <Input
                      placeholder="e.g. Parents Support"
                      value={item.label}
                      onChange={(e) => handleItemChange(index, "label", e.target.value)}
                      required
                    />
                  </div>

                  {/* Recipient Member */}
                  <div className="md:col-span-5 space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Family Recipient
                    </label>
                    <select
                      value={item.recipient}
                      onChange={(e) => handleItemChange(index, "recipient", e.target.value)}
                      className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Recipient...</option>
                      {members.map((m) => (
                        <option key={m.address} value={m.address}>
                          {m.name} ({m.role}) — {m.address.slice(0, 4)}...{m.address.slice(-4)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Share / Amount */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      {strategy === "Percentage" ? "Share (%)" : "Amount (XLM)"}
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder={strategy === "Percentage" ? "50" : "500"}
                      value={item.amountStr}
                      onChange={(e) => handleItemChange(index, "amountStr", e.target.value)}
                      required
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="md:col-span-1 flex justify-end pt-5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t p-4 gap-4 bg-slate-50/30 dark:bg-slate-900/30">
              <div className="text-xs">
                {strategy === "Percentage" && (
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-muted-foreground">Total:</span>
                    <span
                      className={`font-bold ${
                        isValid ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {items.reduce((acc, it) => acc + (parseFloat(it.amountStr) || 0), 0).toFixed(2)}%
                    </span>
                    {isValid && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  </div>
                )}

                {strategy === "FixedAmount" && (
                  <div className="text-muted-foreground">
                    Total Fixed Target: <span className="font-bold text-foreground">{items.reduce((acc, it) => acc + (parseFloat(it.amountStr) || 0), 0)} XLM</span>
                  </div>
                )}

                {strategy === "Waterfall" && (
                  <div className="text-muted-foreground">
                    Waterfall tiers evaluated top-to-bottom upon deposit.
                  </div>
                )}
              </div>

              {!isValid && (
                <div className="flex items-center space-x-1.5 text-xs text-amber-600 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{validationMessage}</span>
                </div>
              )}
            </CardFooter>
          </Card>

          {/* Step 3: Activation Preferences & Submit */}
          <Card className="border shadow-sm">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoActivate}
                  onChange={(e) => setAutoActivate(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Immediately activate this rule version for future deposits
                </span>
              </label>

              <Button
                type="submit"
                size="lg"
                disabled={!isValid || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-md shadow-blue-600/20 w-full sm:w-auto"
              >
                {isSubmitting ? "Creating Rule On-Chain..." : "Deploy Rule Version"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}
