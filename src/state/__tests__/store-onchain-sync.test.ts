import { describe, it, expect } from "vitest";
import { useWalletStore } from "@/state/use-wallet-store";
import { useFamilyStore } from "@/state/use-family-store";
import { useTransactionStore } from "@/state/use-transaction-store";
import { useActivityStore } from "@/state/use-activity-store";

describe("On-Chain Stores Initial State & Zero-Mock Guarantee", () => {
  it("initializes wallet store in a disconnected state without hardcoded fallback identity", () => {
    const walletState = useWalletStore.getState();
    expect(walletState.address).toBeNull();
    expect(walletState.isConnected).toBe(false);
    expect(walletState.walletName).toBeNull();
    expect(walletState.balance).toBe("0");
  });

  it("initializes family store with zero mock families and empty rules", () => {
    const familyState = useFamilyStore.getState();
    expect(familyState.families).toEqual([]);
    expect(familyState.rules).toEqual({});
    expect(familyState.selectedFamilyId).toBe(0);
  });

  it("initializes transaction store with zero mock transactions", () => {
    const txState = useTransactionStore.getState();
    expect(txState.transactions).toEqual([]);
  });

  it("initializes activity store with zero mock events", () => {
    const activityState = useActivityStore.getState();
    expect(activityState.events).toEqual([]);
  });

  it("getSelectedFamily returns undefined when selectedFamilyId is 0 even if families array contains items", () => {
    useFamilyStore.setState({
      families: [
        {
          id: 1,
          name: "Aalmi Global Family",
          owner: "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
          activeRuleVersion: 0,
          createdAt: Date.now(),
          members: [],
        },
      ],
      selectedFamilyId: 0,
    });

    expect(useFamilyStore.getState().getSelectedFamily()).toBeUndefined();
  });
});
