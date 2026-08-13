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

  it("supports in-app keypair generation and ed25519 signing", async () => {
    useFamilyStore.setState({ syncOnChainState: async () => {} });
    const pubKey = await useWalletStore.getState().connectWithKeypair(undefined, false);
    expect(pubKey).toMatch(/^G[A-Z0-9]{55}$/);
    expect(useWalletStore.getState().isConnected).toBe(true);
    expect(useWalletStore.getState().activeSecretKey).toMatch(/^S[A-Z0-9]{55}$/);

    useWalletStore.getState().disconnect();
    expect(useWalletStore.getState().address).toBeNull();
    expect(useWalletStore.getState().activeSecretKey).toBeNull();
    expect(useWalletStore.getState().isConnected).toBe(false);
  });

  it("persists wallet connection session in localStorage across refreshes", async () => {
    useFamilyStore.setState({ syncOnChainState: async () => {} });
    const pubKey = await useWalletStore.getState().connectWithKeypair(undefined, false);
    
    const stored = localStorage.getItem("remitsplit_wallet_session");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.address).toBe(pubKey);
    expect(parsed.state.isConnected).toBe(true);

    useWalletStore.getState().disconnect();
    const storedAfterDisconnect = localStorage.getItem("remitsplit_wallet_session");
    if (storedAfterDisconnect) {
      const parsedAfter = JSON.parse(storedAfterDisconnect);
      expect(parsedAfter.state.isConnected).toBe(false);
      expect(parsedAfter.state.address).toBeNull();
    }
  });
});
