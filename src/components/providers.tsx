"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFamilyStore } from "@/state/use-family-store";
import { useTransactionStore } from "@/state/use-transaction-store";
import { useActivityStore } from "@/state/use-activity-store";
import { eventSyncerService } from "@/services/event-syncer";

import { useWalletStore } from "@/state/use-wallet-store";
import { registryContractService } from "@/services/registry-contract";
import { distributionContractService } from "@/services/distribution-contract";

function OnChainBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initial fetch from live on-chain contracts
    useFamilyStore.getState().syncOnChainState();
    useTransactionStore.getState().syncOnChainTransactions();
    useActivityStore.getState().syncOnChainEvents();

    // Rehydrate and refresh wallet balance if session was persisted
    const wallet = useWalletStore.getState();
    if (wallet.isConnected && wallet.address) {
      wallet.refreshBalance().catch(() => {});
    }

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

    const registryId = registryContractService.getContractId();
    const distributionId = distributionContractService.getContractId();

    eventSyncerService.startPolling([registryId, distributionId], 10000);

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
