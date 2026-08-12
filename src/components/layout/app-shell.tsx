"use client";

import React from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { NetworkBanner } from "./network-banner";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#111111] flex flex-col selection:bg-[#111111] selection:text-[#F9F9F7]">
      <NetworkBanner />
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto border-x-2 border-[#111111]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Broadsheet Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto bg-[#F9F9F7]">
          {children}
        </main>
      </div>

      {/* Gazette Broadsheet Footer */}
      <footer className="border-t-4 border-[#111111] bg-[#111111] text-[#F9F9F7] py-6 px-4 font-mono text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="font-serif text-lg font-bold text-white block">
              REMIT SPLIT GAZETTE
            </span>
            <p className="text-[11px] text-[#A3A3A3]">
              Programmable Cross-Border Remittance Splitting on the Stellar Network.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-[10px] uppercase tracking-widest text-[#A3A3A3]">
            <span>EDITION: VOL 1.0</span>
            <span>·</span>
            <span>SOROBAN SDK v26</span>
            <span>·</span>
            <span className="text-white font-bold">ALL RIGHTS RESERVED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
