import {
  Address,
  Contract,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";

const DISTRIBUTION_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ESCROW_DISTRIBUTION_CONTRACT_ID || "";
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
    return this.contractId;
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
    const contract = new Contract(this.contractId);
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
    const contract = new Contract(this.contractId);
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
    const contract = new Contract(this.contractId);
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
    const contract = new Contract(this.contractId);
    return contract.call(
      "retry_distribution",
      nativeToScVal(new Address(caller), { type: "address" }),
      nativeToScVal(distributionId, { type: "u32" })
    );
  }
}

export const distributionContractService = new DistributionContractService();
