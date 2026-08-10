use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    DistributionNotFound = 5,
    DistributionAlreadyCompleted = 6,
    InvalidDistributionState = 7,
    RuleNotFound = 8,
    NoActiveRule = 9,
    SenderNotFamilyOwner = 10,
    AllocationCalculationFailed = 11,
    FixedAmountMismatch = 12,
    TokenTransferFailed = 13,
    NoRegistryConfigured = 14,
    DoubleExecutionAttempt = 15,
    EmptyAllocations = 16,
    DistributionNotRetryable = 17,
}
