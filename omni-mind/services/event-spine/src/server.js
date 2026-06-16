// server.js — the Universal Event Gateway (Module #1).
//
// A zero-dependency HTTP front door for the event spine. Run it today:
//   node src/server.js
//
// Endpoints:
//   POST /v1/events                 ingest one event (universal envelope)
//   GET  /v1/tenants/:id/inventory  the derived inventory projection
//   GET  /v1/tenants/:id/events     the raw event log (truth)
//   GET  /healthz                   liveness
//
// Production target is Go + gRPC + Postgres + Kafka (BLUEPRINT.md §2.1); the contract
// and semantics are identical to what you see here.

'use strict';

const http = require('node:http');
const { validateEvent } = require('./envelope');
const { EventSpine } = require('./store');

function createServer(spine = new EventSpine()) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (code, body) => {
      res.writeHead(code, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    if (req.method === 'GET' && url.pathname === '/healthz') {
      return send(200, { status: 'ok', service: 'event-spine' });
    }

    // POST /v1/events
    if (req.method === 'POST' && url.pathname === '/v1/events') {
      let raw = '';
      req.on('data', (c) => {
        raw += c;
        if (raw.length > 1_000_000) req.destroy(); // basic guard
      });
      req.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(raw || '{}');
        } catch {
          return send(400, { error: 'invalid JSON' });
        }
        const check = validateEvent(parsed);
        if (!check.ok) return send(422, { error: 'invalid event', details: check.errors });

        const result = spine.append(check.value);
        // 200 (not 201) on duplicate so retries/at-least-once delivery are safe & idempotent.
        return send(result.status === 'appended' ? 201 : 200, {
          status: result.status,
          eventId: check.value.eventId,
          seq: result.seq,
        });
      });
      return;
    }

    // GET /v1/tenants/:id/inventory  |  /v1/tenants/:id/events
    const m = url.pathname.match(/^\/v1\/tenants\/([^/]+)\/(inventory|events)$/);
    if (req.method === 'GET' && m) {
      const [, tenantId, kind] = m;
      return send(200, kind === 'inventory' ? spine.inventory(tenantId) : spine.events(tenantId));
    }

    return send(404, { error: 'not found' });
  });

  return { server, spine };
}

// Start only when run directly (so tests can import without binding a port).
if (require.main === module) {
  const port = process.env.PORT || 8787;
  const { server } = createServer();
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`event-spine listening on http://localhost:${port}`);
  });
}

module.exports = { createServer };
