/**
 * RemitSplit Financial and Stellar Data Formatters
 */

export const STROOPS_PER_XLM = 10_000_000n;

/**
 * Convert human-readable XLM decimal amount string/number to stroops (BigInt).
 * Example: "100.5" -> 1005000000n
 */
export function xlmToStroops(xlmAmount: string | number): bigint {
  const num = typeof xlmAmount === "number" ? xlmAmount.toString() : xlmAmount.trim();
  if (!num || isNaN(Number(num))) return 0n;

  const parts = num.split(".");
  const whole = BigInt(parts[0] || "0") * STROOPS_PER_XLM;
  if (!parts[1]) return whole;

  const fractionStr = parts[1].slice(0, 7).padEnd(7, "0");
  const fraction = BigInt(fractionStr);
  return whole + fraction;
}

/**
 * Convert stroops BigInt or integer string to formatted XLM string.
 * Example: 1005000000n -> "100.5"
 */
export function stroopsToXlm(stroops: bigint | string | number): string {
  const val = typeof stroops === "bigint" ? stroops : BigInt(stroops || 0);
  const isNegative = val < 0n;
  const absVal = isNegative ? -val : val;

  const whole = absVal / STROOPS_PER_XLM;
  const remainder = absVal % STROOPS_PER_XLM;

  if (remainder === 0n) {
    return `${isNegative ? "-" : ""}${whole.toString()}`;
  }

  const remainderStr = remainder.toString().padStart(7, "0").replace(/0+$/, "");
  return `${isNegative ? "-" : ""}${whole.toString()}.${remainderStr}`;
}

/**
 * Format basis points to percentage display.
 * Example: 5000 -> "50.00%"
 */
export function bpsToPercentage(bps: number | bigint): string {
  const val = Number(bps);
  return `${(val / 100).toFixed(2)}%`;
}

/**
 * Truncate a Stellar public key or contract address for compact UI display.
 * Example: "GAB5...3XYZ"
 */
export function truncateAddress(address: string, front: number = 4, back: number = 4): string {
  if (!address) return "";
  if (address.length <= front + back + 3) return address;
  return `${address.slice(0, front)}...${address.slice(-back)}`;
}

/**
 * Truncate a transaction hash.
 */
export function truncateHash(hash: string): string {
  return truncateAddress(hash, 6, 6);
}

/**
 * Format timestamp (seconds or milliseconds) to readable date/time.
 */
export function formatTimestamp(timestamp: number | string | Date): string {
  if (!timestamp) return "-";
  const date = typeof timestamp === "object" ? timestamp : new Date(
    typeof timestamp === "string" && timestamp.length === 10
      ? Number(timestamp) * 1000
      : typeof timestamp === "number" && timestamp < 10000000000
      ? timestamp * 1000
      : Number(timestamp)
  );

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Build StellarExpert explorer link for an address, contract, or transaction.
 */
export function getExplorerUrl(
  type: "account" | "contract" | "tx" | "operation",
  value: string,
  network: string = "testnet"
): string {
  const base = network === "public" || network === "mainnet"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

  return `${base}/${type}/${value}`;
}
