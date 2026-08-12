"use client";

import React, { useState } from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { NetworkBanner } from "./network-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30 dark:bg-slate-950">
      <NetworkBanner />
      <Navbar onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div className="flex-1 flex container mx-auto px-0 md:px-4">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden lg:flex my-4 rounded-2xl shadow-sm h-[calc(100vh-8.5rem)] sticky top-20" />

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <Sidebar
              className="relative z-50 h-full w-72 bg-white dark:bg-slate-950 p-4 shadow-2xl"
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl overflow-x-hidden">
          {children}
        </main>
      </div>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground bg-white/50 dark:bg-slate-950/50">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RemitSplit &copy; 2026 — Programmable Cross-Border Remittance Protocol on Stellar</span>
          <div className="flex items-center space-x-4">
            <a
              href="https://developers.stellar.org"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              Stellar Docs
            </a>
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              StellarExpert Testnet
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
