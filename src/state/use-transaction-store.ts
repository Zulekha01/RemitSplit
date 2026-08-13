"use client";

import { create } from "zustand";
import { TransactionRecord, TransactionStatus, TransactionType } from "@/types";
import { getExplorerUrl } from "@/lib/formatters";
import { logger } from "@/lib/logger";
import { distributionContractService } from "@/services/distribution-contract";

interface TransactionStore {
  transactions: TransactionRecord[];
  filterStatus: TransactionStatus | "ALL";
  filterType: TransactionType | "ALL";
  isLoadingOnChain: boolean;
  setFilterStatus: (status: TransactionStatus | "ALL") => void;
  setFilterType: (type: TransactionType | "ALL") => void;
  addTransaction: (tx: Omit<TransactionRecord, "explorerUrl">) => void;
  updateStatus: (hash: string, status: TransactionStatus, error?: string) => void;
  getFilteredTransactions: () => TransactionRecord[];
  syncOnChainTransactions: () => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  filterStatus: "ALL",
  filterType: "ALL",
  isLoadingOnChain: false,

  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterType: (type) => set({ filterType: type }),

  syncOnChainTransactions: async () => {
    set({ isLoadingOnChain: true });
    try {
      const count = await distributionContractService.fetchDistributionCount();
      if (count === 0) {
        set({ isLoadingOnChain: false });
        return;
      }

      const onChainDistributions: TransactionRecord[] = [];

      for (let id = 1; id <= count; id++) {
        try {
          const dist = await distributionContractService.fetchDistribution(id);
          if (!dist) continue;

          let status: TransactionStatus = "CONFIRMED";
          if (dist.status === "Created" || dist.status === "DepositPending") {
            status = "PENDING";
          } else if (dist.status === "Funded" || dist.status === "Processing") {
            status = "PROCESSING";
          } else if (dist.status === "Retryable" || dist.status === "PartiallyCompleted") {
            status = "RETRYABLE";
          } else if (dist.status === "Failed") {
            status = "FAILED";
          }

          const txHash = dist.txHash || `dist-${dist.id}`;

          onChainDistributions.push({
            hash: txHash,
            type: "DISTRIBUTE",
            status,
            familyId: dist.familyId,
            familyName: `Family Vault #${dist.familyId}`,
            amount: dist.grossAmount,
            depositor: dist.depositor,
            createdAt: dist.createdAt,
            updatedAt: dist.completedAt || dist.createdAt,
            distributionId: dist.id,
            explorerUrl: getExplorerUrl(
              dist.txHash ? "tx" : "contract",
              dist.txHash || process.env.NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID || ""
            ),
          });
        } catch (err) {
          logger.debug("TxStore", `Error reading distribution ${id}`, err);
        }
      }

      set((state) => {
        // Merge with any client-submitted transactions that aren't yet in on-chain distributions
        const nonDistTx = state.transactions.filter(
          (t) => t.type !== "DISTRIBUTE" || !onChainDistributions.some((d) => d.hash === t.hash || (d.distributionId && d.distributionId === t.distributionId))
        );
        return {
          transactions: [...nonDistTx, ...onChainDistributions].sort((a, b) => b.createdAt - a.createdAt),
        };
      });

      logger.info("TxStore", `Synced ${onChainDistributions.length} on-chain distributions`);
    } catch (err) {
      logger.error("TxStore", "Failed to sync on-chain distributions", err);
    } finally {
      set({ isLoadingOnChain: false });
    }
  },

  addTransaction: (tx) => {
    const fullTx: TransactionRecord = {
      ...tx,
      explorerUrl: getExplorerUrl("tx", tx.hash),
    };

    set((state) => ({
      transactions: [fullTx, ...state.transactions.filter((t) => t.hash !== tx.hash)],
    }));

    logger.info("TxStore", `New transaction recorded: ${tx.type} (${tx.hash})`);
  },

  updateStatus: (hash, status, error) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.hash === hash
          ? {
              ...tx,
              status,
              error: error || tx.error,
              updatedAt: Date.now(),
            }
          : tx
      ),
    }));

    logger.info("TxStore", `Transaction ${hash} transitioned to ${status}`);
  },

  getFilteredTransactions: () => {
    const { transactions, filterStatus, filterType } = get();
    return transactions.filter((tx) => {
      const matchStatus = filterStatus === "ALL" || tx.status === filterStatus;
      const matchType = filterType === "ALL" || tx.type === filterType;
      return matchStatus && matchType;
    });
  },
}));
