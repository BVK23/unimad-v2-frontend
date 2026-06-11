# ADK long-term memory — future plan

**Status:** Deferred (not in current sprint).  
**Deployment target:** Cloud Run + `adk api_server` (same as sessions / rewind).

## Goal

Give Unibot **cross-session** recall: preferences, goals, and facts extracted from past chats — without replacing our existing per-session model (events + `stateDelta` PATCH/GET for resume/portfolio drafts).

## What we have today

| Layer              | Role                                                        |
| ------------------ | ----------------------------------------------------------- |
| **ADK session**    | One thread: events, `resume_data` / `portfolio_data` drafts |
| **Next PATCH/GET** | Sync editor context into session before each send           |
| **Django**         | Persisted resumes, profiles, `UnibotAdkSession` registry    |
| **Accept flow**    | User commits ADK drafts → Django                            |

Memory adds a **fourth** layer: durable, user-scoped knowledge **across** threads.

## Recommended backend: Agent Platform Memory Bank

Per [ADK Memory docs](https://adk.dev/sessions/memory/) and [Memory Bank ADK quickstart](https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale/memory-bank/adk-quickstart):

1. Create an **Agent Runtime** on Agent Platform (Memory Bank storage).
2. On Cloud Run, extend the existing `adk api_server` command:
   ```bash
   --memory_service_uri="agentengine://<AGENT_RUNTIME_ID>"
   ```
3. In `unimadai-adk-agent` (Python):
   - Add `load_memory` or `PreloadMemoryTool` to Unibot root agent.
   - Add `after_agent_callback` → `callback_context.add_session_to_memory()` (or call on thread idle).
4. Optional Next.js trigger: `POST .../sessions/{id}/add_to_memory` when user leaves a thread or after N turns.

**Important:** Memory Bank does **not** require moving inference off Cloud Run. Only the memory _store_ uses Agent Platform.

### Alternative (no Agent Platform)

[Database Memory Service](https://adk.dev/integrations/database-memory/) — Postgres-backed keyword search on the same Cloud SQL instance as ADK sessions. Simpler ops, less “smart” extraction than Memory Bank.

## What does _not_ change

- `/api/run_sse` streaming
- Session PATCH/GET for resume/portfolio/LinkedIn context
- Django registry and Accept flows
- Sub-session improve topics (still separate ADK sessions)

## Suggested ingestion policy

| Trigger                         | When                                                |
| ------------------------------- | --------------------------------------------------- |
| **After each main-thread turn** | Too noisy; skip for v1                              |
| **Thread idle / switch away**   | Good default — ingest completed session             |
| **Explicit “Remember this”**    | Future UX chip                                      |
| **Sub-sessions**                | Ingest per sub-session when improve topic collapses |

## Agent behavior

- **PreloadMemory** at turn start: agent always sees relevant memories (higher token cost).
- **LoadMemory** tool: agent pulls memory only when needed (lower cost, may miss context).

Start with **LoadMemory** on Unibot; add Preload for power users later if recall feels weak.

## Frontend work (minimal)

1. Optional server action: `addSessionToMemoryAction(userId, sessionId)` → ADK `POST .../add_to_memory`.
2. Call on `handleSessionSwitch` (debounced) for main sessions only.
3. No change to chat bubble UI in v1.

## Privacy / product

- Memories are per `user_id` (same as ADK sessions today).
- Document in privacy policy: conversational memories stored in Google Cloud.
- Settings (future): “Clear my Unibot memory” → Memory Bank delete API.

## Rollout phases

### Phase 0 — Infra

- Agent Runtime + Memory Bank in GCP.
- Cloud Run env: `MEMORY_SERVICE_URI` wired into Dockerfile CMD.
- Staging smoke test with `load_memory` in dev UI.

### Phase 1 — Agent

- Unibot tool + callback on main sessions.
- Logging / tracing for memory search hits.

### Phase 2 — App triggers

- `add_to_memory` on session switch (Next server action).
- Metrics: ingest success rate, search latency.

### Phase 3 — UX

- Optional “Unibot remembers…” indicator.
- User-facing clear-memory control.

## Open questions (revisit before build)

1. Ingest sub-sessions automatically or only mains?
2. Memory Bank vs Database Memory for cost/compliance?
3. Overlap with Django profile fields — dedupe in agent instructions?
4. EU data residency (project region already `europe-west1`)?

## References

- [ADK Memory](https://adk.dev/sessions/memory/)
- [Agent Platform Memory Bank overview](https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale/memory-bank)
- [ADK Memory Bank quickstart](https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale/memory-bank/adk-quickstart)
- [Database Memory integration](https://adk.dev/integrations/database-memory/)
