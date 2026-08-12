import {
  Address,
  Contract,
  Operation,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";
import { Role, AllocationStrategy, AllocationItem } from "@/types";

const REGISTRY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID || "";

export class RegistryContractService {
  private contractId: string;

  constructor(contractId?: string) {
    this.contractId = contractId || REGISTRY_CONTRACT_ID;
  }

  setContractId(id: string) {
    this.contractId = id;
  }

  getContractId(): string {
    return this.contractId;
  }

  /**
   * Build operation to create a family.
   */
  buildCreateFamilyOp(owner: string, name: string): xdr.Operation {
    const contract = new Contract(this.contractId);
    return contract.call(
      "create_family",
      nativeToScVal(new Address(owner), { type: "address" }),
      nativeToScVal(name, { type: "string" })
    );
  }

  /**
   * Build operation to add a member.
   */
  buildAddMemberOp(
    caller: string,
    familyId: number,
    memberAddress: string,
    role: Role,
    name: string
  ): xdr.Operation {
    const contract = new Contract(this.contractId);
    const roleNum = role === "Sender" ? 0 : role === "CoAdmin" ? 1 : 2;

    return contract.call(
      "add_member",
      nativeToScVal(new Address(caller), { type: "address" }),
      nativeToScVal(familyId, { type: "u32" }),
      nativeToScVal(new Address(memberAddress), { type: "address" }),
      nativeToScVal(roleNum, { type: "u32" }),
      nativeToScVal(name, { type: "string" })
    );
  }

  /**
   * Build operation to create a programmable rule version.
   */
  buildCreateRuleOp(
    caller: string,
    familyId: number,
    strategy: AllocationStrategy,
    allocations: AllocationItem[]
  ): xdr.Operation {
    const contract = new Contract(this.contractId);
    const strategyNum =
      strategy === "Percentage" ? 0 : strategy === "FixedAmount" ? 1 : 2;

    const allocationsScVal = nativeToScVal(
      allocations.map((item) => ({
        recipient: new Address(item.recipient),
        share_or_amount: item.shareOrAmount,
        label: item.label,
      }))
    );

    return contract.call(
      "create_rule",
      nativeToScVal(new Address(caller), { type: "address" }),
      nativeToScVal(familyId, { type: "u32" }),
      nativeToScVal(strategyNum, { type: "u32" }),
      allocationsScVal
    );
  }

  /**
   * Build operation to activate a rule version.
   */
  buildActivateRuleOp(
    caller: string,
    familyId: number,
    version: number
  ): xdr.Operation {
    const contract = new Contract(this.contractId);
    return contract.call(
      "activate_rule",
      nativeToScVal(new Address(caller), { type: "address" }),
      nativeToScVal(familyId, { type: "u32" }),
      nativeToScVal(version, { type: "u32" })
    );
  }

  /**
   * Build operation to deactivate a rule version.
   */
  buildDeactivateRuleOp(caller: string, familyId: number): xdr.Operation {
    const contract = new Contract(this.contractId);
    return contract.call(
      "deactivate_rule",
      nativeToScVal(new Address(caller), { type: "address" }),
      nativeToScVal(familyId, { type: "u32" })
    );
  }
}

export const registryContractService = new RegistryContractService();
