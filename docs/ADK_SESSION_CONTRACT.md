# ADK session contract (frontend ↔ ADK ↔ Django)

All agents and features **must** follow this contract. Do not parse draft bodies from chat SSE text when a mutating session tool exists.

## Flow per user turn

1. **PATCH** (before `POST /api/run_sse`)  
   Push the current UI snapshot into ADK session state via `syncSessionStateAction`:
   - Editor data (`resume_data`, `portfolio_data`, `content_gen_data`, `application_asset_data`, `linkedin_data`, …)
   - `django_username` (so ADK tools can call Django HTTP APIs)
   - Sub-thread hints (`content_gen_thread_mode`, `resume_improve_section`, …) — **not** `sub_agent_target`

2. **SSE stream**  
   Frontend maps `author`, `functionCall`, `functionResponse`, and `actions.transferToAgent` to loading labels (`stream-activity.ts`).  
   Agents must **not** paste full draft bodies in chat; use mutating tools only.

3. **GET on mutating tool `functionResponse` only**  
   When a mutating tool completes, debounce (~220ms) then `pullSessionStateAction` and apply **only** the session keys that tool owns (see `session-mutating-tools.ts`).  
   Do **not** GET the full session after every stream unless hydrating (mount, rewind, explicit refresh).

4. **Review / unsaved**  
   Apply pulled values to Zustand/React Query and open the feature review card (diff highlights).  
   Do **not** autosave to Django until the user accepts, continues editing, or manually edits (existing per-feature rules).

5. **Django HTTP tools**  
   ADK reads extra data (profile, publish, job application create, …) via normal tools — separate from PATCH/GET session sync.

## Session keys (canonical)

| Mutating tool(s)                             | Session state (read `body` from nested row when present)       |
| -------------------------------------------- | -------------------------------------------------------------- |
| `update_summary`, resume section mutators    | `resume_data` + `current_resume`                               |
| Portfolio mutators                           | `portfolio_data` + `current_portfolio`                         |
| `update_headline`, `update_about`, …         | `linkedin_data`                                                |
| `update_post_draft`, `set_content_gen_topic` | `content_gen_data[active].body` (+ topic/funnel/mood/asset_id) |
| `update_application_asset_draft`             | `application_asset_data[active].body` (+ role/company/type)    |

Legacy `*_draft_preview` top-level keys are deprecated; prefer nested `*_data` maps.

## Sub-session ADK apps

Sub-threads use a **dedicated ADK runtime app** per graph entry (`resume_summary`, `linkedin_post`, …) under `apps/`. Frontend maps `feature` + `section` → `appName`. See `unimadai-adk-agent/docs/STRUCTURE.md`.  
The app root is the feature coordinator (or draft pipeline), not Unibot.

Do **not** PATCH `sub_agent_target` on main `app` to force leaf transfers.

## Studio generate

Studio “Generate draft” opens a **chat sub-thread** (`APPLICATION_ASSET_EVENTS.openDraft` / `CONTENT_GEN_EVENTS.openDraft`), not headless SSE or one-shot HTTP.  
Draft lands in session via mutating tools; frontend GETs after `functionResponse`.

## Portfolio note

Portfolio mutators update `portfolio_data` for the active portfolio id. The frontend pulls the whole portfolio object for that id after any portfolio mutator (block-level tools still identify the block in tool args; session stores the updated `portfolio_data` map).

## PATCH context sources (per feature)

| Feature                                                 | UI source for PATCH                                                                                                                                                                                 | Session keys                                          |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Resume                                                  | Zustand `useResumeStore` + React Query (`resumeById`, list cache). `?id=` is read from Next `searchParams` **and** `window.location` because the editor updates the URL via `history.replaceState`. | `current_resume`, `resume_data`                       |
| Portfolio                                               | Zustand + React Query `portfolioQueryKey`                                                                                                                                                           | `current_portfolio`, `portfolio_data`                 |
| LinkedIn                                                | React Query `linkedinAnalysisQueryKey`                                                                                                                                                              | `linkedin_data`                                       |
| Content Gen (Studio linkedin-post)                      | Zustand `useContentGenStudioStore`                                                                                                                                                                  | `content_gen_data`, `current_content_gen`             |
| Application assets (cover letter, cold email, referral) | Zustand `useApplicationAssetStudioStore`                                                                                                                                                            | `application_asset_data`, `current_application_asset` |

