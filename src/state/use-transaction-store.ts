"use client";

import { create } from "zustand";
import { TransactionRecord, TransactionStatus, TransactionType } from "@/types";
import { getExplorerUrl } from "@/lib/formatters";
import { logger } from "@/lib/logger";

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    hash: "6e288924bcf8452efadfc340d86eef927d35368a1fefc3e8006e8fb297e68dbb",
    type: "DISTRIBUTE",
    status: "CONFIRMED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    amount: 10_000_000_000n, // 1,000 XLM
    depositor: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4 + 3500,
    explorerUrl: getExplorerUrl("tx", "6e288924bcf8452efadfc340d86eef927d35368a1fefc3e8006e8fb297e68dbb"),
  },
  {
    hash: "a4901fc8bbd28976ac3952f4001bc93ef7d1306b801a2f90cc7462cbb41991ab",
    type: "ACTIVATE_RULE",
    status: "CONFIRMED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    depositor: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2 + 2800,
    explorerUrl: getExplorerUrl("tx", "a4901fc8bbd28976ac3952f4001bc93ef7d1306b801a2f90cc7462cbb41991ab"),
  },
  {
    hash: "b71329c01de23891bbd28976ac3952f4001bc93ef7d1306b801a2f90cc7462cb",
    type: "CREATE_FAMILY",
    status: "CONFIRMED",
    familyId: 1,
    familyName: "Aalmi Global Family",
    depositor: "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S",
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5 + 3100,
    explorerUrl: getExplorerUrl("tx", "b71329c01de23891bbd28976ac3952f4001bc93ef7d1306b801a2f90cc7462cb"),
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
