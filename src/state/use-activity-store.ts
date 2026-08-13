"use client";

import { create } from "zustand";
import { ActivityEvent } from "@/types";
import { logger } from "@/lib/logger";
import { stellarRpcService } from "@/services/stellar-rpc";
import { eventSyncerService } from "@/services/event-syncer";

interface ActivityStore {
  events: ActivityEvent[];
  filterType: string;
  isLoadingOnChain: boolean;
  setFilterType: (type: string) => void;
  addEvent: (event: ActivityEvent) => void;
  getFilteredEvents: () => ActivityEvent[];
  syncOnChainEvents: () => Promise<void>;
}

const REGISTRY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID || "CAXOUQARANNK6E3FIS2DWYK3QMYKWXJSY2HNPGP4XCIKGGNV5LTESS3D";
const DISTRIBUTION_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID || "CAQXR3PGPCVA7U3MZ3WAMZW7IXGFI6QVTYG34QKVHXYNGHE2SQEZLOM5";

const ACTIVITY_STORAGE_KEY = "remitsplit_activity_testnet";

function loadStoredEvents(): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((e) => ({
          ...e,
          amount: e.amount ? BigInt(e.amount) : undefined,
        }))
      : [];
  } catch {
    return [];
  }
}

function saveStoredEvents(events: ActivityEvent[]) {
  if (typeof window === "undefined") return;
  try {
    const serializable = events.slice(0, 100).map((e) => ({
      ...e,
      amount: e.amount ? e.amount.toString() : undefined,
    }));
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore storage quota limits
  }
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  events: loadStoredEvents(),
  filterType: "ALL",
  isLoadingOnChain: false,

  setFilterType: (type) => set({ filterType: type }),

  syncOnChainEvents: async () => {
    set({ isLoadingOnChain: true });
    try {
      const contractIds = [REGISTRY_CONTRACT_ID, DISTRIBUTION_CONTRACT_ID].filter(Boolean);
      const res = await stellarRpcService.getContractEvents(contractIds, undefined, 50);

      if (res && res.events && res.events.length > 0) {
        const decodedEvents: ActivityEvent[] = [];
        for (const rawEv of res.events) {
          const decoded = eventSyncerService.decodeSorobanEvent(rawEv);
          if (decoded) {
            decodedEvents.push(decoded);
          }
        }

        set((state) => {
          const existingIds = new Set(state.events.map((e) => e.id));
          const newEvents = decodedEvents.filter((e) => !existingIds.has(e.id));
          const merged = [...newEvents, ...state.events].sort((a, b) => b.timestamp - a.timestamp);
          saveStoredEvents(merged);
          return {
            events: merged,
          };
        });

        logger.info("ActivityStore", `Loaded ${decodedEvents.length} on-chain events`);
      }
    } catch (err) {
      logger.debug("ActivityStore", "Could not fetch past on-chain events, will listen live", err);
    } finally {
      set({ isLoadingOnChain: false });
    }
  },

  addEvent: (event) => {
    set((state) => {
      // Prevent duplicate events
      if (
        state.events.some(
          (e) =>
            e.id === event.id ||
            (e.txHash && e.txHash === event.txHash && e.type === event.type)
        )
      ) {
        return state;
      }
      const updated = [event, ...state.events];
      saveStoredEvents(updated);
      return {
        events: updated,
      };
    });
    logger.info("ActivityStore", `New event recorded: ${event.type}`);
  },

  getFilteredEvents: () => {
    const { events, filterType } = get();
    if (filterType === "ALL") return events;
    return events.filter((e) => e.type === filterType);
  },
}));
