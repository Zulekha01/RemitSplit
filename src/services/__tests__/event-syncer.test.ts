import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventSyncerService } from "../event-syncer";
import { stellarRpcService } from "../stellar-rpc";

const contractIds = ["CC7AKOBA47NQ7FR7K27DJWX67CIJCIABDSUTULZ2ODQAUTMECBOI4JLG"];
let syncer: EventSyncerService;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  syncer = new EventSyncerService();
});

afterEach(() => {
  syncer.stopPolling();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Event polling", () => {
  it("advances the cursor even when no events match", async () => {
    const getEvents = vi.spyOn(stellarRpcService, "getContractEvents")
      .mockResolvedValue({ latestLedger: 500, events: [], cursor: "empty-page-cursor" });
    syncer.startPolling(contractIds);
    await vi.advanceTimersByTimeAsync(5000);
    expect(getEvents).toHaveBeenNthCalledWith(2, contractIds, undefined, 50, "empty-page-cursor");
  });

  it("recovers from an expired cursor on the next cycle", async () => {
    const getEvents = vi.spyOn(stellarRpcService, "getContractEvents")
      .mockResolvedValueOnce({ latestLedger: 500, events: [], cursor: "expired" })
      .mockRejectedValueOnce({ code: -32602, message: "startLedger is before oldest ledger" })
      .mockResolvedValue({ latestLedger: 600, events: [], cursor: "fresh" });
    syncer.startPolling(contractIds);
    await vi.advanceTimersByTimeAsync(10000);
    expect(getEvents).toHaveBeenNthCalledWith(3, contractIds, undefined, 50, undefined);
  });

  it("ignores an in-flight response from a stopped polling run", async () => {
    let resolveOld!: (value: { latestLedger: number; events: []; cursor: string }) => void;
    const getEvents = vi.spyOn(stellarRpcService, "getContractEvents")
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValue({ latestLedger: 600, events: [], cursor: "new-run" });
    syncer.startPolling(contractIds);
    syncer.stopPolling();
    syncer.startPolling(contractIds);
    resolveOld({ latestLedger: 500, events: [], cursor: "old-run" });
    await vi.advanceTimersByTimeAsync(5000);
    expect(getEvents).toHaveBeenCalledTimes(3);
    expect(getEvents).toHaveBeenLastCalledWith(contractIds, undefined, 50, "new-run");
  });
});
