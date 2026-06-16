// envelope.js — the Universal Event Envelope.
//
// This is the ONE stable contract in Omni-Mind. Every industry, every connector,
// every agent emits events in this shape. Industry-specific data lives in `payload`;
// the envelope itself never changes. (See BLUEPRINT.md §3.2.)

'use strict';

/**
 * @typedef {Object} Event
 * @property {string} eventId       Idempotency key (UUID). Re-sending the same id is a no-op.
 * @property {string} tenantId      Tenant isolation boundary (UUID).
 * @property {string} streamId      The aggregate this event belongs to (e.g. a product id).
 * @property {string} eventType     e.g. 'SaleOccurred', 'StockReceived', 'WeatherShifted'.
 * @property {number} schemaVersion Payload schema version (default 1).
 * @property {object} payload       The fact, industry-shaped.
 * @property {string} occurredAt    ISO-8601: when it happened in the world.
 * @property {string} actor         'human:<id>' | 'agent:<name>' | 'connector:<name>'.
 * @property {string} [causationId] The event that caused this one.
 * @property {string} [correlationId] Ties a whole workflow together.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTOR_RE = /^(human|agent|connector|system):.+/;

/**
 * Validate an inbound event against the universal envelope contract.
 * Autonomy acts on this data, so validation is strict and explicit — a malformed
 * fact must never enter the immutable log.
 *
 * @param {any} ev
 * @returns {{ ok: true, value: Event } | { ok: false, errors: string[] }}
 */
function validateEvent(ev) {
  const errors = [];
  const str = (k) => typeof ev?.[k] === 'string' && ev[k].length > 0;

  if (!ev || typeof ev !== 'object') return { ok: false, errors: ['body must be an object'] };

  if (!str('eventId') || !UUID_RE.test(ev.eventId)) errors.push('eventId must be a UUID');
  if (!str('tenantId') || !UUID_RE.test(ev.tenantId)) errors.push('tenantId must be a UUID');
  if (!str('streamId')) errors.push('streamId is required');
  if (!str('eventType')) errors.push('eventType is required');
  if (ev.payload == null || typeof ev.payload !== 'object') errors.push('payload must be an object');
  if (!str('occurredAt') || Number.isNaN(Date.parse(ev.occurredAt)))
    errors.push('occurredAt must be an ISO-8601 timestamp');
  if (!str('actor') || !ACTOR_RE.test(ev.actor))
    errors.push("actor must look like 'human:<id>' | 'agent:<name>' | 'connector:<name>'");

  if (ev.schemaVersion != null && !Number.isInteger(ev.schemaVersion))
    errors.push('schemaVersion must be an integer');

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      eventId: ev.eventId,
      tenantId: ev.tenantId,
      streamId: ev.streamId,
      eventType: ev.eventType,
      schemaVersion: ev.schemaVersion ?? 1,
      payload: ev.payload,
      occurredAt: new Date(ev.occurredAt).toISOString(),
      actor: ev.actor,
      causationId: ev.causationId ?? null,
      correlationId: ev.correlationId ?? null,
    },
  };
}

module.exports = { validateEvent, UUID_RE };
