import { afterEach, describe, expect, it, vi } from "vitest";
import { rpc } from "@stellar/stellar-sdk";
import { StellarRpcService } from "../stellar-rpc";

const contractIds = ["CC7AKOBA47NQ7FR7K27DJWX67CIJCIABDSUTULZ2ODQAUTMECBOI4JLG"];
const page = (cursor: string, ids: string[] = []): rpc.Api.GetEventsResponse => ({
  latestLedger: 500,
  cursor,
  events: ids.map((id) => ({ id } as rpc.Api.EventResponse)),
});

afterEach(() => vi.restoreAllMocks());

describe("Contract event requests", () => {
  it.each([undefined, 0, -1, NaN, Infinity, 1.5, 20])(
    "starts within retained positive ledgers for %s",
    async (startLedger) => {
      const service = new StellarRpcService();
      const server = service.getRpcServer();
      vi.spyOn(server, "getHealth").mockResolvedValue({ status: "healthy", oldestLedger: 100, latestLedger: 500 } as rpc.Api.GetHealthResponse);
      const getEvents = vi.spyOn(server, "getEvents").mockResolvedValue(page("end"));

      await service.getContractEvents(contractIds, startLedger);

      expect(getEvents).toHaveBeenCalledWith({
        filters: [{ type: "contract", contractIds }], startLedger: 100, limit: 50,
      });
    }
  );

  it.each([[250, 250], [600, 500]])("bounds explicit ledger %s to %s", async (requested, expected) => {
    const service = new StellarRpcService();
    const server = service.getRpcServer();
    vi.spyOn(server, "getHealth").mockResolvedValue({ status: "healthy", oldestLedger: 100, latestLedger: 500 } as rpc.Api.GetHealthResponse);
    const getEvents = vi.spyOn(server, "getEvents").mockResolvedValue(page("end"));
    await service.getContractEvents(contractIds, requested);
    expect(getEvents).toHaveBeenCalledWith(expect.objectContaining({ startLedger: expected }));
  });

  it("uses a positive fallback for RPC nodes without health ledger bounds", async () => {
    const service = new StellarRpcService();
    const server = service.getRpcServer();
    vi.spyOn(server, "getHealth").mockResolvedValue({ status: "healthy" });
    vi.spyOn(server, "getLatestLedger").mockResolvedValue({ sequence: 10 } as rpc.Api.GetLatestLedgerResponse);
    const getEvents = vi.spyOn(server, "getEvents").mockResolvedValue(page("end"));
    await service.getContractEvents(contractIds);
    expect(getEvents).toHaveBeenCalledWith(expect.objectContaining({ startLedger: 1 }));
  });

  it("drains full pages using only cursors, including events in the same ledger", async () => {
    const service = new StellarRpcService();
    const server = service.getRpcServer();
    const health = vi.spyOn(server, "getHealth");
    const getEvents = vi.spyOn(server, "getEvents")
      .mockResolvedValueOnce(page("page-2", ["event-1", "event-2"]))
      .mockResolvedValueOnce(page("end", ["event-3"]));

    const result = await service.getContractEvents(contractIds, 200, 2, "page-1");

    expect(health).not.toHaveBeenCalled();
    expect(result.events.map((event) => event.id)).toEqual(["event-1", "event-2", "event-3"]);
    expect(result.cursor).toBe("end");
    expect(getEvents.mock.calls.map(([request]) => request)).toEqual([
      { filters: [{ type: "contract", contractIds }], cursor: "page-1", limit: 2 },
      { filters: [{ type: "contract", contractIds }], cursor: "page-2", limit: 2 },
    ]);
  });

  it("continues through empty scan-limited pages until the original ledger tip", async () => {
    const service = new StellarRpcService();
    const server = service.getRpcServer();
    const cursorAt = (ledger: number) => `${((BigInt(ledger) << 32n) | 0xffffffffn)
      .toString().padStart(19, "0")}-4294967295`;
    const getEvents = vi.spyOn(server, "getEvents")
      .mockResolvedValueOnce(page(cursorAt(200)))
      .mockResolvedValueOnce(page(cursorAt(300), ["historical-event"]))
      .mockResolvedValueOnce({ ...page(cursorAt(500), ["recent-event"]), latestLedger: 501 });

    const result = await service.getContractEvents(contractIds, undefined, 50, cursorAt(100));

    expect(getEvents).toHaveBeenCalledTimes(3);
    expect(result.events.map((event) => event.id)).toEqual(["historical-event", "recent-event"]);
    expect(result.cursor).toBe(cursorAt(500));
  });
});
