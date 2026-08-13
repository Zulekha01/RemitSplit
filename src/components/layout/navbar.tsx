"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  LogOut,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWalletStore } from "@/state/use-wallet-store";
import { truncateAddress } from "@/lib/formatters";

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected, balance, walletName, isConnecting, connect, disconnect } = useWalletStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-40 bg-[#F9F9F7] border-b-2 border-[#111111] text-[#111111]">
      {/* Sleek Gazette Sub-header Strip */}
      <div className="border-b border-[#E5E5E0] bg-[#F4F4F0] px-4 py-1 text-[9px] font-mono uppercase tracking-widest text-[#737373] hidden sm:flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#111111]">VOL. I · NO. 42</span>
          <span>·</span>
          <span>{currentDate}</span>
          <span>·</span>
          <span className="text-[#16A34A] font-bold">● STELLAR TESTNET</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[#CC0000] font-bold">FEES: &lt;0.0001 XLM</span>
          <span>·</span>
          <span>SOROBAN SETTLEMENT</span>
        </div>
      </div>

      {/* Main Streamlined Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        {/* Brand Masthead Title */}
        <Link href="/" className="group flex items-baseline space-x-2">
          <span className="font-serif text-xl sm:text-2xl font-black tracking-tight leading-none text-[#111111] group-hover:text-[#CC0000] transition-colors">
            REMIT SPLIT
          </span>
          <span className="hidden sm:inline-block font-mono text-[9px] uppercase tracking-widest font-semibold text-[#737373] border-l border-[#CCCCCC] pl-2">
            Programmable Remittance Gazette
          </span>
        </Link>

        {/* Right Action & Wallet */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link href="/deposit" className="hidden sm:inline-block">
            <Button variant="editorial" size="sm" className="h-8 px-3 text-xs">
              <Send className="h-3 w-3 mr-1.5" />
              Deposit &amp; Split
            </Button>
          </Link>

          {isConnected ? (
            <div className="flex items-center space-x-2 border border-[#111111] bg-white px-2 py-1">
              <div className="flex flex-col text-right">
                <span className="font-mono text-[11px] font-bold text-[#111111] leading-tight">
                  {parseFloat(balance).toFixed(2)} XLM
                </span>
                <span className="font-mono text-[9px] tracking-wider text-[#737373] leading-none">
                  {truncateAddress(address || "")}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="h-6 w-6 p-0 border-[#111111] text-xs hover:bg-[#CC0000] hover:text-white transition-colors"
                title="Disconnect Wallet"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => connect()}
              disabled={isConnecting}
              className="h-8 px-3 text-xs"
            >
              <Wallet className="h-3.5 w-3.5 mr-1.5" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden border border-[#111111] p-1.5 hover:bg-[#111111] hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-[#111111] bg-[#F9F9F7] p-4 space-y-3 font-mono text-xs uppercase tracking-widest">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2 border border-[#111111] hover:bg-[#111111] hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/families"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2 border border-[#111111] hover:bg-[#111111] hover:text-white"
          >
            Family &amp; Members
          </Link>
          <Link
            href="/rules"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2 border border-[#111111] hover:bg-[#111111] hover:text-white"
          >
            Split Rules
          </Link>
          <Link
            href="/deposit"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2 border border-[#111111] bg-[#111111] text-white hover:bg-[#CC0000]"
          >
            Deposit &amp; Split
          </Link>
          <Link
            href="/transactions"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2 border border-[#111111] hover:bg-[#111111] hover:text-white"
          >
            Transaction Gazette
          </Link>
          <Link
            href="/activity"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2 border border-[#111111] hover:bg-[#111111] hover:text-white"
          >
            Wire Activity Feed
          </Link>
          <Link
            href="/analytics"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2 border border-[#111111] hover:bg-[#111111] hover:text-white"
          >
            Telemetry &amp; Reports
          </Link>
          <Link
            href="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2 border border-[#111111] hover:bg-[#111111] hover:text-white"
          >
            Settings &amp; Diagnostics
          </Link>
        </div>
      )}
    </header>
  );
}
