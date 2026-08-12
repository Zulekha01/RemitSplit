import { describe, it, expect, beforeEach } from "vitest";
import { useTransactionStore } from "@/state/use-transaction-store";

describe("Transaction Lifecycle State Machine", () => {
  beforeEach(() => {
    useTransactionStore.setState({
      transactions: [],
      filterStatus: "ALL",
      filterType: "ALL",
    });
  });

  it("records a new transaction in pending state and transitions to confirmed", () => {
    const store = useTransactionStore.getState();
    const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    store.addTransaction({
      hash,
      type: "DISTRIBUTE",
      status: "PENDING",
      amount: 500_0000000n,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    let current = useTransactionStore.getState().transactions.find((tx) => tx.hash === hash);
    expect(current?.status).toBe("PENDING");

    store.updateStatus(hash, "PROCESSING");
    current = useTransactionStore.getState().transactions.find((tx) => tx.hash === hash);
    expect(current?.status).toBe("PROCESSING");

    store.updateStatus(hash, "CONFIRMED");
    current = useTransactionStore.getState().transactions.find((tx) => tx.hash === hash);
    expect(current?.status).toBe("CONFIRMED");
  });

  it("supports retry transitions on failed/retryable distributions", () => {
    const store = useTransactionStore.getState();
    const hash = "0xfail1234";

    store.addTransaction({
      hash,
      type: "DISTRIBUTE",
      status: "FAILED",
      error: "Temporary network timeout",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    store.updateStatus(hash, "RETRYABLE");
    let current = useTransactionStore.getState().transactions.find((tx) => tx.hash === hash);
    expect(current?.status).toBe("RETRYABLE");

    store.updateStatus(hash, "CONFIRMED");
    current = useTransactionStore.getState().transactions.find((tx) => tx.hash === hash);
    expect(current?.status).toBe("CONFIRMED");
  });
});
