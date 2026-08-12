import { describe, it, expect } from "vitest";

describe("Rule Builder Allocation Math Validation", () => {
  it("validates that percentage shares sum to exactly 100.00% (10,000 bps)", () => {
    const validItems = [
      { amountStr: "50", bps: 5000n },
      { amountStr: "30", bps: 3000n },
      { amountStr: "20", bps: 2000n },
    ];
    const totalBps = validItems.reduce((acc, it) => acc + it.bps, 0n);
    expect(totalBps).toBe(10000n);

    const invalidItems = [
      { amountStr: "50", bps: 5000n },
      { amountStr: "40", bps: 4000n },
    ];
    const invalidTotal = invalidItems.reduce((acc, it) => acc + it.bps, 0n);
    expect(invalidTotal).not.toBe(10000n);
  });

  it("calculates multi-recipient stroops splits deterministically without dust loss", () => {
    const grossStroops = 1000_0000000n; // 1,000 XLM
    const shares = [5000n, 3000n, 2000n]; // 50%, 30%, 20%

    let allocatedSoFar = 0n;
    const payouts = shares.map((share, idx) => {
      if (idx === shares.length - 1) {
        return grossStroops - allocatedSoFar;
      }
      const amt = (grossStroops * share) / 10000n;
      allocatedSoFar += amt;
      return amt;
    });

    expect(payouts).toEqual([500_0000000n, 300_0000000n, 200_0000000n]);
    expect(payouts.reduce((a, b) => a + b, 0n)).toBe(grossStroops);
  });

  it("handles odd division remainder absorption", () => {
    const grossStroops = 100_0000000n; // 100 XLM
    const shares = [3333n, 3333n, 3334n];

    let allocatedSoFar = 0n;
    const payouts = shares.map((share, idx) => {
      if (idx === shares.length - 1) {
        return grossStroops - allocatedSoFar;
      }
      const amt = (grossStroops * share) / 10000n;
      allocatedSoFar += amt;
      return amt;
    });

    const sum = payouts.reduce((a, b) => a + b, 0n);
    expect(sum).toBe(grossStroops);
  });
});
