"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  ShieldCheck,
  Zap,
  Globe2,
  Percent,
  Sliders,
  CheckCircle2,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs py-2 px-4 text-center font-medium">
        ✨ Stellar Green Belt Submission — Live on Stellar Testnet &amp; Soroban Smart Contracts
      </div>

      {/* Header */}
      <header className="container mx-auto px-4 h-20 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <ArrowRightLeft className="h-6 w-6" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-white">RemitSplit</span>
            <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest -mt-1">
              On Stellar
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm text-slate-300">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#strategies" className="hover:text-white transition-colors">Split Strategies</a>
          <a href="#security" className="hover:text-white transition-colors">Security &amp; Soroban</a>
          <a
            href="https://stellar.expert/explorer/testnet"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 text-slate-400 hover:text-blue-400 transition-colors"
          >
            <span>Explorer</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <Link href="/dashboard">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 px-5">
              Launch App
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 border-b border-slate-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center space-x-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-3.5 py-1 text-xs font-semibold text-blue-400 mb-6 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dual Soroban Smart Contract Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Programmable Cross-Border <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Remittance Splitting
            </span>{" "}
            on Stellar
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto font-light">
            One remittance deposit automatically distributes funds to parents, siblings, and dependents according to transparent, on-chain programmable allocation rules.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-base h-13 px-8 shadow-xl shadow-blue-600/30">
                Open Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/deposit" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-base h-13 px-8">
                Try "Deposit &amp; Split"
              </Button>
            </Link>
          </div>

          {/* Key Metrics / Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-slate-800/80 text-left">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-2xl font-black text-white">1-Click</div>
              <div className="text-xs text-slate-400 mt-1">Multi-Recipient Split</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-2xl font-black text-blue-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">On-Chain RBAC Verified</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-2xl font-black text-emerald-400">&lt; 5s</div>
              <div className="text-xs text-slate-400 mt-1">Stellar Settlement</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-2xl font-black text-purple-400">3 Modes</div>
              <div className="text-xs text-slate-400 mt-1">Percentage, Fixed, Waterfall</div>
            </div>
          </div>
        </div>
      </section>

      {/* Split Strategies Section */}
      <section id="strategies" className="py-20 bg-slate-900/40 border-b border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-4">
              Programmable Allocation Models
            </h2>
            <p className="text-slate-400 text-sm">
              Deterministic on-chain financial arithmetic ensuring zero precision loss or dust lockups.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-lg">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                  <Percent className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg text-white">Percentage Split</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-400 space-y-3">
                <p>
                  Allocates basis points across beneficiaries summing to exactly 100% (10,000 bps) with remainder resolution.
                </p>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                  <div>Parents: 50.00% (5,000 bps)</div>
                  <div>Sibling: 30.00% (3,000 bps)</div>
                  <div>Dependent: 20.00% (2,000 bps)</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-lg">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg text-white">Fixed Amount</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-400 space-y-3">
                <p>
                  Guarantees exact payout amounts in Stellar units (stroops) validated strictly against deposit totals.
                </p>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                  <div>Parents: 500 XLM</div>
                  <div>Sibling: 300 XLM</div>
                  <div>Dependent: 200 XLM</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-lg">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
                  <Sliders className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg text-white">Priority Waterfall</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-400 space-y-3">
                <p>
                  Sequential tier distribution filling primary caps first, with remaining balance passed to emergency funds.
                </p>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                  <div>1. Parents: up to 500 XLM</div>
                  <div>2. Sibling: up to 300 XLM</div>
                  <div>3. Dependent: Remainder</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Architecture & Security Section */}
      <section id="security" className="py-20 border-b border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="stellar" className="mb-4">Soroban Inter-Contract Calls</Badge>
              <h2 className="text-3xl font-extrabold text-white mb-4 leading-snug">
                Architected for Security, Immutability, and Auditability
              </h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                RemitSplit strictly separates group governance from financial escrow via real Soroban cross-contract calls between <code className="text-blue-400 font-mono">FamilyRegistryContract</code> and <code className="text-indigo-400 font-mono">EscrowDistributionContract</code>.
              </p>

              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>On-Chain RBAC:</strong> Senders, Co-Admins, and Recipients with cryptographic authorization (<code className="text-xs">require_auth</code>).</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Idempotency &amp; Retry Safety:</strong> Payout lifecycle state machine tracks individual recipient transfers to prevent double payout.</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Stellar Asset Contract (SAC):</strong> Native XLM and future support for USDC stablecoins.</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 mb-4 pb-3 border-b border-slate-800">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-slate-400">inter-contract-execution.soroban</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`// 1. Escrow receives sender deposit
token_client.transfer(sender, escrow, amount);

// 2. Real cross-contract query to Registry
let rule = registry_client.get_active_rule(family_id);

// 3. Deterministic Payout Math
let payouts = calculate_payouts(&rule, amount)?;

// 4. Multi-recipient atomic execution
for payout in payouts.iter() {
  token_client.transfer(escrow, payout.recipient, payout.amount);
  emit_recipient_paid(dist_id, payout.recipient, payout.amount);
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Ready to Automate Family Remittances?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto text-sm sm:text-base">
            Connect your Freighter, xBull, or Albedo wallet and create your first family remittance rule on Stellar Testnet in seconds.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 px-8 shadow-xl shadow-blue-600/30">
              Launch RemitSplit Dapp
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
