"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sliders,
  Send,
  History,
  Activity,
  BarChart3,
  Settings,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFamilyStore } from "@/state/use-family-store";
import { useWalletStore } from "@/state/use-wallet-store";

export function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected } = useWalletStore();
  const { families, selectedFamilyId, selectFamily, getSelectedFamily } = useFamilyStore();
  const selectedFamily = getSelectedFamily();

  // Only display families that belong to the connected user
  const userFamilies = address
    ? families.filter((f) => f.owner === address || f.members?.some((m) => m.address === address))
    : [];

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Family Directory", href: "/families", icon: Users },
    { label: "Split Rules", href: "/rules", icon: Sliders },
    { label: "Deposit & Split", href: "/deposit", icon: Send, badge: "DISPATCH" },
    { label: "Transaction Gazette", href: "/transactions", icon: History },
    { label: "Wire Feed", href: "/activity", icon: Activity },
    { label: "Telemetry & Stats", href: "/analytics", icon: BarChart3 },
    { label: "Protocol Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r-2 border-[#111111] bg-[#F9F9F7] flex flex-col justify-between shrink-0 min-h-[calc(100vh-80px)] font-mono text-xs">
      <div className="space-y-4">
        {/* Family Group Selector Header */}
        <div className="p-3 border-b-2 border-[#111111] bg-[#F5F5F5]">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#737373] mb-1">
            <span>ACTIVE FAMILY GROUP</span>
            <span className={selectedFamily ? "text-[#008000]" : "text-[#737373]"}>●</span>
          </div>

          <select
            value={selectedFamilyId}
            onChange={(e) => selectFamily(Number(e.target.value))}
            className="w-full text-xs font-mono font-bold rounded-none border-2 border-[#111111] bg-[#F9F9F7] px-2 py-1 text-[#111111] focus:outline-none focus:bg-white"
          >
            {families.length === 0 ? (
              <option value={0}>— Loading On-Chain Vaults —</option>
            ) : null}
            {userFamilies.length > 0 && (
              <optgroup label="MY AUTHORIZED VAULTS">
                {userFamilies.map((f) => (
                  <option key={`my-${f.id}`} value={f.id}>
                    #{f.id} · {f.name}
                  </option>
                ))}
              </optgroup>
            )}
            {families.length > 0 && (
              <optgroup label="ON-CHAIN VAULTS DIRECTORY">
                {families.map((f) => (
                  <option key={`all-${f.id}`} value={f.id}>
                    #{f.id} · {f.name} {address && f.owner === address ? "(Owner)" : ""}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Navigation Section */}
        <div className="px-3 space-y-1">
          <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-[#737373]">
            SECTIONS &amp; DEPARTMENTS
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 font-bold uppercase tracking-wider transition-all border ${
                    isActive
                      ? "border-[#111111] bg-[#111111] text-[#F9F9F7] shadow-[3px_3px_0px_0px_#CC0000]"
                      : "border-transparent text-[#111111] hover:border-[#111111] hover:bg-[#E5E5E0]/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] bg-[#CC0000] text-white px-1.5 py-0.2 font-black">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Editorial Footer Note */}
      <div className="p-4 border-t-2 border-[#111111] bg-[#F5F5F5] text-[10px] space-y-2 text-[#737373]">
        <div className="flex items-center space-x-2">
          <div className="relative h-4 w-4 shrink-0">
            <Image
              src="/logo.png"
              alt="RemitSplit Stamp"
              fill
              sizes="16px"
              className="object-contain"
            />
          </div>
          <div className="font-bold text-[#111111] uppercase tracking-wider">
            STAMP OF VERIFICATION
          </div>
        </div>
        <p className="leading-tight font-body">
          All rule logic executed via audited Soroban contract-to-contract invocations.
        </p>
      </div>
    </aside>
  );
}
