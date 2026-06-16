# event-spine — the Universal Event Gateway (Omni-Mind Module #1)

The first module to build. Everything else in Omni-Mind consumes the event log this
service owns; nothing can be built or tested without it. See
[`../../docs/BLUEPRINT.md`](../../docs/BLUEPRINT.md) §4 for why this is the foundation.

## Run it (zero dependencies — needs only Node ≥ 18)

```bash
node src/server.js        # gateway on http://localhost:8787
node --test               # run the test suite
```

## What it does (v0 contract)

1. **Universal envelope** — accepts any industry's event in one stable shape (`src/envelope.js`).
2. **Strict validation** — a malformed fact never enters the immutable log.
3. **Idempotency** — re-sending the same `eventId` is a safe no-op (at-least-once delivery friendly).
4. **Append-only log** — the source of truth (`src/store.js`).
5. **Transactional outbox** — append + publish modeled as one atomic step (the classic
   event-driven correctness trap, solved from day one).
6. **Derived projection** — inventory is computed *from* events and is fully rebuildable
   by replay → this is the mechanism behind self-healing state.

## Try it

```bash
# ingest a stock receipt
curl -s localhost:8787/v1/events -X POST -H 'content-type: application/json' -d '{
  "eventId":"22222222-2222-2222-2222-222222222222",
  "tenantId":"11111111-1111-1111-1111-111111111111",
  "streamId":"product:cocoa","eventType":"StockReceived",
  "payload":{"quantity":100},"occurredAt":"2026-06-16T10:00:00Z","actor":"connector:pos"
}'

# see the derived inventory projection
curl -s localhost:8787/v1/tenants/11111111-1111-1111-1111-111111111111/inventory
```

## From reference → production

| Reference (here) | Production target (BLUEPRINT §2) |
| --- | --- |
| Node.js + `node:http` | **Go** + gRPC/HTTP |
| In-memory log | **Postgres** `event_log` (append-only) |
| In-memory outbox | Postgres outbox row + **Kafka** relay |
| In-memory projection | `projection_inventory` table, replay-rebuildable |
| Map-based isolation | Postgres **row-level security** per tenant |

The contract and semantics do not change across that move — only the substrate does.
