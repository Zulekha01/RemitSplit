"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFamilyStore } from "@/state/use-family-store";
import { useTransactionStore } from "@/state/use-transaction-store";
import { useActivityStore } from "@/state/use-activity-store";
import { eventSyncerService } from "@/services/event-syncer";

function OnChainBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initial fetch from live on-chain contracts
    useFamilyStore.getState().syncOnChainState();
    useTransactionStore.getState().syncOnChainTransactions();
    useActivityStore.getState().syncOnChainEvents();

    // Subscribe to live Soroban contract events
    const unsubscribe = eventSyncerService.subscribe((event) => {
      useActivityStore.getState().addEvent(event);
      // If a distribution was completed or rule activated, refresh stores
      if (
        event.type === "DISTRIBUTION_COMPLETED" ||
        event.type === "DEPOSIT_FUNDED"
      ) {
        useTransactionStore.getState().syncOnChainTransactions();
      }
      if (
        event.type === "FAMILY_CREATED" ||
        event.type === "MEMBER_ADDED" ||
        event.type === "RULE_ACTIVATED" ||
        event.type === "RULE_CREATED"
      ) {
        useFamilyStore.getState().syncOnChainState();
      }
    });

    const registryId =
      process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID ||
      "CCOJB3FIN3CCNBCJNUK62FW44V7EG3A6P7WVIEBUW5LBA23LZM7275XD";
    const distributionId =
      process.env.NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID ||
      "CBDWDKUVAW2U4THOHADINH3GDVUTEYZZPI6LADORKL3EUCHRZ7G2JL72";

    eventSyncerService.startPolling([registryId, distributionId], 6000);

    return () => {
      unsubscribe();
      eventSyncerService.stopPolling();
    };
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 30, // 30s
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <OnChainBootstrap>
        {children}
      </OnChainBootstrap>
    </QueryClientProvider>
  );
}
