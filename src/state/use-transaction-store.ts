"use client";

import { create } from "zustand";
import { TransactionRecord, TransactionStatus, TransactionType } from "@/types";
import { getExplorerUrl } from "@/lib/formatters";
import { logger } from "@/lib/logger";

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    hash: "7fe7159c3f618393fca6f76970410f20b195245504a3c7a8f07f2d7c081691ca",
    type: "DISTRIBUTE",
    status: "CONFIRMED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    amount: 10_000_000n, // 1 XLM
    depositor: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
    createdAt: 1788200197000,
    updatedAt: 1788200197000 + 1200,
    explorerUrl: getExplorerUrl("tx", "7fe7159c3f618393fca6f76970410f20b195245504a3c7a8f07f2d7c081691ca"),
  },
  {
    hash: "67c72501e9a135a7563a6b3db2de4c7ab5c2bc9e6754fc4bb204d63e1c5bedcb",
    type: "ACTIVATE_RULE",
    status: "CONFIRMED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    depositor: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
    createdAt: 1788200180000,
    updatedAt: 1788200180000 + 1100,
    explorerUrl: getExplorerUrl("tx", "67c72501e9a135a7563a6b3db2de4c7ab5c2bc9e6754fc4bb204d63e1c5bedcb"),
  },
  {
    hash: "2c6cae3683d854340696483ad4225f8cdf07352e1505717287780a423e496b73",
    type: "CREATE_RULE",
    status: "CONFIRMED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    depositor: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
    createdAt: 1788200150000,
    updatedAt: 1788200150000 + 1000,
    explorerUrl: getExplorerUrl("tx", "2c6cae3683d854340696483ad4225f8cdf07352e1505717287780a423e496b73"),
  },
  {
    hash: "38a736f3ea7989575cd45cca403ad5420448ed25a7e5f7abf9223c441ef2c5ae",
    type: "CREATE_FAMILY",
    status: "CONFIRMED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    depositor: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
    createdAt: 1788200057000,
    updatedAt: 1788200057000 + 1000,
    explorerUrl: getExplorerUrl("tx", "38a736f3ea7989575cd45cca403ad5420448ed25a7e5f7abf9223c441ef2c5ae"),
  },
];

interface TransactionStore {
  transactions: TransactionRecord[];
  filterStatus: TransactionStatus | "ALL";
  filterType: TransactionType | "ALL";
  setFilterStatus: (status: TransactionStatus | "ALL") => void;
  setFilterType: (type: TransactionType | "ALL") => void;
  addTransaction: (tx: Omit<TransactionRecord, "explorerUrl">) => void;
  updateStatus: (hash: string, status: TransactionStatus, error?: string) => void;
  getFilteredTransactions: () => TransactionRecord[];
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: INITIAL_TRANSACTIONS,
  filterStatus: "ALL",
  filterType: "ALL",

  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterType: (type) => set({ filterType: type }),

  addTransaction: (tx) => {
    const fullTx: TransactionRecord = {
      ...tx,
      explorerUrl: getExplorerUrl("tx", tx.hash),
    };

    set((state) => ({
      transactions: [fullTx, ...state.transactions],
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
