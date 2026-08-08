use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Role {
    Sender = 0,
    CoAdmin = 1,
    Recipient = 2,
}

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
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Member {
    pub address: Address,
    pub role: Role,
    pub name: String,
    pub joined_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Family {
    pub id: u32,
    pub name: String,
    pub owner: Address,
    pub active_rule_version: u32,
    pub created_at: u64,
}