Resume is the only feature that keeps a working copy in Zustand until the user saves to Django via React Query. Other features PATCH from their studio store or query cache directly.

Sub-threads use `getStateDeltaForScope` with the registry `contentKey` (e.g. `resume:<id>`). Main chat uses `getStateDeltaForCurrentRoute` from the active pathname.

## Three-layer state model (Zustand + ADK session + React Query)

| Layer                       | Role                                 | Source of truth for                                                    |
| --------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| **React Query**             | Persisted backend data (Django APIs) | Saved assets: contentgen posts, resumes, portfolio, application assets |
| **Zustand (studio stores)** | Live UI editing state                | What the user sees and types right now in Studio/editors               |
| **ADK session**             | Conversation + proposed drafts       | Unibot chat history, mutating-tool drafts before Accept, review cards  |

### Sync rules

1. **In sync** — User edits in Studio, autosave runs, React Query cache matches Zustand → no Accept/Decline review card.
2. **Out of sync** — ADK proposes a change via mutating tool → review card (Accept/Decline) until user accepts (PATCH session + persist to Django) or declines.
3. **During ADK work** — Session may be ahead of DB; Zustand shows preview via `draftReady` / `draftPreview` events until Accept or autosave catches up.
4. **After publish/schedule** — When persisted draft matches the proposed review draft, dismiss Accept/Decline (`sync-content-gen-review-with-persisted.ts`).

### Route changes (Unibot UI)

- `AdkChatProvider` / `ChatSidebar` do **not** remount on `/uniboard/*` navigation.
- `useSyncUnibotUiToRoute` expands the sub-thread topic whose scope matches the current route (for “Go to Post” context).
- Session list/titles come from the initial registry pull; no ADK refetch on route change. PATCH runs **before the next user message**, not on every navigation.
- Review stores are per-feature (content gen, resume, portfolio, …); cards stay tied to assistant message ids until accepted, declined, or auto-dismissed when synced.

## Synthetic SSE progress

`unimadStreamActivity` progress events from ADK middleware (`sse_activity_middleware.py`) are **off by default** (`UNIMAD_ADK_SSE_PROGRESS=0`). Loading labels should come from real SSE (`functionCall`, `transferToAgent`, `author`). While PATCH runs, the frontend shows `Waking up Unibot…` via `isSyncingContext`.

## Intermediate chat narration (ReAct parking)

Mutating-tool turns often stream interim prose before apply tools. The frontend **parks** that text into `intermediateNarration` (collapsible, lighter UI) and keeps the post-mutation status as the final `text` bubble. Classification is by **mutating tool call/response**, not by Unibot vs sub-agent author.

Engineering write-up: [19 — Intermediate chat narration](https://app.clickup.com/90161632295/v/dc/2kz0un17-76/2kz0un17-6216) (under [ADK Master Index](https://app.clickup.com/90161632295/v/dc/2kz0un17-76/2kz0un17-4276)).

## Code map

- PATCH before send: `useAdkStreamingManager.patchSessionContextBeforeSend`
- Mutating tool registry: `src/features/adk-chat/session-mutating-tools.ts`
- GET + store apply: `src/features/adk-chat/apply-mutating-tool-session-pull.ts`
- Loading labels: `src/features/adk-chat/streaming/stream-activity.ts`
- Intermediate narration park/UI: `streaming/stream-processor.ts`, `components/chat/IntermediateNarrationToggle.tsx`
- Review sync / dismiss: `src/features/adk-chat/sync-content-gen-review-with-persisted.ts`
- Route UI sync: `src/features/adk-chat/hooks/useSyncUnibotUiToRoute.ts`
