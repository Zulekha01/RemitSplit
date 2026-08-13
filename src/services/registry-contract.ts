import {
  Address,
  Contract,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";
import { Role, AllocationStrategy, AllocationItem, Family, Member, AllocationRule } from "@/types";
import { stellarRpcService, SubmitTxResult } from "./stellar-rpc";

const REGISTRY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID || "CCOJB3FIN3CCNBCJNUK62FW44V7EG3A6P7WVIEBUW5LBA23LZM7275XD";

export interface TxSignerOptions {
  signTransaction?: (xdrBase64: string) => Promise<string>;
  devSignerSecret?: string;
}

export class RegistryContractService {
  private contractId: string;

  constructor(contractId?: string) {
    this.contractId = contractId || REGISTRY_CONTRACT_ID;
  }

  setContractId(id: string) {
    this.contractId = id;
  }

  getContractId(): string {
    return this.contractId || process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID || "CCOJB3FIN3CCNBCJNUK62FW44V7EG3A6P7WVIEBUW5LBA23LZM7275XD";
  }

  /**
   * Build operation to create a family.
   */
  buildCreateFamilyOp(owner: string, name: string): xdr.Operation {
    const contract = new Contract(this.getContractId());
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
    const contract = new Contract(this.getContractId());
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
   * Build operation to remove a member.
   */
  buildRemoveMemberOp(
    caller: string,
    familyId: number,
    memberAddress: string
  ): xdr.Operation {
    const contract = new Contract(this.getContractId());
    return contract.call(
      "remove_member",
      nativeToScVal(new Address(caller), { type: "address" }),
      nativeToScVal(familyId, { type: "u32" }),
      nativeToScVal(new Address(memberAddress), { type: "address" })
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
    const contract = new Contract(this.getContractId());
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
    const contract = new Contract(this.getContractId());
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
    const contract = new Contract(this.getContractId());
    return contract.call(
      "deactivate_rule",
      nativeToScVal(new Address(caller), { type: "address" }),
      nativeToScVal(familyId, { type: "u32" })
    );
  }

  // --- On-Chain Transaction Execution Helpers ---

  async executeCreateFamily(
    owner: string,
    name: string,
    options: TxSignerOptions = {}
  ): Promise<SubmitTxResult> {
    const op = this.buildCreateFamilyOp(owner, name);
    return stellarRpcService.submitContractTransaction({
      operation: op,
      sourceAddress: owner,
      ...options,
    });
  }

  async executeAddMember(
    caller: string,
    familyId: number,
    memberAddress: string,
    role: Role,
    name: string,
    options: TxSignerOptions = {}
  ): Promise<SubmitTxResult> {
    const op = this.buildAddMemberOp(caller, familyId, memberAddress, role, name);
    return stellarRpcService.submitContractTransaction({
      operation: op,
      sourceAddress: caller,
      ...options,
    });
  }

  async executeRemoveMember(
    caller: string,
    familyId: number,
    memberAddress: string,
    options: TxSignerOptions = {}
  ): Promise<SubmitTxResult> {
    const op = this.buildRemoveMemberOp(caller, familyId, memberAddress);
    return stellarRpcService.submitContractTransaction({
      operation: op,
      sourceAddress: caller,
      ...options,
    });
  }

  async executeCreateRule(
    caller: string,
    familyId: number,
    strategy: AllocationStrategy,
    allocations: AllocationItem[],
    options: TxSignerOptions = {}
  ): Promise<SubmitTxResult> {
    const op = this.buildCreateRuleOp(caller, familyId, strategy, allocations);
    return stellarRpcService.submitContractTransaction({
      operation: op,
      sourceAddress: caller,
      ...options,
    });
  }

  async executeActivateRule(
    caller: string,
    familyId: number,
    version: number,
    options: TxSignerOptions = {}
  ): Promise<SubmitTxResult> {
    const op = this.buildActivateRuleOp(caller, familyId, version);
    return stellarRpcService.submitContractTransaction({
      operation: op,
      sourceAddress: caller,
      ...options,
    });
  }

  async executeDeactivateRule(
    caller: string,
    familyId: number,
    options: TxSignerOptions = {}
  ): Promise<SubmitTxResult> {
    const op = this.buildDeactivateRuleOp(caller, familyId);
    return stellarRpcService.submitContractTransaction({
      operation: op,
      sourceAddress: caller,
      ...options,
    });
  }

  // --- On-Chain View Methods ---

  async fetchFamily(familyId: number): Promise<Family | null> {
    const raw = await stellarRpcService.callReadMethod(
      this.getContractId(),
      "get_family",
      nativeToScVal(familyId, { type: "u32" })
    );
    if (!raw) return null;

    return {
      id: Number(raw.id),
      name: String(raw.name),
      owner: String(raw.owner),
      activeRuleVersion: Number(raw.active_rule_version),
      createdAt: Number(raw.created_at) * 1000,
    };
  }

  async fetchMembers(familyId: number): Promise<Member[]> {
    const raw = await stellarRpcService.callReadMethod(
      this.getContractId(),
      "get_members",
      nativeToScVal(familyId, { type: "u32" })
    );
    if (!Array.isArray(raw)) return [];

    return raw.map((m: any) => ({
      address: String(m.address),
      role: m.role === 0 ? "Sender" : m.role === 1 ? "CoAdmin" : "Recipient",
      name: String(m.name),
      joinedAt: Number(m.joined_at) * 1000,
    }));
  }

  async fetchActiveRule(familyId: number): Promise<AllocationRule | null> {
    const raw = await stellarRpcService.callReadMethod(
      this.getContractId(),
      "get_active_rule",
      nativeToScVal(familyId, { type: "u32" })
    );
    if (!raw) return null;

    const strategyMap: Record<number, AllocationStrategy> = {
      0: "Percentage",
      1: "FixedAmount",
      2: "Waterfall",
    };

    return {
      id: Number(raw.id),
      familyId: Number(raw.family_id),
      version: Number(raw.version),
      strategy: strategyMap[Number(raw.strategy)] || "Percentage",
      active: Boolean(raw.active),
      createdBy: String(raw.created_by),
      createdAt: Number(raw.created_at) * 1000,
      allocations: (raw.allocations || []).map((a: any) => ({
        recipient: String(a.recipient),
        shareOrAmount: BigInt(a.share_or_amount),
        label: String(a.label),
      })),
    };
  }
}

export const registryContractService = new RegistryContractService();
