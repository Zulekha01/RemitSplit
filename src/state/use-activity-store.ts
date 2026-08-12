"use client";

import { create } from "zustand";
import { ActivityEvent } from "@/types";
import { logger } from "@/lib/logger";

const INITIAL_EVENTS: ActivityEvent[] = [
  {
    id: "evt-1",
    type: "DISTRIBUTION_COMPLETED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    actor: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
    amount: 10_000_000_000n, // 1,000 XLM
    timestamp: Date.now() - 3600000 * 4,
    txHash: "6e288924bcf8452efadfc340d86eef927d35368a1fefc3e8006e8fb297e68dbb",
    details: "Automated remittance distribution completed across 3 recipients (500 XLM, 300 XLM, 200 XLM)",
  },
  {
    id: "evt-2",
    type: "RECIPIENT_PAID",
    familyId: 1,
    familyName: "Aalmi Global Family",
    actor: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
    recipient: "GCKXE2C7KEW3OGCMFU2P4F4DMBRCI3FNQ4BXLFMNDLFJUNPU2HY3ZMF",
    amount: 5_000_000_000n, // 500 XLM
    timestamp: Date.now() - 3600000 * 4 - 1500,
    txHash: "6e288924bcf8452efadfc340d86eef927d35368a1fefc3e8006e8fb297e68dbb",
    details: "Paid 500 XLM to Parents Living Expenses",
  },
  {
    id: "evt-3",
    type: "DEPOSIT_FUNDED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    actor: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
    amount: 10_000_000_000n,
    timestamp: Date.now() - 3600000 * 4 - 3000,
    txHash: "6e288924bcf8452efadfc340d86eef927d35368a1fefc3e8006e8fb297e68dbb",
    details: "Deposited 1,000 XLM into RemitSplit escrow",
  },
  {
    id: "evt-4",
    type: "RULE_ACTIVATED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    actor: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
    timestamp: Date.now() - 86400000 * 2,
    txHash: "a4901fc8bbd28976ac3952f4001bc93ef7d1306b801a2f90cc7462cbb41991ab",
    details: "Active rule set to Version 1 (50% Parents, 30% Sibling, 20% Dependent)",
  },
  {
    id: "evt-5",
    type: "FAMILY_CREATED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    actor: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
    timestamp: Date.now() - 86400000 * 5,
    txHash: "b71329c01de23891bbd28976ac3952f4001bc93ef7d1306b801a2f90cc7462cb",
    details: "Created family group Aalmi Global Family with Zulekha as Owner",
  },
];

interface ActivityStore {
  events: ActivityEvent[];
  filterType: string;
  setFilterType: (type: string) => void;
  addEvent: (event: ActivityEvent) => void;
  getFilteredEvents: () => ActivityEvent[];
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  events: INITIAL_EVENTS,
  filterType: "ALL",

  setFilterType: (type) => set({ filterType: type }),

  addEvent: (event) => {
    set((state) => ({
      events: [event, ...state.events],
    }));
    logger.info("ActivityStore", `New event recorded: ${event.type}`);
  },

  getFilteredEvents: () => {
    const { events, filterType } = get();
    if (filterType === "ALL") return events;
    return events.filter((e) => e.type === filterType);
  },
}));
