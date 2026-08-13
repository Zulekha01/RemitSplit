import { stellarRpcService } from "./stellar-rpc";
import { ActivityEvent } from "@/types";
import { logger } from "@/lib/logger";

type EventCallback = (event: ActivityEvent) => void;

export class EventSyncerService {
  private subscribers: Set<EventCallback> = new Set();
  private isPolling: boolean = false;
  private timerId: NodeJS.Timeout | null = null;
  private lastLedger: number | undefined;

  subscribe(callback: EventCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  notify(event: ActivityEvent) {
    this.subscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        logger.error("EventSyncer", "Error in subscriber callback", err);
      }
    });
  }

  startPolling(contractIds: string[], intervalMs: number = 5000) {
    if (this.isPolling) return;
    this.isPolling = true;

    const poll = async () => {
      // Pause polling if tab is in the background to eliminate lag and CPU waste
      if (typeof document !== "undefined" && document.hidden) {
        if (this.isPolling) {
          this.timerId = setTimeout(poll, intervalMs);
        }
        return;
      }

      try {
        const validIds = contractIds.filter(
          (id) => id && id.startsWith("C") && id.length === 56
        );

        if (validIds.length > 0) {
          const res = await stellarRpcService.getContractEvents(
            validIds,
            this.lastLedger
          );

          if (res.events && res.events.length > 0) {
            this.lastLedger = res.latestLedger;

            for (const rawEv of res.events) {
              const decoded = this.decodeSorobanEvent(rawEv);
              if (decoded) {
                this.notify(decoded);
              }
            }
          }
        }
      } catch (err) {
        logger.debug("EventSyncer", "Polling cycle completed with note", err);
      } finally {
        if (this.isPolling) {
          this.timerId = setTimeout(poll, intervalMs);
        }
      }
    };

    poll();
  }

  stopPolling() {
    this.isPolling = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public decodeSorobanEvent(rawEvent: any): ActivityEvent | null {
    try {
      const topic0 = rawEvent.topic?.[0] ? stellarRpcService.parseScVal(rawEvent.topic[0]) : "";
      const familyId = rawEvent.topic?.[1] ? Number(stellarRpcService.parseScVal(rawEvent.topic[1])) : 1;
      const data = rawEvent.value ? stellarRpcService.parseScVal(rawEvent.value) : null;

      let type: ActivityEvent["type"] = "DEPOSIT_CREATED";
      let details = "";
      let amount: bigint | undefined;
      let actor = "";
      let recipient: string | undefined;

      const topicStr = String(topic0);

      if (topicStr.includes("fam_creat")) {
        type = "FAMILY_CREATED";
        actor = String(rawEvent.topic?.[2] ? stellarRpcService.parseScVal(rawEvent.topic[2]) : "");
        details = `Family group created: "${data || "Family"}"`;
      } else if (topicStr.includes("mbr_added")) {
        type = "MEMBER_ADDED";
        recipient = String(rawEvent.topic?.[2] ? stellarRpcService.parseScVal(rawEvent.topic[2]) : "");
        details = `New family member joined`;
      } else if (topicStr.includes("rul_creat")) {
        type = "RULE_CREATED";
        details = `New programmable split rule version created`;
      } else if (topicStr.includes("rul_act")) {
        type = "RULE_ACTIVATED";
        details = `Split rule activated`;
      } else if (topicStr.includes("dep_creat") || topicStr.includes("dep_fund")) {
        type = topicStr.includes("dep_fund") ? "DEPOSIT_FUNDED" : "DEPOSIT_CREATED";
        details = `Remittance deposit received into escrow`;
        if (typeof data === "bigint" || typeof data === "number") {
          amount = BigInt(data);
        }
      } else if (topicStr.includes("rec_paid")) {
        type = "RECIPIENT_PAID";
        recipient = String(rawEvent.topic?.[2] ? stellarRpcService.parseScVal(rawEvent.topic[2]) : "");
        if (typeof data === "bigint" || typeof data === "number") {
          amount = BigInt(data);
        }
        details = `Automated payout executed to recipient`;
      } else if (topicStr.includes("dist_comp")) {
        type = "DISTRIBUTION_COMPLETED";
        if (typeof data === "bigint" || typeof data === "number") {
          amount = BigInt(data);
        }
        details = `Remittance split distribution completed across all recipients`;
      }

      const eventId = rawEvent.id || `${rawEvent.txHash || Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const timestamp = rawEvent.ledgerClosedAt
        ? new Date(rawEvent.ledgerClosedAt).getTime()
        : Date.now();

      return {
        id: eventId,
        type,
        familyId,
        actor: actor || "Sender",
        recipient,
        amount,
        timestamp,
        txHash: rawEvent.txHash || "",
        details,
      };
    } catch (err) {
      logger.debug("EventSyncer", "Could not decode raw event", err);
      return null;
    }
  }
}

export const eventSyncerService = new EventSyncerService();
