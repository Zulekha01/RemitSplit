import {
  rpc,
  Horizon,
  scValToNative,
  TransactionBuilder,
  Account,
  Contract,
  Keypair,
  xdr,
  Transaction,
} from "@stellar/stellar-sdk";
import { logger } from "@/lib/logger";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  "Test SDF Network ; September 2015";

export interface SubmitTxOptions {
  operation: xdr.Operation;
  sourceAddress: string;
  signTransaction?: (xdrBase64: string) => Promise<string>;
  devSignerSecret?: string;
}

export interface SubmitTxResult {
  hash: string;
  ledger?: number;
  status: "SUCCESS" | "PENDING";
}

export class StellarRpcService {
  private rpcServer: rpc.Server;
  private horizonServer: Horizon.Server;

  constructor() {
    this.rpcServer = new rpc.Server(RPC_URL, { allowHttp: false });
    this.horizonServer = new Horizon.Server(HORIZON_URL);
  }

  getRpcServer(): rpc.Server {
    return this.rpcServer;
  }

  getHorizonServer(): Horizon.Server {
    return this.horizonServer;
  }

  /**
   * Fetch account native XLM balance in stroops or formatted string.
   */
  async getAccountBalance(publicKey: string): Promise<string> {
    try {
      const account = await this.horizonServer.loadAccount(publicKey);
      const nativeBalance = account.balances.find(
        (b) => b.asset_type === "native"
      );
      return nativeBalance ? nativeBalance.balance : "0";
    } catch (err) {
      logger.warn("StellarRpc", `Failed to load balance for ${publicKey}`, err);
      return "0";
    }
  }

  /**
   * Execute a read-only smart contract function call via simulation.
   */
  async callReadMethod(
    contractId: string,
    functionName: string,
    ...args: xdr.ScVal[]
  ): Promise<any> {
    try {
      const contract = new Contract(contractId);
      // Construct a dynamic ephemeral account for read simulation
      const ephemeralKey = Keypair.random();
      const simulationAccount = new Account(ephemeralKey.publicKey(), "0");

      const tx = new TransactionBuilder(simulationAccount, {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(functionName, ...args))
        .setTimeout(30)
        .build();

      const simRes = await this.rpcServer.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(simRes) && simRes.result?.retval) {
        return scValToNative(simRes.result.retval);
      }
      return null;
    } catch (err) {
      logger.debug("StellarRpc", `Simulation of ${functionName} returned note`, err);
      return null;
    }
  }

