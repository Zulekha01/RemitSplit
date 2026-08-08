use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    FamilyNotFound = 3,
    FamilyAlreadyExists = 4,
    Unauthorized = 5,
    MemberNotFound = 6,
    MemberAlreadyExists = 7,
    InvalidRole = 8,
    RuleNotFound = 9,
    InvalidAllocation = 10,
    DuplicateRecipient = 11,
    InvalidStrategy = 12,
    NoActiveRule = 13,
    CannotRemoveOwner = 14,
    EmptyAllocations = 15,
    InvalidPercentageTotal = 16,
    RecipientNotFamilyMember = 17,
}
