import { describe, it, expect } from "vitest";
import { registryContractService } from "../registry-contract";
import { distributionContractService } from "../distribution-contract";

describe("Soroban Contract Services", () => {
  it("builds create_family operation with valid address and name", () => {
    const owner = "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG";
    const op = registryContractService.buildCreateFamilyOp(owner, "Aalmi Global Family");
    expect(op).toBeDefined();
    expect(op.body().switch().name).toBe("invokeHostFunction");
  });

  it("builds add_member operation with valid role and recipient address", () => {
    const caller = "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG";
    const member = "GDEEOM6PWOO6RIRSMEOOKGQUEKTYBWR37DBOU6RAPDU5YPR7VNGM6EJX";
    const op = registryContractService.buildAddMemberOp(caller, 1, member, "Recipient", "Mother");
    expect(op).toBeDefined();
    expect(op.body().switch().name).toBe("invokeHostFunction");
  });

  it("builds create_rule operation with percentage allocations", () => {
    const caller = "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG";
    const op = registryContractService.buildCreateRuleOp(caller, 1, "Percentage", [
      {
        recipient: "GDEEOM6PWOO6RIRSMEOOKGQUEKTYBWR37DBOU6RAPDU5YPR7VNGM6EJX",
        shareOrAmount: 5000n,
        label: "Mother (50%)",
      },
      {
        recipient: "GDIDVDGQ7VYKML4FYUUYREX6EXWCRJ2BF7XOMDL4JS3SVODPF7TFF4L7",
        shareOrAmount: 5000n,
        label: "Sister (50%)",
      },
    ]);
    expect(op).toBeDefined();
    expect(op.body().switch().name).toBe("invokeHostFunction");
  });

  it("builds deposit_and_distribute operation with native SAC", () => {
    const sender = "GBDKL7REO324GNLVUDEKYPYHFLVE5EV7GQWSKN66AL6K5YLLIPMJD4XG";
    const op = distributionContractService.buildDepositAndDistributeOp(
      sender,
      1,
      10_000_000n
    );
    expect(op).toBeDefined();
    expect(op.body().switch().name).toBe("invokeHostFunction");
  });
});
