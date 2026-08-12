import { rpc, Horizon, scValToNative } from "@stellar/stellar-sdk";
import { logger } from "@/lib/logger";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

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
