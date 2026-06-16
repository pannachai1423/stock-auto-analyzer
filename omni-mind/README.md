# 🧠 Omni-Mind: The Neural Business Core

> An **AI-Driven Autonomous Business Ecosystem** — not a system of record, a system of
> *action*. Sensors observe, models predict, agents decide and execute, humans supervise
> by exception.

This is a **separate project**, intentionally isolated from the app in the repository
root. It has its own architecture, stack, and roadmap.

## 📐 Read the blueprint first

**[`docs/BLUEPRINT.md`](docs/BLUEPRINT.md)** is the full, buildable technical blueprint:
system architecture (with Mermaid diagrams), the ultimate tech stack, the cross-industry
database schema, and a 4-phase MVP roadmap.

## 🎯 The core idea in 30 seconds

```
World → event-spine (immutable truth) → forecasting / anomaly detection
                                       → neural-core agent plans an action
                                       → policy-guardrails (risk + simulate)
                                       → workflow-engine executes via api-bridge
                                       → outcome logged back → the agent gets wiser
```

Build the **event spine** and the **guard-railed decision loop** first. Every headline
feature (Predictive Intelligence, Self-Healing Workflows, Digital Twin, Autonomous
Finance) is a plug-in on top of those two foundations.

## 🚀 Start here — the first module

The one component that blocks everything else and unblocks everything else is the
**Universal Event Gateway**. A runnable, **zero-dependency** reference implementation
lives in [`services/event-spine/`](services/event-spine/):

```bash
cd services/event-spine
node src/server.js        # starts the gateway on :8787
node --test               # runs the test suite
```

> The reference impl is in plain Node.js (no install step) so you can run the decision
> loop's foundation *today*. The production target for this hot-path service is **Go**
> (see the blueprint, §2.1) — the contract it implements is identical.

## 🗺️ Roadmap at a glance

| Phase | Theme | Outcome |
| --- | --- | --- |
| **1** | The Nervous System | Events flow in, state derives itself, live dashboard. ← **building now** |
| **2** | The First Sense | Demand forecasting + anomaly detection (advisory). |
| **3** | The First Action | Agent autonomously reorders stock, guard-railed + audited. |
| **4** | The Ecosystem | Autonomous finance, staffing, Digital Twin, real integrations. |

## 📁 Layout

```
omni-mind/
├── README.md                 you are here
├── docs/
│   └── BLUEPRINT.md          the full technical blueprint
└── services/
    └── event-spine/          Module #1 — the Universal Event Gateway (runnable)
        ├── README.md
        ├── src/
        │   ├── envelope.js   universal event envelope + validation
        │   ├── store.js      append-only log, idempotency, outbox, projection
        │   └── server.js     HTTP ingestion gateway
        └── test/
            └── spine.test.js
```
