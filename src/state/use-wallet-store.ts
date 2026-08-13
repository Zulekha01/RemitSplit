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
  isConnected: boolean;
  network: string;
  balance: string;
  walletName: string | null;
  isConnecting: boolean;
  error: string | null;
  kit: any | null;
  connect: (customAddress?: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  signTransaction: (xdrString: string) => Promise<string>;
  getSignerOptions: () => {
    signTransaction?: (xdrString: string) => Promise<string>;
    devSignerSecret?: string;
  };
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  address: null,
  isConnected: false,
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet",
  balance: "0",
  walletName: null,
  isConnecting: false,
  error: null,
  kit: null,

  connect: async (customAddress?: string) => {
    set({ isConnecting: true, error: null });

    try {
      if (customAddress) {
        set({
          address: customAddress,
          isConnected: true,
          walletName: "Custom Account",
          isConnecting: false,
        });
        await get().refreshBalance();
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
              isConnected: true,
              walletName: option.name,
              isConnecting: false,
            });
            await get().refreshBalance();
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

  disconnect: () => {
    set({
      address: null,
      isConnected: false,
      balance: "0",
      walletName: null,
      error: null,
    });
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
    const { kit, address } = get();
    if (kit && get().walletName !== "Dev Account (remitsplit_deployer)" && get().walletName !== "Dev Account") {
      const { signedTxXdr } = await kit.signTransaction(xdrString, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      return signedTxXdr;
    }

    // Dev mode / fallback keypair signing
    if (DEV_ACCOUNT_SECRET && (!address || address === DEV_ACCOUNT_ADDRESS)) {
      const kp = Keypair.fromSecret(DEV_ACCOUNT_SECRET);
      const tx = TransactionBuilder.fromXDR(xdrString, NETWORK_PASSPHRASE);
      tx.sign(kp);
      return tx.toXDR();
    }

    return xdrString;
  },

  getSignerOptions: () => {
    const { kit, walletName } = get();
    const isUsingKit = kit && walletName !== "Dev Account (remitsplit_deployer)" && walletName !== "Dev Account";

    if (isUsingKit) {
      return {
        signTransaction: get().signTransaction,
      };
    }

    return {
      devSignerSecret: DEV_ACCOUNT_SECRET,
      signTransaction: get().signTransaction,
    };
  },
}));
