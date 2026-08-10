use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum AllocationStrategy {
    Percentage = 0,
    FixedAmount = 1,
    Waterfall = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AllocationItem {
    pub recipient: Address,
    pub share_or_amount: i128,
    pub label: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AllocationRule {
    pub id: u32,
    pub family_id: u32,
    pub version: u32,
    pub strategy: AllocationStrategy,
    pub allocations: Vec<AllocationItem>,
    pub created_by: Address,
    pub created_at: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum DistributionStatus {
    Created = 0,
    DepositPending = 1,
    Funded = 2,
    Processing = 3,
    PartiallyCompleted = 4,
    Completed = 5,
    Failed = 6,
    Retryable = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecipientPayout {
    pub recipient: Address,
    pub amount: i128,
    pub paid: bool,
    pub label: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DistributionRecord {
    pub id: u32,
    pub family_id: u32,
    pub rule_version: u32,
    pub depositor: Address,
    pub token: Address,
    pub gross_amount: i128,
    pub distributed_amount: i128,
    pub strategy: AllocationStrategy,
    pub status: DistributionStatus,
    pub payouts: Vec<RecipientPayout>,
    pub created_at: u64,
    pub completed_at: u64,
}
