// spine.test.js — runs with the built-in Node test runner, no install needed:
//   node --test

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { validateEvent } = require('../src/envelope');
const { EventSpine } = require('../src/store');

const TENANT = '11111111-1111-1111-1111-111111111111';

function ev(over = {}) {
  return {
    eventId: over.eventId ?? '22222222-2222-2222-2222-222222222222',
    tenantId: TENANT,
    streamId: 'product:cocoa',
    eventType: 'StockReceived',
    payload: { quantity: 100 },
    occurredAt: '2026-06-16T10:00:00.000Z',
    actor: 'connector:pos',
    ...over,
  };
}

test('validateEvent accepts a well-formed envelope', () => {
  const r = validateEvent(ev());
  assert.equal(r.ok, true);
  assert.equal(r.value.schemaVersion, 1); // defaulted
});

test('validateEvent rejects bad tenant/actor and reports all errors', () => {
  const r = validateEvent(ev({ tenantId: 'nope', actor: 'robot' }));
  assert.equal(r.ok, false);
  assert.ok(r.errors.length >= 2);
});

test('append is idempotent — same eventId is a no-op', () => {
  const spine = new EventSpine();
  assert.equal(spine.append(validateEvent(ev()).value).status, 'appended');
  assert.equal(spine.append(validateEvent(ev()).value).status, 'duplicate');
  assert.equal(spine.events(TENANT).length, 1);
});

test('inventory projection derives from the event log', () => {
  const spine = new EventSpine();
  spine.append(validateEvent(ev({ eventId: '00000000-0000-0000-0000-0000000000a1', eventType: 'StockReceived', payload: { quantity: 100 } })).value);
  spine.append(validateEvent(ev({ eventId: '00000000-0000-0000-0000-0000000000a2', eventType: 'SaleOccurred', payload: { quantity: 30 } })).value);
  const inv = spine.inventory(TENANT).find((i) => i.streamId === 'product:cocoa');
  assert.equal(inv.onHand, 70);
});

test('projections are rebuildable from the log (self-healing)', () => {
  const spine = new EventSpine();
  spine.append(validateEvent(ev({ eventId: '00000000-0000-0000-0000-0000000000b1', payload: { quantity: 50 } })).value);
  spine.append(validateEvent(ev({ eventId: '00000000-0000-0000-0000-0000000000b2', eventType: 'SaleOccurred', payload: { quantity: 20 } })).value);
  const before = spine.inventory(TENANT)[0].onHand;
  spine._inventory = new Map(); // simulate corrupted/lost read model
  spine.rebuildProjections(); // replay the immutable log
  assert.equal(spine.inventory(TENANT)[0].onHand, before);
});

test('tenant isolation — one tenant never sees another’s events', () => {
  const spine = new EventSpine();
  const other = '99999999-9999-9999-9999-999999999999';
  spine.append(validateEvent(ev()).value);
  spine.append(validateEvent(ev({ eventId: '00000000-0000-0000-0000-0000000000c1', tenantId: other })).value);
  assert.equal(spine.events(TENANT).length, 1);
  assert.equal(spine.events(other).length, 1);
});

test('outbox captures every appended event exactly once', () => {
  const spine = new EventSpine();
  spine.append(validateEvent(ev()).value);
  spine.append(validateEvent(ev()).value); // duplicate, must NOT enter outbox
  assert.equal(spine.drainOutbox().length, 1);
  assert.equal(spine.drainOutbox().length, 0); // drained
});
