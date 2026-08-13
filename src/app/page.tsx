"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Send,
  Sliders,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Users,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NetworkBanner } from "@/components/layout/network-banner";
import { Navbar } from "@/components/layout/navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#111111] flex flex-col selection:bg-[#111111] selection:text-white">
      <NetworkBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full border-x-2 border-[#111111]">
        {/* HERO SECTION — BROADSHEET LEAD STORY */}
        <section className="border-b-4 border-[#111111] p-6 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Headline (8 cols) */}
            <div className="lg:col-span-8 space-y-6 lg:border-r-2 lg:border-[#111111] lg:pr-8">
              <div className="flex items-center space-x-3">
                <div className="relative h-10 w-10 shrink-0 border-2 border-[#111111] bg-white p-1 shadow-[2px_2px_0px_0px_#111111]">
                  <Image
                    src="/logo.png"
                    alt="RemitSplit Emblem"
                    fill
                    sizes="40px"
                    className="object-contain p-0.5"
                    priority
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <Badge variant="editorial">BREAKING DISPATCH</Badge>
                  <span className="font-mono text-xs uppercase tracking-widest text-[#737373]">
                    SPECIAL REPORT ON STELLAR SOROBAN
                  </span>
                </div>
              </div>

              <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.9] text-[#111111]">
                DEPOSIT ONCE. <br />
                SPLIT TO ALL.
              </h1>

              <p className="drop-cap font-body text-base sm:text-xl text-[#404040] leading-relaxed max-w-2xl text-justify">
                RemitSplit pioneers on-chain programmable cross-border remittances. Send money globally in a single atomic transaction, and let Soroban smart contracts distribute exact percentage and fixed allocations to parents, tuition accounts, and emergency funds with zero math drift.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Link href="/dashboard">
                  <Button size="lg" variant="default" className="w-full sm:w-auto text-sm px-8">
                    Open Remittance Hub
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/rules/builder">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm px-8">
                    Build Split Rule
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sidebar Column (4 cols) — Gazette Market Index & Briefs */}
            <div className="lg:col-span-4 space-y-6">
              <div className="border-2 border-[#111111] bg-[#F5F5F5] p-5 space-y-4">
                <div className="border-b border-[#111111] pb-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
                    LEDGER TELEMETRY
                  </span>
                  <span className="text-[#CC0000] font-black font-mono text-xs">● LIVE</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#111111]/20 pb-1.5">
                    <span className="text-[#525252]">SETTLEMENT SPEED</span>
                    <span className="font-bold text-[#111111]">&lt; 4.0 SEC</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#111111]/20 pb-1.5">
                    <span className="text-[#525252]">AVERAGE TX FEE</span>
                    <span className="font-bold text-[#111111]">0.00001 XLM</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#111111]/20 pb-1.5">
                    <span className="text-[#525252]">ARITHMETIC DUST LOSS</span>
                    <span className="font-bold text-emerald-800">0.00 STROOPS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#525252]">CROSS-CONTRACT CALL</span>
                    <span className="font-bold text-[#111111]">AUTHENTIC</span>
                  </div>
                </div>

                <div className="p-3 border border-[#111111] bg-[#F9F9F7] text-[11px] font-body text-[#525252] leading-tight">
                  <strong className="text-[#111111] font-mono uppercase block mb-1">Notice to Senders:</strong>
                  Every remittance is protected by Soroban state machines preventing replay attacks and double execution.
                </div>
              </div>

              {/* Quote from the Editor */}
              <div className="border-l-4 border-[#111111] pl-4 py-1 space-y-1">
                <p className="font-serif italic text-sm text-[#404040]">
                  &ldquo;A transformative leap for immigrant families worldwide—eradicating repetitive wire fees through programmable blockchain contracts.&rdquo;
                </p>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#737373]">
                  — STELLAR DISPATCH EDITORIAL BOARD
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ORNAMENTAL SECTION DIVIDER */}
        <div className="py-6 text-center font-serif text-xl text-[#737373] tracking-[1em] border-b-2 border-[#111111] bg-[#F5F5F5] select-none">
          ✦ ✦ ✦
        </div>

        {/* 3 CORE ALLOCATION MODELS — 3-COLUMN NEWSPAPER GRID */}
        <section className="border-b-4 border-[#111111]">
          <div className="p-6 sm:p-8 bg-[#F5F5F5] border-b-2 border-[#111111]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#CC0000]">
                  DEPARTMENT OF ALGORITHMIC DISTRIBUTION
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight mt-1">
                  Three Deterministic Split Strategies
                </h2>
              </div>
              <Badge variant="outline">STARK ARITHMETIC</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#111111]">
            {/* Column 1: Percentage */}
            <div className="p-8 space-y-4 bg-[#F9F9F7]">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#525252]">
                STRATEGY I · PRO-RATA
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#111111]">
                Percentage Split
              </h3>
              <p className="font-body text-sm text-[#525252] leading-relaxed">
                Allocates exact basis points across approved family recipients (sum = 10,000 bps / 100%). Any remainder from integer division is absorbed by the final recipient with zero precision loss.
              </p>
              <div className="p-3 border border-[#111111] bg-[#F5F5F5] font-mono text-xs space-y-1">
                <div className="flex justify-between"><span>Parents:</span> <strong>50.00%</strong></div>
                <div className="flex justify-between"><span>Tuition:</span> <strong>30.00%</strong></div>
                <div className="flex justify-between"><span>Reserve:</span> <strong>20.00%</strong></div>
              </div>
            </div>

            {/* Column 2: Fixed */}
            <div className="p-8 space-y-4 bg-[#F9F9F7]">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#525252]">
                STRATEGY II · NOMINAL
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#111111]">
                Fixed Amount
              </h3>
              <p className="font-body text-sm text-[#525252] leading-relaxed">
                Guarantees fixed sums in Stellar Stroops ($10^7$ units per XLM) to each recipient. The contract strictly verifies that the total deposit exactly matches the sum of fixed allocations.
              </p>
              <div className="p-3 border border-[#111111] bg-[#F5F5F5] font-mono text-xs space-y-1">
                <div className="flex justify-between"><span>Rent:</span> <strong>500 XLM Fixed</strong></div>
                <div className="flex justify-between"><span>Groceries:</span> <strong>300 XLM Fixed</strong></div>
                <div className="flex justify-between"><span>Medical:</span> <strong>200 XLM Fixed</strong></div>
              </div>
            </div>

            {/* Column 3: Waterfall */}
            <div className="p-8 space-y-4 bg-[#F9F9F7]">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#525252]">
                STRATEGY III · PRIORITY
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#111111]">
                Priority Waterfall
              </h3>
              <p className="font-body text-sm text-[#525252] leading-relaxed">
                Evaluates priority tiers sequentially upon sender deposit. High-priority beneficiaries receive funds up to their predetermined cap first; the remaining balance flows to secondary tiers.
              </p>
              <div className="p-3 border border-[#111111] bg-[#F5F5F5] font-mono text-xs space-y-1">
                <div className="flex justify-between"><span>Tier 1 (Parents):</span> <strong>≤ 600 XLM</strong></div>
                <div className="flex justify-between"><span>Tier 2 (Tuition):</span> <strong>≤ 300 XLM</strong></div>
                <div className="flex justify-between"><span>Tier 3 (Savings):</span> <strong>Remainder</strong></div>
              </div>
            </div>
          </div>
        </section>

        {/* INVERTED BLACK SECTION — HOW REMITSPLIT OPERATES */}
        <section className="bg-[#111111] text-[#F9F9F7] p-8 sm:p-16 border-b-4 border-[#111111]">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#CC0000] font-bold">
                OPERATING DISPATCH &amp; SEQUENCE
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-white">
                How On-Chain Remittance Executes
              </h2>
              <p className="font-body text-sm sm:text-base text-[#A3A3A3] max-w-xl mx-auto">
                No intermediaries. No double charges. A direct cryptographic protocol executed atomically on Stellar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border border-white/20 p-6 space-y-3 bg-white/5">
                <span className="font-mono text-3xl font-black text-[#CC0000]">01</span>
                <h4 className="font-serif text-lg font-bold text-white">Register Family</h4>
                <p className="font-body text-xs text-[#A3A3A3]">
                  Sender deploys an on-chain family record, sets up approved beneficiaries, and assigns co-admin roles.
                </p>
              </div>

              <div className="border border-white/20 p-6 space-y-3 bg-white/5">
                <span className="font-mono text-3xl font-black text-[#CC0000]">02</span>
                <h4 className="font-serif text-lg font-bold text-white">Define Rule</h4>
                <p className="font-body text-xs text-[#A3A3A3]">
                  Program allocation rules using Percentage, Fixed, or Waterfall algorithms with live ledger verification.
                </p>
              </div>

              <div className="border border-white/20 p-6 space-y-3 bg-white/5">
                <span className="font-mono text-3xl font-black text-[#CC0000]">03</span>
                <h4 className="font-serif text-lg font-bold text-white">Single Deposit</h4>
                <p className="font-body text-xs text-[#A3A3A3]">
                  Sender deposits remittance funds into the Escrow contract via Stellar Wallets Kit (Freighter/xBull).
                </p>
              </div>

              <div className="border border-white/20 p-6 space-y-3 bg-white/5">
                <span className="font-mono text-3xl font-black text-[#CC0000]">04</span>
                <h4 className="font-serif text-lg font-bold text-white">Atomic Payout</h4>
                <p className="font-body text-xs text-[#A3A3A3]">
                  Escrow queries the registry via real Soroban inter-contract invocation and delivers funds to all recipients.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BROADSHEET BANNER */}
        <section className="p-8 sm:p-16 text-center space-y-6 bg-[#F9F9F7]">
          <span className="font-mono text-xs uppercase tracking-widest text-[#CC0000] font-bold">
            COMMENCE PROTOCOL OPERATIONS
          </span>
          <h2 className="font-serif text-4xl sm:text-6xl font-black tracking-tight text-[#111111]">
            Ready to Automate Family Remittances?
          </h2>
          <p className="font-body text-base text-[#525252] max-w-lg mx-auto">
            Connect your Stellar wallet on Testnet to execute live programmable remittances.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" variant="default" className="text-sm px-10">
                Launch RemitSplit Hub
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/deposit">
              <Button size="lg" variant="outline" className="text-sm px-10">
                Execute Remittance
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Editorial Broadsheet Footer */}
      <footer className="border-t-2 border-[#111111] bg-[#F4F4F0] py-8 px-4 font-mono text-xs text-[#525252]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative h-7 w-7 shrink-0">
              <Image
                src="/logo.png"
                alt="RemitSplit Logo"
                fill
                sizes="28px"
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-serif font-black text-sm text-[#111111] tracking-tight">REMIT SPLIT</span>
              <span className="text-[10px] text-[#737373] block">Programmable Cross-Border Remittance Protocol · Stellar Soroban</span>
            </div>
          </div>
          <div className="text-[10px] text-[#737373] text-center sm:text-right">
            <span>VOL. I · ON-CHAIN REVOLUTION</span>
            <span className="mx-2">·</span>
            <span>TESTNET CONTRACTS LIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
