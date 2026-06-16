// store.js — the append-only event log, idempotency, transactional outbox, and a
// derived projection. In-memory here for a zero-dependency reference; the production
// target is Postgres (event_log) + Kafka, with the SAME semantics. (See BLUEPRINT.md §0, §3.)

'use strict';

/**
 * The transactional-outbox pattern is the classic correctness trap in event-driven
 * systems: you must append the event AND publish it to the bus atomically, or you
 * get lost/duplicated events. We model that boundary explicitly here so the design is
 * correct from line one — in Postgres this is a single transaction writing event_log +
 * an outbox row that a relay then ships to Kafka.
 */
class EventSpine {
  constructor() {
    /** @type {Array<object>} the immutable, ordered log (source of truth) */
    this._log = [];
    /** @type {Set<string>} seen eventIds, for idempotency */
    this._seen = new Set();
    /** @type {Array<object>} outbox: events appended but not yet published */
    this._outbox = [];
    /** @type {Map<string, Map<string, object>>} projection: tenantId -> streamId -> inventory */
    this._inventory = new Map();
    this._seq = 0;
  }

  /**
   * Atomically: enforce idempotency, append to the log, enqueue to the outbox,
   * and advance projections. Returns whether this was a fresh append or a duplicate.
   *
   * @param {import('./envelope').Event} ev  a validated event
   */
  append(ev) {
    if (this._seen.has(ev.eventId)) {
      return { status: 'duplicate', seq: null };
    }
    const seq = ++this._seq;
    const record = { seq, recordedAt: new Date().toISOString(), ...ev };

    // --- begin "transaction" (atomic in Postgres; synchronous here) ---
    this._log.push(record);
    this._seen.add(ev.eventId);
    this._outbox.push(record); // would be a Kafka publish via outbox relay
    this._project(record); // read-model advances in lockstep with the log
    // --- end "transaction" ---

    return { status: 'appended', seq };
  }

  /**
   * Drive the inventory read model from events. Projections are pure functions of the
   * log — drop this map and replay _log to rebuild it exactly. That replayability is
   * what makes the system self-healing.
   */
  _project(rec) {
    const t = this._inventory.get(rec.tenantId) ?? new Map();
    this._inventory.set(rec.tenantId, t);
    const cur = t.get(rec.streamId) ?? { streamId: rec.streamId, onHand: 0, throughSeq: 0 };

    switch (rec.eventType) {
      case 'StockReceived':
        cur.onHand += Number(rec.payload.quantity ?? 0);
        break;
      case 'SaleOccurred':
        cur.onHand -= Number(rec.payload.quantity ?? 0);
        break;
      case 'StockAdjusted':
        cur.onHand = Number(rec.payload.onHand ?? cur.onHand);
        break;
      // Unknown event types are ignored by THIS projection (another projection may care).
    }
    cur.throughSeq = rec.seq;
    t.set(rec.streamId, cur);
  }

  /** Drain published events from the outbox (simulates the Kafka relay). */
  drainOutbox() {
    const batch = this._outbox.splice(0);
    return batch;
  }

  /** Current inventory projection for a tenant. */
  inventory(tenantId) {
    return [...(this._inventory.get(tenantId)?.values() ?? [])];
  }

  /** Full log for a tenant (read model / debugging / replay source). */
  events(tenantId) {
    return this._log.filter((e) => e.tenantId === tenantId);
  }

  /** Rebuild ALL projections from scratch by replaying the log. Proves self-healing. */
  rebuildProjections() {
    this._inventory = new Map();
    for (const rec of this._log) this._project(rec);
  }
}

module.exports = { EventSpine };
