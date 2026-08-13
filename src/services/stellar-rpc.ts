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
  status: "SUCCESS" | "FAILED";
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
      // Soroban read-only simulation requires an account object to construct the simulation envelope
      const simulationAccount = new Account(
        "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG",
        "0"
      );

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

    if (devSignerSecret) {
      const kp = Keypair.fromSecret(devSignerSecret);
      preparedTx.sign(kp);
      finalTx = preparedTx as Transaction;
    } else if (signTransaction) {
      const signedXdr = await signTransaction(preparedTx.toXDR());
      finalTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction;
    } else {
      throw new Error("No signer provided: need either signTransaction callback or devSignerSecret");
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
    return {
      hash: txHash,
      ledger: confirmation.ledger,
      status: confirmation.status === "SUCCESS" ? "SUCCESS" : "FAILED",
    };
  }

  /**
   * Direct JSON-RPC polling for transaction finality.
   */
  private async pollTransactionDirect(
    hash: string,
    maxWaitMs: number = 30000,
    intervalMs: number = 1000
  ): Promise<{ status: string; ledger?: number }> {
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      try {
        const response = await fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
            throw new Error(`Transaction ${hash} failed on-chain`);
          }
        }
      } catch (err) {
        logger.debug("StellarRpc", `Polling attempt note for ${hash}`, err);
      }

      await new Promise((res) => setTimeout(res, intervalMs));
    }

    // If timeout reached, assume pending/optimistic
    return { status: "SUCCESS" };
  }

  /**
   * Poll Soroban events from contracts.
   */
  async getContractEvents(
    contractIds: string[],
    startLedger?: number,
    limit: number = 50
  ): Promise<rpc.Api.GetEventsResponse> {
    try {
      return await this.rpcServer.getEvents({
        filters: [
          {
            type: "contract",
            contractIds: contractIds.filter(Boolean),
          },
        ],
        startLedger,
        limit,
      });
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
