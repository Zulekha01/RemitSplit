import { describe, it, expect } from "vitest";
import {
  xlmToStroops,
  stroopsToXlm,
  bpsToPercentage,
  truncateAddress,
  truncateHash,
} from "../formatters";

describe("RemitSplit Financial Formatters", () => {
  it("converts XLM strings to stroops BigInt accurately", () => {
    expect(xlmToStroops("1")).toBe(10_000_000n);
    expect(xlmToStroops("100.5")).toBe(1_005_000_000n);
    expect(xlmToStroops("0.0000001")).toBe(1n);
    expect(xlmToStroops("0")).toBe(0n);
  });

  it("converts stroops to human-readable XLM strings", () => {
    expect(stroopsToXlm(10_000_000n)).toBe("1");
    expect(stroopsToXlm(1_005_000_000n)).toBe("100.5");
    expect(stroopsToXlm(1n)).toBe("0.0000001");
    expect(stroopsToXlm(0n)).toBe("0");
  });

  it("converts basis points to percentage display", () => {
    expect(bpsToPercentage(5000)).toBe("50.00%");
    expect(bpsToPercentage(3333)).toBe("33.33%");
    expect(bpsToPercentage(10000)).toBe("100.00%");
    expect(bpsToPercentage(50)).toBe("0.50%");
  });

  it("truncates Stellar public keys and hashes cleanly", () => {
    const address = "GDG64ZSK6S6322AXXV53M3QZ6WCEY3I3J644W7RMYAOWB74L4R3Z3E6S";
    expect(truncateAddress(address)).toBe("GDG6...3E6S");

    const hash = "6e288924bcf8452efadfc340d86eef927d35368a1fefc3e8006e8fb297e68dbb";
    expect(truncateHash(hash)).toBe("6e2889...e68dbb");
  });
});
