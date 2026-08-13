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
  process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID || "CCOJB3FIN3CCNBCJNUK62FW44V7EG3A6P7WVIEBUW5LBA23LZM7275XD";
const DISTRIBUTION_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID || "CBDWDKUVAW2U4THOHADINH3GDVUTEYZZPI6LADORKL3EUCHRZ7G2JL72";

export const useActivityStore = create<ActivityStore>((set, get) => ({
  events: [],
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
          return {
            events: [...newEvents, ...state.events].sort((a, b) => b.timestamp - a.timestamp),
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
      if (state.events.some((e) => e.id === event.id || (e.txHash && e.txHash === event.txHash && e.type === event.type))) {
        return state;
      }
      return {
        events: [event, ...state.events],
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
