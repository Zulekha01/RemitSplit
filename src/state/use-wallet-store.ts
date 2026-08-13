"use client";

import { create } from "zustand";
import { Horizon, Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { logger } from "@/lib/logger";

const DEV_ACCOUNT_ADDRESS = "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG";
const DEV_ACCOUNT_SECRET =
  process.env.NEXT_PUBLIC_DEV_ACCOUNT_SECRET ||
  "";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  "Test SDF Network ; September 2015";

interface WalletStore {
  address: string | null;
  activeSecretKey: string | null;
  isConnected: boolean;
  network: string;
  balance: string;
  walletName: string | null;
  isConnecting: boolean;
  isFunding: boolean;
  error: string | null;
  kit: any | null;
  connect: (customAddress?: string) => Promise<void>;
  connectWithKeypair: (secretKey?: string, autoFund?: boolean) => Promise<string>;
  fundTestnetAccount: () => Promise<{ success: boolean; message: string }>;
  disconnect: () => void | Promise<void>;
  refreshBalance: () => Promise<void>;
  signTransaction: (xdrString: string) => Promise<string>;
  getSignerOptions: () => {
    signTransaction: (xdrString: string) => Promise<string>;
  };
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  address: null,
  activeSecretKey: null,
  isConnected: false,
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet",
  balance: "0",
  walletName: null,
  isConnecting: false,
  isFunding: false,
  error: null,
  kit: null,

  connect: async (customAddress?: string) => {
    set({ isConnecting: true, error: null });

    try {
      if (customAddress) {
        set({
          address: customAddress,
          activeSecretKey: null,
          isConnected: true,
          walletName: "Custom Account (View Only)",
          isConnecting: false,
        });
        await get().refreshBalance();
        const { useFamilyStore } = await import("@/state/use-family-store");
        const families = useFamilyStore.getState().families;
        const myFamily = families.find(
          (f) => f.owner === customAddress || f.members?.some((m) => m.address === customAddress)
        );
        useFamilyStore.getState().selectFamily(myFamily ? myFamily.id : 0);
        return;
      }

      let kitInstance = get().kit;
      if (!kitInstance && typeof window !== "undefined") {
        const { StellarWalletsKit, WalletNetwork, allowAllModules } = await import(
          "@creit.tech/stellar-wallets-kit"
        );
        kitInstance = new StellarWalletsKit({
          network: WalletNetwork.TESTNET,
          selectedWalletId: "freighter",
          modules: allowAllModules(),
        });
        set({ kit: kitInstance });
      }

      if (!kitInstance) {
        throw new Error("Wallet kit not available");
      }

      await kitInstance.openModal({
        onWalletSelected: async (option: any) => {
          try {
            kitInstance?.setWallet(option.id);
            const { address } = await kitInstance!.getAddress();
            set({
              address,
              activeSecretKey: null,
              isConnected: true,
              walletName: option.name,
              isConnecting: false,
            });
            await get().refreshBalance();
            const { useFamilyStore } = await import("@/state/use-family-store");
            const families = useFamilyStore.getState().families;
            const myFamily = families.find(
              (f) => f.owner === address || f.members?.some((m) => m.address === address)
            );
            useFamilyStore.getState().selectFamily(myFamily ? myFamily.id : 0);
            logger.info("Wallet", `Connected wallet ${option.name}: ${address}`);
          } catch (err: any) {
            logger.error("Wallet", "Failed to connect wallet", err);
            set({ error: err.message || "Failed to connect wallet", isConnecting: false });
          }
        },
        onClosed: () => {
          set({ isConnecting: false });
        },
      });
    } catch (err: any) {
      logger.error("Wallet", "Connection error", err);
      set({ error: err.message || "Failed to connect wallet", isConnecting: false });
    }
  },

  connectWithKeypair: async (secretKey?: string, autoFund: boolean = true): Promise<string> => {
    set({ isConnecting: true, error: null });
    try {
      let kp: Keypair;
      if (secretKey && secretKey.trim().startsWith("S")) {
        kp = Keypair.fromSecret(secretKey.trim());
      } else {
        kp = Keypair.random();
      }

      const pubKey = kp.publicKey();
      const secKey = kp.secret();

      set({
        address: pubKey,
        activeSecretKey: secKey,
        isConnected: true,
        walletName: secretKey ? "Imported Keypair" : "Generated Testnet Signer",
        isConnecting: false,
      });

      // Auto-fund if requested and brand new account
      if (autoFund) {
        const { stellarRpcService } = await import("@/services/stellar-rpc");
        const currentBal = await stellarRpcService.getAccountBalance(pubKey);
        if (parseFloat(currentBal) <= 0) {
          logger.info("Wallet", `Auto-funding testnet keypair ${pubKey} with Friendbot...`);
          await stellarRpcService.fundWithFriendbot(pubKey);
        }
      }

      await get().refreshBalance();

      const { useFamilyStore } = await import("@/state/use-family-store");
      await useFamilyStore.getState().syncOnChainState();
      const families = useFamilyStore.getState().families;
      const myFamily = families.find(
        (f) => f.owner === pubKey || f.members?.some((m) => m.address === pubKey)
      );
      useFamilyStore.getState().selectFamily(myFamily ? myFamily.id : 0);

      logger.info("Wallet", `Connected Keypair Signer: ${pubKey}`);
      return pubKey;
    } catch (err: any) {
      logger.error("Wallet", "Failed to initialize keypair signer", err);
      set({ error: err.message || "Failed to initialize keypair signer", isConnecting: false });
      throw err;
    }
  },

  fundTestnetAccount: async (): Promise<{ success: boolean; message: string }> => {
    const { address } = get();
    if (!address) {
      return { success: false, message: "No wallet connected" };
    }

    set({ isFunding: true });
    try {
      const { stellarRpcService } = await import("@/services/stellar-rpc");
      const res = await stellarRpcService.fundWithFriendbot(address);
      if (res.success) {
        // Wait 1.5s for Horizon ingestion
        await new Promise((r) => setTimeout(r, 1500));
        await get().refreshBalance();
      }
      return res;
    } finally {
      set({ isFunding: false });
    }
  },

  disconnect: async () => {
    set({
      address: null,
      activeSecretKey: null,
      isConnected: false,
      balance: "0",
      walletName: null,
      error: null,
    });
    try {
      const { useFamilyStore } = await import("@/state/use-family-store");
      useFamilyStore.getState().selectFamily(0);
    } catch {
      // Ignore
    }
    logger.info("Wallet", "Disconnected");
  },

  refreshBalance: async () => {
    const { address } = get();
    if (!address) return;

    try {
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await server.loadAccount(address);
      const nativeBalance = account.balances.find((b) => b.asset_type === "native");
      const balance = nativeBalance ? nativeBalance.balance : "0";
      set({ balance });
    } catch (err) {
      logger.debug("Wallet", "Could not fetch balance from Horizon", err);
    }
  },

  signTransaction: async (xdrString: string): Promise<string> => {
    const { kit, activeSecretKey } = get();

    // 1. Prioritize In-App Keypair Signer if active
    if (activeSecretKey) {
      const kp = Keypair.fromSecret(activeSecretKey);
      const tx = TransactionBuilder.fromXDR(xdrString, NETWORK_PASSPHRASE);
      tx.sign(kp);
      return tx.toXDR();
    }

    // 2. Prioritize Browser Extension (Freighter / xBull / Albedo via Stellar Wallets Kit)
    if (kit) {
      const res = await kit.signTransaction(xdrString, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      const signedXdr =
        typeof res === "string"
          ? res
          : res?.signedTxXdr || (res as any)?.signedXDR || (res as any)?.xdr;

      if (!signedXdr) {
        throw new Error("Wallet extension did not return signed transaction XDR");
      }
      return signedXdr;
    }

    throw new Error("No signer available: please connect Freighter or activate a Testnet Keypair Signer");
  },

  getSignerOptions: () => {
    return {
      signTransaction: get().signTransaction,
    };
  },
}));