  /**
   * Fund a testnet address via official Stellar Friendbot.
   */
  async fundWithFriendbot(publicKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: text || "Friendbot funding failed" };
      }
      return { success: true, message: "Account successfully funded with 10,000 Testnet XLM" };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to reach Friendbot service" };
    }
  }

  /**
   * Prepare, simulate, sign, send, and poll a Soroban contract transaction.
   */
  async submitContractTransaction(
    options: SubmitTxOptions
  ): Promise<SubmitTxResult> {
    const { operation, sourceAddress, signTransaction, devSignerSecret } = options;

    logger.info("StellarRpc", `Preparing transaction for source ${sourceAddress}...`);

    let account: Account;
    try {
      account = await this.rpcServer.getAccount(sourceAddress);
    } catch {
      const hAccount = await this.horizonServer.loadAccount(sourceAddress);
      account = new Account(sourceAddress, hAccount.sequence);
    }

    const rawTx = new TransactionBuilder(account, {
      fee: "1000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(60)
      .build();

    const preparedTx = await this.rpcServer.prepareTransaction(rawTx);

    let finalTx: Transaction;

    if (signTransaction) {
      // Prioritize the connected wallet's cryptographic signature
      const signedXdr = await signTransaction(preparedTx.toXDR());
      finalTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction;
    } else if (devSignerSecret) {
      const kp = Keypair.fromSecret(devSignerSecret);
      preparedTx.sign(kp);
      finalTx = preparedTx as Transaction;
    } else {
      throw new Error("No signer provided: connected wallet must provide signTransaction callback");
    }

    const sendRes = await this.rpcServer.sendTransaction(finalTx);
    if (sendRes.status === "ERROR") {
      const errMsg = sendRes.errorResult?.toXDR("base64") || "Transaction failed simulation or validation";
      logger.error("StellarRpc", "Send transaction rejected", errMsg);
      throw new Error(`Stellar Transaction Rejected: ${errMsg}`);
    }

    const txHash = sendRes.hash;
    logger.info("StellarRpc", `Transaction submitted with hash ${txHash}. Polling for ledger confirmation...`);

    const confirmation = await this.pollTransactionDirect(txHash);
    if (confirmation.status === "FAILED") {
      throw new Error(confirmation.error || `Transaction ${txHash} failed on-chain`);
    }

    return {
      hash: txHash,
      ledger: confirmation.ledger,
      status: confirmation.status === "SUCCESS" ? "SUCCESS" : "PENDING",
    };
  }

  /**
   * Direct JSON-RPC polling for transaction finality without fake success fallbacks.
   */
  private async pollTransactionDirect(
    hash: string,
    maxWaitMs: number = 30000,
    intervalMs: number = 1000
  ): Promise<{ status: "SUCCESS" | "FAILED" | "PENDING"; ledger?: number; error?: string }> {
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      try {
        const response = await fetch(RPC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "RemitSplit-Client/1.0",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTransaction",
            params: { hash },
          }),
        });

        const data = await response.json();
        const result = data.result;

        if (result) {
          if (result.status === "SUCCESS") {
            logger.info("StellarRpc", `Tx ${hash} confirmed in ledger ${result.ledger}`);
            return { status: "SUCCESS", ledger: result.ledger };
          }
          if (result.status === "FAILED") {
            logger.error("StellarRpc", `Tx ${hash} failed on ledger`);
            return {
              status: "FAILED",
              error: result.errorResultXdr
                ? `Transaction ${hash} failed on-chain: ${result.errorResultXdr}`
                : `Transaction ${hash} failed on-chain`,
            };
          }
        }
      } catch (err) {
        logger.debug("StellarRpc", `Polling attempt note for ${hash}`, err);
      }

      await new Promise((res) => setTimeout(res, intervalMs));
    }

    // Check Horizon as final confirmation fallback
    try {
      const tx = await this.horizonServer.transactions().transaction(hash).call();
      if (tx && tx.successful) {
        return { status: "SUCCESS", ledger: tx.ledger_attr };
      }
    } catch {
      // Horizon not yet ingested
    }

    return { status: "PENDING" };
  }

  /**
   * Fetch retained contract events, following every page before advancing the
   * cursor. `limit` controls the RPC page size, not the total events returned.
   */
  async getContractEvents(
    contractIds: string[],
    startLedger?: number,
    limit: number = 50,
    cursor?: string
  ): Promise<rpc.Api.GetEventsResponse> {
    try {
      let firstLedger: number | undefined;
      if (!cursor) {
        // SDK 13's health type omits ledger bounds returned by newer RPC nodes.
        const health = await this.rpcServer.getHealth() as rpc.Api.GetHealthResponse & {
          oldestLedger?: number;
          latestLedger?: number;
        };
        const latestLedger = health.latestLedger ?? (await this.rpcServer.getLatestLedger()).sequence;
        const oldestLedger = Math.max(1, health.oldestLedger ?? latestLedger - 120);
        firstLedger = typeof startLedger === "number" && Number.isSafeInteger(startLedger) && startLedger > 0
          ? Math.max(oldestLedger, Math.min(startLedger, latestLedger))
          : oldestLedger;
      }

      const filters: rpc.Api.EventFilter[] = [
        { type: "contract", contractIds: contractIds.filter(Boolean) },
      ];
      let page = await this.rpcServer.getEvents({
        filters,
        ...(cursor ? { cursor } : { startLedger: firstLedger }),
        limit,
      });
      const events = [...page.events];
      // RPC limits ledger scans as well as event counts: even an empty page can
      // have more history. Its v1 cursor is a padded TOID plus an event index.
      // Stop at the initial ledger tip so a busy chain cannot extend this scan
      // indefinitely. Keep a page-size fallback for alternative cursor formats.
      const endCursor = `${((BigInt(page.latestLedger) << 32n) | 0xffffffffn)
        .toString().padStart(19, "0")}-4294967295`;
      const hasMore = () => /^\d{19}-\d{10}$/.test(page.cursor)
        ? page.cursor < endCursor
        : page.events.length === limit;
      while (page.cursor && page.cursor !== cursor && hasMore()) {
        cursor = page.cursor;
        page = await this.rpcServer.getEvents({ filters, cursor, limit });
        events.push(...page.events);
      }

      return { ...page, events };
    } catch (err) {
      logger.error("StellarRpc", "Failed to fetch contract events", err);
      throw err;
    }
  }

  /**
   * Parse Soroban SCVal to native JS object safely.
   */
  parseScVal(val: any): any {
    try {
      return scValToNative(val);
    } catch (err) {
      logger.warn("StellarRpc", "Could not parse ScVal to native", err);
      return val;
    }
  }
}

export const stellarRpcService = new StellarRpcService();
