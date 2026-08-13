"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useFamilyStore } from "@/state/use-family-store";
import { useWalletStore } from "@/state/use-wallet-store";
import { useTransactionStore } from "@/state/use-transaction-store";
import { useActivityStore } from "@/state/use-activity-store";
import { AddressPill } from "@/components/shared/address-pill";
import { AmountDisplay } from "@/components/shared/amount-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExplorerLink } from "@/components/shared/explorer-link";
import { xlmToStroops, stroopsToXlm, bpsToPercentage } from "@/lib/formatters";

import { distributionContractService } from "@/services/distribution-contract";

type FlowStep = "INPUT" | "PREVIEW" | "SIGNING" | "PROCESSING" | "CONFIRMED" | "FAILED";

export default function DepositPage() {
  const { families, selectedFamilyId, selectFamily, getSelectedFamily } = useFamilyStore();
  const { address, isConnected, balance, connect, getSignerOptions, refreshBalance } = useWalletStore();
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

  const previewPayouts = (activeRule?.allocations || []).map((alloc) => {
    let payoutStroops = 0n;
    if (activeRule?.strategy === "Percentage") {
      payoutStroops = (amountStroops * alloc.shareOrAmount) / 10000n;
    } else if (activeRule?.strategy === "FixedAmount") {
      payoutStroops = alloc.shareOrAmount;
    } else {
      payoutStroops = alloc.shareOrAmount === 0n ? amountStroops / 2n : alloc.shareOrAmount;
    }

    return {
      recipient: alloc.recipient,
      label: alloc.label,
      amountStroops: payoutStroops,
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

    if (!address) {
      setErrorMsg("Please connect your Stellar wallet first.");
      return;
    }

    setStep("SIGNING");
    setErrorMsg("");

    try {
      setIsSimulating(true);
      const sender = address;
      const signerOpts = getSignerOptions();
      setIsSimulating(false);

      setStep("PROCESSING");

      const res = await distributionContractService.executeDepositAndDistribute(
        sender,
        family.id,
        amountStroops,
        process.env.NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID || "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        signerOpts
      );

      const hash = res.hash;
      setTxHash(hash);

      addTransaction({
        hash,
        type: "DISTRIBUTE",
        status: "CONFIRMED",
        familyId: family.id,
        familyName: family.name,
        amount: amountStroops,
        depositor: sender,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      addEvent({
        id: `evt-${Date.now()}-dep`,
        type: "DEPOSIT_FUNDED",
        familyId: family.id,
        actor: sender,
        amount: amountStroops,
        timestamp: Date.now(),
        txHash: hash,
        details: `Deposited ${amountStr} XLM into RemitSplit Escrow Vault on Stellar Testnet`,
      });

      addEvent({
        id: `evt-${Date.now()}-comp`,
        type: "DISTRIBUTION_COMPLETED",
        familyId: family.id,
        actor: sender,
        amount: amountStroops,
        timestamp: Date.now(),
        txHash: hash,
        details: `Settled ${amountStr} XLM across ${activeRule.allocations.length} family recipients.`,
      });

      await refreshBalance();
      await useTransactionStore.getState().syncOnChainTransactions();
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
      <div className="space-y-6 max-w-3xl mx-auto font-mono text-xs">
        {/* Header */}
        <div className="border-b-2 border-[#111111] pb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block">
            OFFICIAL FINANCIAL DISPATCH · ATOMIC SETTLEMENT
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#111111]">
            Deposit &amp; Split
          </h1>
          <p className="font-body text-xs text-[#525252]">
            Single-entry escrow deposit automatically divided across family recipients according to active rule parameters.
          </p>
        </div>

        {/* Phase Indicator */}
        <div className="grid grid-cols-3 border-2 border-[#111111] divide-x-2 divide-[#111111] bg-[#F5F5F5] uppercase tracking-wider font-bold text-center">
          <div className={`p-3 ${step === "INPUT" ? "bg-[#111111] text-[#F9F9F7]" : ""}`}>
            1. Amount
          </div>
          <div className={`p-3 ${step === "PREVIEW" ? "bg-[#111111] text-[#F9F9F7]" : ""}`}>
            2. Preview
          </div>
          <div className={`p-3 ${step === "PROCESSING" || step === "CONFIRMED" ? "bg-[#111111] text-[#F9F9F7]" : ""}`}>
            3. Settlement
          </div>
        </div>

        {/* Phase 1: Amount Input */}
        {step === "INPUT" && (
          <div className="border-2 border-[#111111] bg-[#F9F9F7] space-y-6">
            <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5]">
              <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                SPECIFY DISPATCH PARAMETERS
              </span>
            </div>

            <div className="p-6 space-y-6">
              {errorMsg && (
                <div className="border-2 border-[#CC0000] p-3 text-[#CC0000] font-bold bg-[#F9F9F7]">
                  {errorMsg}
                </div>
              )}

              {/* Family Selector */}
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#737373]">
                  Target Family Vault
                </label>
                <select
                  value={selectedFamilyId}
                  onChange={(e) => selectFamily(Number(e.target.value))}
                  className="w-full text-xs font-mono border-2 border-[#111111] bg-[#F9F9F7] px-3 py-2.5 text-[#111111] focus:outline-none"
                >
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>
                      #{f.id} · {f.name} (Active Rule: v{f.activeRuleVersion || "None"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Rule Notice */}
              {activeRule ? (
                <div className="border border-[#111111] bg-[#F5F5F5] p-4 space-y-1">
                  <div className="font-bold text-[#111111] uppercase tracking-wider flex items-center justify-between">
                    <span>RULE VERSION {activeRule.version} ({activeRule.strategy}) IN EFFECT</span>
                    <Badge variant="editorial">ACTIVE</Badge>
                  </div>
                  <p className="font-body text-xs text-[#525252]">
                    Funds will split immediately upon deposit across {activeRule.allocations.length} authorized recipients.
                  </p>
                </div>
              ) : (
                <div className="border-2 border-[#CC0000] p-4 flex items-center justify-between">
                  <span className="text-[#CC0000] font-bold">
                    No active rule configured for this family group.
                  </span>
                  <Link href="/rules/builder">
                    <Button size="sm" variant="default">
                      Build Rule
                    </Button>
                  </Link>
                </div>
              )}

              {/* Deposit Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase tracking-wider text-[#737373]">
                    Remittance Amount
                  </label>
                  {isConnected && (
                    <span className="text-[#737373]">
                      Available: <strong>{parseFloat(balance).toFixed(2)} XLM</strong>
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
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#737373] uppercase">
                    XLM
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center space-x-2 pt-1">
                  {[250, 500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountStr(preset.toString())}
                      className="px-3 py-1 font-mono text-xs font-bold border border-[#111111] bg-[#F5F5F5] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
                    >
                      {preset} XLM
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t-2 border-[#111111] bg-[#F5F5F5] flex justify-end">
              {isConnected ? (
                <Button
                  size="lg"
                  variant="default"
                  onClick={handleStartDeposit}
                  disabled={!activeRule || amountNumber <= 0}
                  className="px-8 shadow-[4px_4px_0px_0px_#111111]"
                >
                  Review Dispatch Calculations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="default"
                  onClick={() => connect()}
                  className="px-8"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet to Continue
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Phase 2: Split Preview */}
        {step === "PREVIEW" && (
          <div className="border-2 border-[#111111] bg-[#F9F9F7] space-y-6">
            <div className="p-4 border-b-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                OFFICIAL BREAKDOWN &amp; AUDIT RECEIPT
              </span>
              <Badge variant="default">{activeRule?.strategy}</Badge>
            </div>

            <div className="p-6 space-y-6">
              {/* Receipt Header Pill */}
              <div className="border-2 border-[#111111] p-5 bg-[#111111] text-[#F9F9F7] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#A3A3A3] block">
                    TOTAL REMITTANCE PRINCIPAL
                  </span>
                  <span className="font-serif text-3xl font-black">{amountStr} XLM</span>
                </div>
                <div className="text-right font-mono text-xs text-[#A3A3A3]">
                  <div>FAMILY #{family?.id}</div>
                  <div>RULE v{activeRule?.version}</div>
                </div>
              </div>

              {/* Recipient Payout Breakdown */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#737373] block">
                  CALCULATED BENEFICIARY DISPATCHES ({previewPayouts.length})
                </span>

                <div className="border border-[#111111] divide-y divide-[#111111]">
                  {previewPayouts.map((payout, idx) => (
                    <div key={idx} className="p-3.5 bg-[#F5F5F5] flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-serif font-bold text-sm text-[#111111] block">
                          {idx + 1}. {payout.label}
                        </span>
                        <AddressPill address={payout.recipient} showExplorer={false} />
                      </div>
                      <AmountDisplay stroops={payout.amountStroops} size="md" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t-2 border-[#111111] bg-[#F5F5F5] flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep("INPUT")}>
                Back
              </Button>
              <Button
                size="lg"
                variant="editorial"
                onClick={handleConfirmAndSign}
                className="px-8 shadow-[4px_4px_0px_0px_#111111]"
              >
                Authorize &amp; Sign Dispatch
              </Button>
            </div>
          </div>
        )}

        {/* Phase 3: Signing / Processing / Confirmed */}
        {(step === "SIGNING" || step === "PROCESSING" || step === "CONFIRMED" || step === "FAILED") && (
          <div className="border-2 border-[#111111] bg-[#F9F9F7] p-8 text-center space-y-6">
            {step === "SIGNING" && (
              <div className="space-y-3">
                <span className="font-mono text-3xl font-black text-[#111111] block animate-pulse">
                  SIGNATURE REQUIRED
                </span>
                <p className="font-body text-xs text-[#525252] max-w-sm mx-auto">
                  Please approve and sign the escrow transaction in your connected Stellar wallet.
                </p>
              </div>
            )}

            {step === "PROCESSING" && (
              <div className="space-y-3">
                <span className="font-mono text-3xl font-black text-[#111111] block animate-pulse">
                  BROADCASTING TO LEDGER...
                </span>
                <p className="font-body text-xs text-[#525252] max-w-sm mx-auto">
                  Escrowing funds and triggering Soroban inter-contract payout execution.
                </p>
                {txHash && (
                  <div className="inline-block p-2 border border-[#111111] bg-[#F5F5F5] text-xs">
                    Tx: {txHash.slice(0, 10)}...{txHash.slice(-10)}
                  </div>
                )}
              </div>
            )}

            {step === "CONFIRMED" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <Badge variant="editorial" className="text-xs px-3 py-1">
                    SETTLEMENT COMPLETE
                  </Badge>
                  <h2 className="font-serif text-3xl sm:text-4xl font-black text-[#111111] pt-2">
                    Remittance Settled on Stellar
                  </h2>
                  <p className="font-body text-xs text-[#525252]">
                    {amountStr} XLM divided and delivered to {previewPayouts.length} beneficiaries.
                  </p>
                </div>

                <div className="border-2 border-[#111111] p-4 bg-[#F5F5F5] max-w-md mx-auto text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-[#111111]/20 pb-1">
                    <span className="text-[#737373]">Status:</span>
                    <StatusBadge status="CONFIRMED" />
                  </div>
                  <div className="flex justify-between border-b border-[#111111]/20 pb-1">
                    <span className="text-[#737373]">Amount:</span>
                    <strong>{amountStr} XLM</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Ledger Proof:</span>
                    <ExplorerLink type="tx" value={txHash} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                    New Dispatch
                  </Button>
                  <Link href="/transactions" className="w-full sm:w-auto">
                    <Button variant="default" className="w-full sm:w-auto">
                      View Transaction Gazette
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {step === "FAILED" && (
              <div className="space-y-4">
                <span className="font-mono text-2xl font-black text-[#CC0000] block">
                  DISPATCH EXECUTION FAILED
                </span>
                <p className="text-xs text-[#CC0000]">{errorMsg}</p>
                <Button onClick={handleReset} variant="outline">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
