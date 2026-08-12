"use client";

import React from "react";
import Link from "next/link";
import { Wallet, LogOut, ArrowRightLeft, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/state/use-wallet-store";
import { AddressPill } from "@/components/shared/address-pill";
import { truncateAddress } from "@/lib/formatters";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { address, isConnected, balance, walletName, isConnecting, connect, disconnect } = useWalletStore();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-all">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Brand & Mobile menu */}
        <div className="flex items-center space-x-3">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                RemitSplit
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase -mt-1">
                Stellar Protocol
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Wallet connection */}
        <div className="flex items-center space-x-3">
          {isConnected && address ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="text-muted-foreground font-medium">Balance</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} XLM
                </span>
              </div>

              <AddressPill address={address} label={walletName || "Wallet"} />

              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="text-slate-600 hover:text-red-600 hover:border-red-200"
                title="Disconnect wallet"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => connect()}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
