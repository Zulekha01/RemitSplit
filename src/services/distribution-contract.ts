import {
  Address,
  Contract,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";
import { DistributionRecord, DistributionStatus, AllocationStrategy } from "@/types";
import { stellarRpcService, SubmitTxResult } from "./stellar-rpc";
import { TxSignerOptions } from "./registry-contract";

const DISTRIBUTION_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID || "CAQRTZ55VOZPSW5266EQVSAIRKRVZCEC4AIIRQOL3R7MAUNZXIFGS3YM";
const NATIVE_SAC_ID =
  process.env.NEXT_PUBLIC_NATIVE_ASSET_CONTRACT_ID ||
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export class DistributionContractService {
  private contractId: string;

  constructor(contractId?: string) {
    this.contractId = contractId || DISTRIBUTION_CONTRACT_ID;
  }

  setContractId(id: string) {
    this.contractId = id;
  }

  getContractId(): string {
    return this.contractId || process.env.NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID || "CAQRTZ55VOZPSW5266EQVSAIRKRVZCEC4AIIRQOL3R7MAUNZXIFGS3YM";
  }

  /**
   * Build operation to deposit funds and immediately trigger distribution.
   */
  buildDepositAndDistributeOp(
    sender: string,
    familyId: number,
    amountStroops: bigint,
    tokenAddress: string = NATIVE_SAC_ID
  ): xdr.Operation {
    const contract = new Contract(this.getContractId());
    return contract.call(
      "deposit_and_distribute",
      nativeToScVal(new Address(sender), { type: "address" }),
      nativeToScVal(familyId, { type: "u32" }),
      nativeToScVal(new Address(tokenAddress), { type: "address" }),
      nativeToScVal(amountStroops, { type: "i128" })
    );
  }

  /**
   * Build operation to deposit funds into escrow only.
   */
  buildDepositFundsOp(
    sender: string,
    familyId: number,
    amountStroops: bigint,
    tokenAddress: string = NATIVE_SAC_ID
  ): xdr.Operation {
    const contract = new Contract(this.getContractId());
    return contract.call(
      "deposit_funds",
      nativeToScVal(new Address(sender), { type: "address" }),
      nativeToScVal(familyId, { type: "u32" }),
      nativeToScVal(new Address(tokenAddress), { type: "address" }),
      nativeToScVal(amountStroops, { type: "i128" })
    );
  }

  /**
   * Build operation to execute distribution on an escrowed deposit.
   */
  buildExecuteDistributionOp(caller: string, distributionId: number): xdr.Operation {
    const contract = new Contract(this.getContractId());
    return contract.call(
      "execute_distribution",
      nativeToScVal(new Address(caller), { type: "address" }),
      nativeToScVal(distributionId, { type: "u32" })
    );
  }

  /**
   * Build operation to safely retry a partial or failed distribution.
   */
  buildRetryDistributionOp(caller: string, distributionId: number): xdr.Operation {
    const contract = new Contract(this.getContractId());
    return contract.call(
      "retry_distribution",
      nativeToScVal(new Address(caller), { type: "address" }),
      nativeToScVal(distributionId, { type: "u32" })
    );
  }

  // --- On-Chain Transaction Execution Helpers ---

  async executeDepositAndDistribute(
    sender: string,
    familyId: number,
    amountStroops: bigint,
    tokenAddress: string = NATIVE_SAC_ID,
    options: TxSignerOptions = {}
  ): Promise<SubmitTxResult> {
    const op = this.buildDepositAndDistributeOp(sender, familyId, amountStroops, tokenAddress);
    return stellarRpcService.submitContractTransaction({
      operation: op,
      sourceAddress: sender,
      ...options,
    });
  }

  async executeDepositFunds(
    sender: string,
    familyId: number,
    amountStroops: bigint,
    tokenAddress: string = NATIVE_SAC_ID,
    options: TxSignerOptions = {}
  ): Promise<SubmitTxResult> {
    const op = this.buildDepositFundsOp(sender, familyId, amountStroops, tokenAddress);
    return stellarRpcService.submitContractTransaction({
      operation: op,
      sourceAddress: sender,
      ...options,
    });
  }

  async executeExecuteDistribution(
    caller: string,
    distributionId: number,
    options: TxSignerOptions = {}
  ): Promise<SubmitTxResult> {
    const op = this.buildExecuteDistributionOp(caller, distributionId);
    return stellarRpcService.submitContractTransaction({
      operation: op,
      sourceAddress: caller,
      ...options,
    });
  }

  async executeRetryDistribution(
    caller: string,
    distributionId: number,
    options: TxSignerOptions = {}
  ): Promise<SubmitTxResult> {
    const op = this.buildRetryDistributionOp(caller, distributionId);
    return stellarRpcService.submitContractTransaction({
      operation: op,
      sourceAddress: caller,
      ...options,
    });
  }

  // --- On-Chain View Methods ---

  async fetchDistribution(distributionId: number): Promise<DistributionRecord | null> {
    const raw = await stellarRpcService.callReadMethod(
      this.getContractId(),
      "get_distribution",
      nativeToScVal(distributionId, { type: "u32" })
    );
    if (!raw) return null;

    const statusMap: Record<number, DistributionStatus> = {
      0: "Created",
      1: "DepositPending",
      2: "Funded",
      3: "Processing",
      4: "PartiallyCompleted",
      5: "Completed",
      6: "Failed",
      7: "Retryable",
    };

    const strategyMap: Record<number, AllocationStrategy> = {
      0: "Percentage",
      1: "FixedAmount",
      2: "Waterfall",
    };

    const createdAt = Number(raw.created_at) * 1000;
    const completedAt = raw.completed_at ? Number(raw.completed_at) * 1000 : createdAt;

    return {
      id: Number(raw.id),
      familyId: Number(raw.family_id),
      ruleVersion: Number(raw.rule_version),
      depositor: String(raw.depositor),
      token: String(raw.token),
      grossAmount: BigInt(raw.gross_amount),
      distributedAmount: BigInt(raw.distributed_amount),
      strategy: strategyMap[Number(raw.strategy)] || "Percentage",
      status: statusMap[Number(raw.status)] || "Completed",
      payouts: (raw.payouts || []).map((p: any) => ({
        recipient: String(p.recipient),
        amount: BigInt(p.amount),
        label: String(p.label),
        paid: Boolean(p.paid),
      })),
      createdAt,
      completedAt,
    };
  }

  async fetchFamilyDistributions(familyId: number): Promise<number[]> {
    const raw = await stellarRpcService.callReadMethod(
      this.getContractId(),
      "get_family_distributions",
      nativeToScVal(familyId, { type: "u32" })
    );
    if (!Array.isArray(raw)) return [];
    return raw.map((id) => Number(id));
  }

  async fetchDistributionCount(): Promise<number> {
    const raw = await stellarRpcService.callReadMethod(
      this.getContractId(),
      "get_distribution_count"
    );
    return raw ? Number(raw) : 0;
  }
}

export const distributionContractService = new DistributionContractService();
