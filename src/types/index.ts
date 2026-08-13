/**
 * RemitSplit Domain Models and Strict TypeScript Definitions
 */

export type Role = "Sender" | "CoAdmin" | "Recipient";

export type AllocationStrategy = "Percentage" | "FixedAmount" | "Waterfall";

export interface AllocationItem {
  recipient: string;
  shareOrAmount: bigint; // Basis points for %, Stroops for Fixed/Waterfall
  label: string;
}

export interface AllocationRule {
  id: number;
  familyId: number;
  version: number;
  strategy: AllocationStrategy;
  allocations: AllocationItem[];
  createdBy: string;
  createdAt: number;
  active: boolean;
}

export interface Member {
  address: string;
  role: Role;
  name: string;
  joinedAt: number;
}

export interface Family {
  id: number;
  name: string;
  owner: string;
  activeRuleVersion: number;
  createdAt: number;
  members?: Member[];
  activeRule?: AllocationRule;
}

export type DistributionStatus =
  | "Created"
  | "DepositPending"
  | "Funded"
  | "Processing"
  | "PartiallyCompleted"
  | "Completed"
  | "Failed"
  | "Retryable";

export interface RecipientPayout {
  recipient: string;
  amount: bigint;
  paid: boolean;
  label: string;
}

export interface DistributionRecord {
  id: number;
  familyId: number;
  ruleVersion: number;
  depositor: string;
  token: string;
  grossAmount: bigint;
  distributedAmount: bigint;
  strategy: AllocationStrategy;
  status: DistributionStatus;
  payouts: RecipientPayout[];
  createdAt: number;
  completedAt: number;
  txHash?: string;
}

export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "CONFIRMED"
  | "FAILED"
  | "RETRYABLE";

export type TransactionType =
  | "CREATE_FAMILY"
  | "ADD_MEMBER"
  | "REMOVE_MEMBER"
  | "CREATE_RULE"
  | "ACTIVATE_RULE"
  | "DEPOSIT"
  | "DISTRIBUTE"
  | "RETRY";

export interface TransactionRecord {
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  familyId?: number;
  familyName?: string;
  amount?: bigint;
  depositor?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
  explorerUrl: string;
  retryAction?: () => Promise<void>;
  distributionId?: number;
}

export interface ActivityEvent {
  id: string;
  type:
    | "FAMILY_CREATED"
    | "MEMBER_ADDED"
    | "MEMBER_REMOVED"
    | "RULE_CREATED"
    | "RULE_ACTIVATED"
    | "RULE_DEACTIVATED"
    | "DEPOSIT_CREATED"
    | "DEPOSIT_FUNDED"
    | "DISTRIBUTION_STARTED"
    | "RECIPIENT_PAID"
    | "DISTRIBUTION_COMPLETED"
    | "DISTRIBUTION_FAILED";
  familyId: number;
  familyName?: string;
  actor: string;
  recipient?: string;
  amount?: bigint;
  timestamp: number;
  txHash: string;
  details: string;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: string;
  balance: string;
  walletName: string | null;
}
