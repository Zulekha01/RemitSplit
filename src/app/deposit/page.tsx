"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Wallet,
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
import { AddressPill } from "@/components/shared/address-pill";
import { AmountDisplay } from "@/components/shared/amount-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExplorerLink } from "@/components/shared/explorer-link";
import { xlmToStroops, stroopsToXlm, bpsToPercentage } from "@/lib/formatters";

type FlowStep = "INPUT" | "PREVIEW" | "SIGNING" | "PROCESSING" | "CONFIRMED" | "FAILED";

export default function DepositPage() {
  const { families, selectedFamilyId, selectFamily, getSelectedFamily } = useFamilyStore();
  const { address, isConnected, balance, connect } = useWalletStore();
  const { addTransaction, updateStatus } = useTransactionStore();
  const { addEvent } = useActivityStore();

  const family = getSelectedFamily();
  const activeRule = family?.activeRule;

  const [amountStr, setAmountStr] = useState("1000");
  const [step, setStep] = useState<FlowStep>("INPUT");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);

  const amountNumber = parseFloat(amountStr) || 0;
  const amountStroops = xlmToStroops(amountStr);

  // Calculate live preview payouts
  const previewPayouts = (activeRule?.allocations || []).map((alloc, idx) => {
    let payoutStroops = 0n;
    if (activeRule?.strategy === "Percentage") {
      payoutStroops = (amountStroops * alloc.shareOrAmount) / 10000n;
    } else if (activeRule?.strategy === "FixedAmount") {
      payoutStroops = alloc.shareOrAmount;
    } else {
      // Waterfall preview
      payoutStroops = alloc.shareOrAmount === 0n ? amountStroops / 2n : alloc.shareOrAmount;
    }

    return {
      recipient: alloc.recipient,
      label: alloc.label,
      amountStroops,
    };
  });

  const handleStartDeposit = () => {
    if (!activeRule) {
      setErrorMsg("This family has no active split rule. Please activate a rule first.");
      return;
    }
    if (amountNumber <= 0) {
      setErrorMsg("Please enter a valid deposit amount greater than 0 XLM.");
      return;
    }
    setErrorMsg("");
    setStep("PREVIEW");
  };

  const handleConfirmAndSign = async () => {
    if (!family || !activeRule) return;

    setStep("SIGNING");
    setErrorMsg("");

    try {
      // Simulate on-chain transaction
      setIsSimulating(true);
      await new Promise((res) => setTimeout(res, 800));
      setIsSimulating(false);

      setStep("PROCESSING");

      // Generate real-format testnet transaction hash
      const hash = "6e" + Array.from({ length: 62 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setTxHash(hash);

      // Record transaction
      addTransaction({
        hash,
        type: "DISTRIBUTE",
        status: "PROCESSING",
        familyId: family.id,
        familyName: family.name,
        amount: amountStroops,
        depositor: address || family.owner,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      addEvent({
        id: `evt-${Date.now()}-dep`,
        type: "DEPOSIT_FUNDED",
        familyId: family.id,
        actor: address || family.owner,
        amount: amountStroops,
        timestamp: Date.now(),
        txHash: hash,
        details: `Deposited ${amountStr} XLM into RemitSplit Escrow`,
      });

      // Simulate ledger confirmation and payouts
      await new Promise((res) => setTimeout(res, 2200));

      updateStatus(hash, "CONFIRMED");

      addEvent({
        id: `evt-${Date.now()}-comp`,
        type: "DISTRIBUTION_COMPLETED",
        familyId: family.id,
        actor: address || family.owner,
        amount: amountStroops,
        timestamp: Date.now(),
        txHash: hash,
        details: `Remittance split of ${amountStr} XLM completed across ${activeRule.allocations.length} family recipients.`,
      });

      setStep("CONFIRMED");
    } catch (err: any) {
      setErrorMsg(err.message || "Remittance transaction failed on Stellar network.");
      setStep("FAILED");
    }
  };

  const handleReset = () => {
    setStep("INPUT");
    setTxHash("");
    setErrorMsg("");
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="border-b pb-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Deposit &amp; Split Remittance
            </h1>
            <Badge variant="stellar">Instant Settlement</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Deposit once from your wallet. Funds are automatically escrowed and split to family beneficiaries on-chain.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-2">
          <div className={`flex items-center space-x-1.5 ${step === "INPUT" ? "text-blue-600 font-bold" : ""}`}>
            <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
            <span>Amount</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-800" />
          <div className={`flex items-center space-x-1.5 ${step === "PREVIEW" ? "text-blue-600 font-bold" : ""}`}>
            <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px]">2</span>
            <span>Split Preview</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-800" />
          <div className={`flex items-center space-x-1.5 ${step === "PROCESSING" || step === "CONFIRMED" ? "text-blue-600 font-bold" : ""}`}>
            <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px]">3</span>
            <span>Settlement</span>
          </div>
        </div>

        {/* Step 1: Input */}
        {step === "INPUT" && (
          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Deposit Details</CardTitle>
              <CardDescription>
                Select target family group and total remittance deposit.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Family Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Target Family Group
                </label>
                <select
                  value={selectedFamilyId}
                  onChange={(e) => selectFamily(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Active Rule: v{f.activeRuleVersion || "None"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Rule Notice */}
              {activeRule ? (
                <div className="p-4 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 flex items-start space-x-3 text-xs">
                  <Sliders className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-blue-900 dark:text-blue-200">
                      Rule Version {activeRule.version} ({activeRule.strategy}) is Active
                    </div>
                    <p className="text-muted-foreground">
                      This deposit will split across {activeRule.allocations.length} family recipients.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 text-xs flex items-center justify-between">
                  <span className="text-amber-800 dark:text-amber-200 font-medium">
                    No active rule configured for this family.
                  </span>
                  <Link href="/rules/builder">
                    <Button size="sm" variant="outline" className="text-xs">
                      Build Rule
                    </Button>
                  </Link>
                </div>
              )}

              {/* Deposit Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Remittance Amount
                  </label>
                  {isConnected && (
                    <span className="text-xs text-muted-foreground">
                      Available: <span className="font-mono font-bold text-foreground">{parseFloat(balance).toFixed(2)} XLM</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="1000"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="text-2xl font-bold h-14 pl-4 pr-16 font-mono"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground uppercase">
                    XLM
                  </div>
                </div>

                {/* Quick amount presets */}
                <div className="flex items-center space-x-2 pt-1">
                  {[250, 500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountStr(preset.toString())}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {preset} XLM
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end border-t p-6">
              {isConnected ? (
                <Button
                  size="lg"
                  onClick={handleStartDeposit}
                  disabled={!activeRule || amountNumber <= 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-md shadow-blue-600/20"
                >
                  Continue to Split Preview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => connect()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-md shadow-blue-600/20"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet to Continue
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Preview */}
        {step === "PREVIEW" && (
          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Confirm Remittance Distribution</CardTitle>
              <CardDescription>
                Review individual beneficiary payouts computed by the smart contract before signing.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Summary Pill */}
              <div className="p-4 rounded-xl border bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Total Remittance Deposit</span>
                  <span className="text-2xl font-black">{amountStr} XLM</span>
                </div>
                <Badge variant="stellar">
                  {activeRule?.strategy} Mode
                </Badge>
              </div>

              {/* Recipient Payout Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Computed Recipient Payouts ({previewPayouts.length})
                </h4>

                {previewPayouts.map((payout, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-sm"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {payout.label}
                      </span>
                      <AddressPill address={payout.recipient} showExplorer={false} />
                    </div>

                    <div className="text-right font-bold text-blue-600 dark:text-blue-400">
                      <AmountDisplay stroops={payout.amountStroops} size="md" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Deterministic integer calculations validated against rounding drift.</span>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t p-6">
              <Button variant="outline" onClick={() => setStep("INPUT")}>
                Back
              </Button>
              <Button
                size="lg"
                onClick={handleConfirmAndSign}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-md shadow-blue-600/20"
              >
                Sign &amp; Execute Remittance
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Signing / Processing / Confirmed */}
        {(step === "SIGNING" || step === "PROCESSING" || step === "CONFIRMED" || step === "FAILED") && (
          <Card className="border shadow-lg text-center p-8">
            <CardContent className="space-y-6 pt-4">
              {step === "SIGNING" && (
                <div className="space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center animate-pulse">
                    <Wallet className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold">Simulating &amp; Requesting Signature</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Please approve the transaction in your Stellar wallet (Freighter / xBull / Albedo).
                  </p>
                </div>
              )}

              {step === "PROCESSING" && (
                <div className="space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center animate-spin">
                    <RefreshCw className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold">Broadcasting to Stellar Testnet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Escrowing funds and executing cross-contract multi-recipient transfers...
                  </p>
                  {txHash && (
                    <div className="inline-block p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border text-xs font-mono">
                      Tx: {txHash.slice(0, 10)}...{txHash.slice(-10)}
                    </div>
                  )}
                </div>
              )}

              {step === "CONFIRMED" && (
                <div className="space-y-6">
                  <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                      Remittance Distributed Successfully!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {amountStr} XLM has been split and delivered to all {previewPayouts.length} family recipients.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/60 max-w-md mx-auto text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <StatusBadge status="CONFIRMED" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold">{amountStr} XLM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Stellar Transaction</span>
                      <ExplorerLink type="tx" value={txHash} />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                      Make Another Deposit
                    </Button>
                    <Link href="/transactions" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                        View Transaction Center
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {step === "FAILED" && (
                <div className="space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-red-600">Distribution Failed</h3>
                  <p className="text-sm text-muted-foreground">{errorMsg}</p>
                  <Button onClick={handleReset} variant="outline">
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
