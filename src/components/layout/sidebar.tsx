"use client";

import React from "react";
import Link from "next/link";
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
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFamilyStore } from "@/state/use-family-store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Family & Members", href: "/families", icon: Users },
  { label: "Split Rules", href: "/rules", icon: Sliders },
  { label: "Deposit & Split", href: "/deposit", icon: Send, badge: "Action" },
  { label: "Transaction Center", href: "/transactions", icon: History },
  { label: "Activity Feed", href: "/activity", icon: Activity },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className, onClose }: { className?: string; onClose?: () => void }) {
  const pathname = usePathname();
  const { families, selectedFamilyId, selectFamily } = useFamilyStore();
  const activeFamily = families.find((f) => f.id === selectedFamilyId) || families[0];

  return (
    <aside
      className={cn(
        "w-64 border-r bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between p-4",
        className
      )}
    >
      <div className="space-y-6">
        {/* Active Family Selector */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border shadow-sm">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Active Family Group
          </label>
          <select
            value={selectedFamilyId}
            onChange={(e) => selectFamily(Number(e.target.value))}
            className="w-full text-xs font-semibold rounded-lg border border-input bg-background px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} (ID: #{f.id})
              </option>
            ))}
          </select>
          {activeFamily && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{activeFamily.members?.length || 1} members</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Rule v{activeFamily.activeRuleVersion || 0} active
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-110",
                      isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Contract & RBAC Status Badge */}
      <div className="p-3.5 rounded-xl border bg-gradient-to-b from-blue-50/50 to-indigo-50/50 dark:from-slate-900/50 dark:to-blue-950/20 border-blue-100 dark:border-blue-900/30 text-xs">
        <div className="flex items-center space-x-2 font-semibold text-blue-900 dark:text-blue-200 mb-1">
          <ShieldAlert className="h-4 w-4 text-blue-600" />
          <span>Soroban Verified</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Contract-enforced RBAC and deterministic remainder arithmetic.
        </p>
      </div>
    </aside>
  );
}
