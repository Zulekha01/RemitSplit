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
    actor: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
    amount: 10_000_000n, // 1 XLM
    timestamp: 1788200197000,
    txHash: "7fe7159c3f618393fca6f76970410f20b195245504a3c7a8f07f2d7c081691ca",
    details: "Automated remittance distribution completed across 2 recipients (0.50 XLM, 0.50 XLM)",
  },
  {
    id: "evt-2",
    type: "RECIPIENT_PAID",
    familyId: 1,
    familyName: "Aalmi Global Family",
    actor: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
    recipient: "GDEEOM6PWOO6RIRSMEOOKGQUEKTYBWR37DBOU6RAPDU5YPR7VNGM6EJX",
    amount: 5_000_000n, // 0.5 XLM
    timestamp: 1788200197000 - 1000,
    txHash: "7fe7159c3f618393fca6f76970410f20b195245504a3c7a8f07f2d7c081691ca",
    details: "Paid 0.50 XLM to Mother Living Allowance on Stellar Testnet",
  },
  {
    id: "evt-3",
    type: "DEPOSIT_FUNDED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    actor: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
    amount: 10_000_000n,
    timestamp: 1788200197000 - 2000,
    txHash: "7fe7159c3f618393fca6f76970410f20b195245504a3c7a8f07f2d7c081691ca",
    details: "Deposited 1.00 XLM into RemitSplit escrow vault on Stellar Testnet",
  },
  {
    id: "evt-4",
    type: "RULE_ACTIVATED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    actor: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
    timestamp: 1788200180000,
    txHash: "67c72501e9a135a7563a6b3db2de4c7ab5c2bc9e6754fc4bb204d63e1c5bedcb",
    details: "Active rule set to Version 1 (50% Mother, 50% Sister)",
  },
  {
    id: "evt-5",
    type: "FAMILY_CREATED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    actor: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
    timestamp: 1788200057000,
    txHash: "38a736f3ea7989575cd45cca403ad5420448ed25a7e5f7abf9223c441ef2c5ae",
    details: "Created family group Aalmi Global Family with remitsplit_deployer as Owner",
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
