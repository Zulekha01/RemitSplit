"use client";

import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useFamilyStore } from "@/state/use-family-store";
import { useWalletStore } from "@/state/use-wallet-store";
import { useTransactionStore } from "@/state/use-transaction-store";
import { useActivityStore } from "@/state/use-activity-store";
import { AllocationStrategy, AllocationItem } from "@/types";
import { xlmToStroops, bpsToPercentage } from "@/lib/formatters";

interface BuilderItem {
  recipient: string;
  amountStr: string;
  label: string;
}

export default function RuleBuilderPage() {
  const router = useRouter();
  const { families, selectedFamilyId, getSelectedFamily, createRule, activateRule, syncOnChainState } = useFamilyStore();
  const { address, isConnected, connect, getSignerOptions } = useWalletStore();
  const { addTransaction } = useTransactionStore();
  const { addEvent } = useActivityStore();

  const family = getSelectedFamily();
  const members = useMemo(() => family?.members ?? [], [family?.members]);
  const recipientMembers = useMemo(
    () => members.filter((member) => member.role === "Recipient"),
    [members]
  );
  const currentMember = members.find((member) => member.address === address);
  const canCreateRule = currentMember?.role === "Sender" || currentMember?.role === "CoAdmin";
  const canActivateRule = currentMember?.role === "Sender";

  const [strategy, setStrategy] = useState<AllocationStrategy>("Percentage");
  const [items, setItems] = useState<BuilderItem[]>([]);

  // A family can be selected after the app-wide bootstrap has completed.
  // Refresh its full roster before deriving allocation rows from recipients.
  React.useEffect(() => {
    if (selectedFamilyId > 0) {
      syncOnChainState(selectedFamilyId);
    }
  }, [selectedFamilyId, syncOnChainState]);

  // Initialize items dynamically from on-chain recipient members
  React.useEffect(() => {
    if (items.length === 0 && recipientMembers.length > 0) {
      const count = recipientMembers.length;
      if (strategy === "Percentage") {
        const baseShare = Math.floor(10000 / count) / 100;
        const remainder = Math.round((100 - baseShare * count) * 100) / 100;
        setItems(
          recipientMembers.map((m, idx) => ({
            recipient: m.address,
            amountStr: (idx === count - 1 ? baseShare + remainder : baseShare).toFixed(2),
            label: m.name,
          }))
        );
      } else {
        setItems(
          recipientMembers.map((m) => ({
            recipient: m.address,
            amountStr: "100",
            label: m.name,
          }))
        );
      }
    }
  }, [recipientMembers, items.length, strategy]);

  const [autoActivate, setAutoActivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // CoAdmins can create a rule but only a Sender can activate one. Prevent a
  // successful create from being followed by a guaranteed failing transaction.
  React.useEffect(() => {
    if (!canActivateRule) {
      setAutoActivate(false);
    }
  }, [canActivateRule]);

  // Validation
  let isValid = true;
  let validationMessage = "";

  if (items.length === 0) {
    isValid = false;
    validationMessage = "At least one recipient allocation must be specified.";
  }

  const hasEmptyRecipient = items.some((it) => !it.recipient);
  if (hasEmptyRecipient) {
    isValid = false;
    validationMessage = "All allocation rows must have an assigned family beneficiary.";
  }

  if (strategy === "Percentage") {
    const totalPercentage = items.reduce(
      (acc, it) => acc + (parseFloat(it.amountStr) || 0),
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.001) {
      isValid = false;
      validationMessage = `Total percentage must sum to exactly 100.00% (currently ${totalPercentage.toFixed(2)}%).`;
    }
  } else if (strategy === "FixedAmount") {
    const hasZero = items.some((it) => (parseFloat(it.amountStr) || 0) <= 0);
    if (hasZero) {
      isValid = false;
      validationMessage = "All fixed amounts must be greater than 0 XLM.";
    }
  }

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

    if (!address) {
      setErrorMsg("Please connect your Stellar wallet first.");
      return;
    }

    if (!family) {
      setErrorMsg("Select a family vault before creating a rule.");
      return;
    }

    if (!canCreateRule) {
      setErrorMsg("Only a registered Sender or CoAdmin can create a rule for this family.");
      return;
    }

    if (!isValid) {
      setErrorMsg(validationMessage || "Complete the allocation details before creating the rule.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const creator = address;
      const signerOpts = getSignerOptions();

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
          const stroops = it.amountStr === "0" || !it.amountStr ? 0n : xlmToStroops(it.amountStr);
          return {
            recipient: it.recipient,
            shareOrAmount: stroops,
            label: it.label,
          };
        }
      });

      const { version: newVersion, hash: createHash } = await createRule(
        family.id,
        strategy,
        formattedAllocations,
        creator,
        signerOpts
      );

      let activeHash: string | undefined;
      if (autoActivate) {
        activeHash = await activateRule(family.id, newVersion, creator, signerOpts);
      }

      const txHash = activeHash || createHash;
      if (txHash) {
        addTransaction({
          hash: txHash,
          type: "CREATE_RULE",
          status: "CONFIRMED",
          familyId: family.id,
          familyName: family.name,
          depositor: creator,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      await Promise.all([
        syncOnChainState(family.id),
        useActivityStore.getState().syncOnChainEvents(),
        useTransactionStore.getState().syncOnChainTransactions(),
      ]);
      if (!autoActivate) {
        setErrorMsg("Rule version created on-chain. A registered Sender must activate it before dispatches can use it.");
      }
      router.push("/rules");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to deploy rule on-chain");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-2 border-[#111111] pb-3">
          <Link
            href="/rules"
            className="inline-flex items-center font-mono text-[11px] uppercase font-bold text-[#111111] hover:text-[#CC0000] mb-2"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            BACK TO RULES ARCHIVE
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block">
            DETERMINISTIC ALGORITHM BUILDER
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#111111]">
            Program Split Rule
          </h1>
          <p className="font-body text-xs text-[#525252]">
            Formulate mathematically enforced remittance distribution parameters for <span className="font-bold text-[#111111]">{family?.name || "Family Vault"}</span>.
          </p>
        </div>

        {!isConnected ? (
          <div className="border-2 border-dashed border-[#111111] p-12 text-center space-y-4 bg-[#F9F9F7]">
            <Sliders className="h-10 w-10 mx-auto text-[#737373]" />
            <h3 className="font-serif text-xl font-bold text-[#111111]">
              No Stellar Wallet Connected
            </h3>
            <p className="font-body text-xs text-[#525252] max-w-md mx-auto">
              Connect your Stellar Testnet wallet to configure and deploy programmable remittance split rules.
            </p>
            <Button variant="default" onClick={() => connect()}>
              Connect Stellar Wallet
            </Button>
          </div>
        ) : !family ? (
          <div className="border-2 border-dashed border-[#111111] p-12 text-center space-y-4 bg-[#F9F9F7]">
            <Sliders className="h-10 w-10 mx-auto text-[#737373]" />
            <h3 className="font-serif text-xl font-bold text-[#111111]">
              No Family Vault Selected
            </h3>
            <p className="font-body text-xs text-[#525252] max-w-md mx-auto">
              Please register or select an active family vault before building split rules.
            </p>
            <Link href="/families">
              <Button variant="default">
                Go to Family Registry
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 font-mono text-xs">
          {errorMsg && (
            <div className="border-2 border-[#CC0000] p-3 text-[#CC0000] font-bold bg-[#F9F9F7]">
              {errorMsg}
            </div>
          )}
          {!canCreateRule && (
            <div className="border-2 border-[#CC0000] p-3 text-[#CC0000] font-bold bg-[#F9F9F7]">
              Only a registered Sender or CoAdmin can create rules for this family vault.
            </div>
          )}
          {/* Step 1: Strategy Selection */}
          <div className="border-2 border-[#111111] bg-[#F9F9F7]">
            <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5]">
              <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                SECTION 1 · SELECT DISTRIBUTION MODEL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#111111]">
              <button
                type="button"
                onClick={() => setStrategy("Percentage")}
                className={`p-6 text-left transition-all ${
                  strategy === "Percentage"
                    ? "bg-[#111111] text-[#F9F9F7]"
                    : "bg-[#F9F9F7] text-[#111111] hover:bg-[#F5F5F5]"
                }`}
              >
                <div className="font-serif text-lg font-bold mb-1">
                  Percentage Split
                </div>
                <p className="font-body text-xs opacity-90 leading-relaxed">
                  Basis point shares (10,000 bps = 100%). Division remainder absorbed by final recipient.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStrategy("FixedAmount")}
                className={`p-6 text-left transition-all ${
                  strategy === "FixedAmount"
                    ? "bg-[#111111] text-[#F9F9F7]"
                    : "bg-[#F9F9F7] text-[#111111] hover:bg-[#F5F5F5]"
                }`}
              >
                <div className="font-serif text-lg font-bold mb-1">
                  Fixed Nominal Sums
                </div>
                <p className="font-body text-xs opacity-90 leading-relaxed">
                  Fixed XLM amounts per recipient. Deposit must equal sum of allocations.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStrategy("Waterfall")}
                className={`p-6 text-left transition-all ${
                  strategy === "Waterfall"
                    ? "bg-[#111111] text-[#F9F9F7]"
                    : "bg-[#F9F9F7] text-[#111111] hover:bg-[#F5F5F5]"
                }`}
              >
                <div className="font-serif text-lg font-bold mb-1">
                  Priority Waterfall
                </div>
                <p className="font-body text-xs opacity-90 leading-relaxed">
                  Top-down priority tiers with caps; final tier receives all residual balance.
                </p>
              </button>
            </div>
          </div>

          {/* Step 2: Allocation Items */}
          <div className="border-2 border-[#111111] bg-[#F9F9F7]">
            <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                SECTION 2 · CONFIGURE BENEFICIARY ALLOCATIONS
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Beneficiary
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {recipientMembers.length === 0 && (
                <div className="border-2 border-[#CC0000] p-3 text-[#CC0000] font-bold bg-[#F9F9F7]">
                  Add at least one Recipient in the Family Directory before creating a split rule.
                </div>
              )}
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border-2 border-[#111111] p-4 bg-[#F5F5F5] grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                      Purpose / Label
                    </label>
                    <Input
                      placeholder="e.g. Parents Support"
                      value={item.label}
                      onChange={(e) => handleItemChange(index, "label", e.target.value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                      Approved Family Recipient
                    </label>
                    <select
                      value={item.recipient}
                      onChange={(e) => handleItemChange(index, "recipient", e.target.value)}
                      className="w-full text-xs font-mono border-2 border-[#111111] bg-[#F9F9F7] px-3 py-2 text-[#111111] focus:outline-none"
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

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
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

                  <div className="md:col-span-1 flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1}
                      className="p-1 text-[#737373] hover:text-[#CC0000] disabled:opacity-30"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t-2 border-[#111111] bg-[#F5F5F5] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                {strategy === "Percentage" && (
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#737373]">TOTAL SHARES:</span>
                    <span className={`font-black text-sm ${isValid ? "text-emerald-800" : "text-[#CC0000]"}`}>
                      {items.reduce((acc, it) => acc + (parseFloat(it.amountStr) || 0), 0).toFixed(2)}%
                    </span>
                    {isValid && <CheckCircle2 className="h-4 w-4 text-emerald-800" />}
                  </div>
                )}

                {strategy === "FixedAmount" && (
                  <div>
                    TOTAL FIXED TARGET: <strong>{items.reduce((acc, it) => acc + (parseFloat(it.amountStr) || 0), 0)} XLM</strong>
                  </div>
                )}
              </div>

              {!isValid && (
                <div className="text-[#CC0000] font-black flex items-center space-x-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{validationMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Activation & Submit */}
          <div className="border-2 border-[#111111] bg-[#F9F9F7] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoActivate}
                onChange={(e) => setAutoActivate(e.target.checked)}
                disabled={!canActivateRule}
                className="h-4 w-4 rounded-none border-2 border-[#111111] text-[#111111] focus:ring-0"
              />
              <span className="font-bold uppercase tracking-wider text-[#111111]">
                {canActivateRule
                  ? "Immediately activate this rule version upon ledger confirmation"
                  : "Only a Sender can activate this rule after creation"}
              </span>
            </label>

            <Button
              type="submit"
              size="lg"
              variant="default"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-10 shadow-[4px_4px_0px_0px_#111111]"
            >
              {isSubmitting ? "Deploying On-Chain..." : "Deploy Rule Version"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
        )}
      </div>
    </AppShell>
  );
}
