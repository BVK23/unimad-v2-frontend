# SSE streaming investigation — full arc (Mar–Jun 2026)

This document captures what we did across many iterations to restore **incremental activity labels** during ADK `/run_sse` runs (cover letter, content gen, LinkedIn post, etc.), how we narrowed the root cause, and what to do after deploy.

---

## 1. Original problem

**Symptom:** During 15–40s agent runs, the chat showed a static line (“Working with Unibot…”) for most of the run. Activity labels (`Reading your draft…`, `Drafting your cover letter…`, tool names) appeared in **one burst at the end**, not while the agent worked.

**User expectation:** Labels should update as ADK emits tool calls and agent steps — similar to a live loading trace.

---

## 2. Pipeline (for reference)

```text
Browser (React)
  fetch POST /api/run_sse  (Accept: text/event-stream)
       ↓
Next.js App Router  src/app/api/run_sse/route.ts
       ↓
src/lib/adk/run-sse-app-handler.ts  (Node fetch → ADK, passthrough body)
       ↓
ADK Docker or host  POST /run_sse  (gemini + tools + transfers)
       ↓
connection-manager.ts  →  stream-processor.ts  →  activity labels in ChatSidebar
```

**Key files**

| Layer                     | Path                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| Browser SSE reader        | `src/features/adk-chat/streaming/connection-manager.ts`              |
| Event → label             | `src/features/adk-chat/streaming/stream-processor.ts`                |
| Activity presenter        | `src/features/adk-chat/streaming/stream-activity-presenter.ts`       |
| Client heartbeat fallback | `src/features/adk-chat/streaming/stream-activity-heartbeat.ts`       |
| Next proxy                | `src/app/api/run_sse/route.ts`, `src/lib/adk/run-sse-app-handler.ts` |
| SSE headers               | `src/lib/adk/run-sse-common.ts`                                      |
| ADK middleware            | `unimadai-adk-agent/app/sse_activity_middleware.py`                  |
| ADK server                | `unimadai-adk-agent/app/unimad_api_server.py`                        |

---

## 3. What we tried (chronological)

### Phase A — Assume ADK or Next is broken

| Action                                                                 | Result                                                                             |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `scripts/probe_run_sse.sh` curl → ADK `:8001` directly                 | **ADK streams** — events spread over seconds                                       |
| Enable `[sse-chunk-out]` on ADK, `[sse-proxy]` on Next                 | **Server-side chunks incremental** (+2s, +9s, +13s)                                |
| Migrate `/api/run_sse` Pages → App Router                              | Server proxy still incremental; **browser still burst**                            |
| `compress: false` in `next.config.ts`                                  | Already set; no browser fix alone                                                  |
| Custom `ReadableStream` pull wrapper → native `body` + `tee()` logging | Browser still burst                                                                |
| `pnpm dev:webpack` vs Turbopack                                        | Same browser behavior                                                              |
| `NEXT_PUBLIC_ADK_SSE_DIRECT` (browser → ADK, bypass Next)              | **Still ~18s TTFB** in Chrome                                                      |
| `localhost:8001` vs `127.0.0.1:8001`                                   | No change in Chrome                                                                |
| `pnpm build && pnpm start` (prod Next locally)                         | Chrome **still** ~18–34s TTFB                                                      |
| Host ADK on `:8080` instead of Docker                                  | Session 404 (different session DB); streaming test incomplete until fresh sessions |

**Early wrong theories (partially ruled out):**

- “ADK doesn’t stream” — **false** (curl + Docker logs)
- “Next dev buffers everything” — **partially true** for dev→browser, but prod Next locally didn’t fix Chrome
- “Docker Desktop buffers all streaming” — **overstated** (curl/Node to Docker streams fine)
- “`stream-processor.ts` blocks UI” — **false** when `fetch headers` ≈ total run time (parser runs after bytes arrive)

### Phase B — Instrumentation

Added timing logs:

```text
[adk-activity] session PATCH done +Xms before fetch
[adk-activity] fetch headers +Yms from fetch start
[adk-activity] browser chunk #N +Zms from fetch | +Wms from headers
```

**Smoking gun:** If `fetch headers` ≈ 15–34s but server `tee-log` shows +1.6s, +9s — the blocker is **browser receiving HTTP**, not ADK or parsing.

### Phase C — Stack Overflow / compression / AV hypotheses

Applied mitigations:

- Response: `Content-Encoding: identity`, `Cache-Control: no-cache, no-store, no-transform`
- Upstream fetch: `Accept-Encoding: identity`
- ADK middleware: strip `content-length` / `content-encoding`, anti-buffer headers
- Slow-TTFB console warning (AV / gzip / POST SSE)

Chrome local: **still burst** after these changes.

### Phase D — Safari breakthrough

**Same stack** (Docker ADK `:8001`, `pnpm dev:webpack`, `/api/run_sse`):

| Browser    | `fetch headers` | Chunks                      | Labels                                                 |
| ---------- | --------------- | --------------------------- | ------------------------------------------------------ |
| **Safari** | ~+1.6–1.8s      | +1.6s, +9s, +12s (spread)   | **Real ADK labels during run**                         |
| **Chrome** | ~+18–34s        | all in ~600ms after headers | Placeholders during wait; **real labels burst at end** |

Next terminal matched ADK on both runs:

```text
[sse-proxy] app_route tee-log #1 +1609ms
[sse-proxy] app_route tee-log #4 +9400ms
```

**Final conclusion:**

1. **The product streams correctly** — server + Safari prove it.
2. **Chrome on local loopback** buffers `fetch(POST)` + `text/event-stream` until the run completes (HTTP/1.1 localhost, dev hooks, extensions, possible AV).
3. **Client heartbeats** (3s rotation) improve Chrome **dev UX** but are **not** real SSE — Safari doesn’t need them when stream works.
4. **Production Chrome** (Vercel + Cloud Run, HTTP/2, no Cursor/React dev hooks) will **likely** behave like Safari — **must verify on staging**, not assume.

---

## 4. What we shipped in code

### unimad-app

- App Router `/api/run_sse` with native body passthrough + `tee()` diagnostics
- `src/lib/adk/client-run-sse.ts` — optional direct ADK dev bypass (not needed for normal flow)
- Anti-buffer SSE headers in `run-sse-common.ts`
- `connection-manager.ts` — TTFB / chunk timing logs; slow-TTFB warning
- `stream-activity-heartbeat.ts` — **global** fallback labels (no Chrome sniffing); real hints suppress via `markRealHint()`
- `useAdkStreamingManager.ts` — wires heartbeat during `streamInFlight`
- Next.js 16 null-safe `usePathname` / `useSearchParams` fixes for production build
- `compress: false` in `next.config.ts`

### unimadai-adk-agent

- `sse_activity_middleware.py` — header passthrough, optional chunk log / progress
- `sse_progress.py` — `Content-Encoding: identity`, anti-buffer headers
- `docs/SSE_STREAMING_INVESTIGATION.md` — pipeline + browser TTFB section

### Env (local)

```bash
# .env.local (typical Docker setup)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
ADK_BACKEND_URL=http://127.0.0.1:8001
NEXT_PUBLIC_ADK_ACTIVITY_TRACE=1   # optional timing logs
# Do NOT set NEXT_PUBLIC_ADK_SSE_DIRECT unless debugging
```

---

## 5. Google Search / production guidance (synthesis)

| Recommendation                                                    | Our take                                                        |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| Prod uses HTTP/2; local uses HTTP/1.1 — Chrome may stream in prod | **Plausible** — verify on staging                               |
| Don’t Chrome-sniff synthetic messages                             | **Agree** — we use one global heartbeat for all browsers        |
| Global heartbeat as **fallback** at 5–7s, not primary             | **Agree** — real ADK events suppress via `markRealHint()`       |
| Keep server `UNIMAD_ADK_SSE_PROGRESS` off unless staging fails    | **Agree** — avoid duplicate/flickering labels when stream works |
| Staging Chrome Network tab TTFB check                             | **Required** before more architecture work                      |
| EventSource GET + ticket only if staging Chrome still buffers     | **Agree** — last resort                                         |

---

## 6. Action items after push

### Before / right after deploy to staging

1. **Deploy** Next (Vercel) + ADK (Cloud Run) with current code (headers + heartbeats).
2. **Chrome staging test** (normal window):
   - DevTools → Network → `run_sse` → Timing
   - **TTFB &lt; ~2.5s** and response size growing over time → **prod OK; local Chrome was environment-only**
   - **TTFB ≈ full run (30s+)** → plan EventSource ticket migration
3. **Repeat one flow** in Safari on staging (sanity).
4. **One real user journey** each: cover letter improve, content gen draft, LinkedIn post improve — confirm labels during run.

### If staging Chrome streams (expected)

- [ ] No EventSource ticket work
- [ ] Keep client heartbeat at 5s as silent-gap insurance
- [ ] Keep `UNIMAD_ADK_SSE_PROGRESS=0` on ADK
- [ ] Document for team: **use Safari (or Firefox) for local streaming UX testing**; Chrome local is misleading
- [ ] Optional: turn off `NEXT_PUBLIC_ADK_ACTIVITY_TRACE` in prod

### If staging Chrome still buffers (unlikely but possible)

- [ ] Implement `POST /api/run_sse/ticket` + `GET /api/run_sse/stream?ticket=` with `EventSource`
- [ ] Or enable `UNIMAD_ADK_SSE_PROGRESS=1` on ADK at 5–7s as interim (server-injected SSE heartbeats)
- [ ] Check corporate proxy / CDN buffer settings on hosting

### Local dev (ongoing)

- Docker: `cd unimadai-adk-agent && docker compose up` → `:8001`
- Next: `pnpm dev:webpack` → `:3000`
- Stream UX testing: **Safari**
- Chrome Incognito test if wondering whether extensions cause local burst

---

## 7. Code changes aligned with Google Search agent

| Change                                                  | Status           | Action                                       |
| ------------------------------------------------------- | ---------------- | -------------------------------------------- |
| `compress: false`                                       | Done             | None                                         |
| `Content-Encoding: identity` on `/api/run_sse`          | Done             | None                                         |
| `Accept-Encoding: identity` on upstream fetch           | Done             | None                                         |
| Global client heartbeat (no UA sniffing)                | Done             | Interval **3s → 5s** (recommended)           |
| Server `UNIMAD_ADK_SSE_PROGRESS` default off            | Done             | Enable only if staging Chrome fails          |
| `_HEARTBEAT_INTERVAL_S` 5–7s if server progress enabled | Default 2.5s     | Set env / constant only if enabling progress |
| EventSource GET + ticket                                | Not started      | Only if staging TTFB bad                     |
| Chrome-only synthetic labels                            | **Do not build** | —                                            |
| Production TTFB verification                            | Process          | See §6                                       |

---

## 8. How to read logs (quick reference)

**Healthy stream (Safari or prod Chrome):**

```text
fetch headers +1500ms
browser chunk #1 +1502ms | +2ms from headers
browser chunk #4 +9400ms | +7900ms from headers
Reading your application draft… | tool=get_application_asset_draft
```

**Buffered stream (local Chrome):**

```text
fetch headers +34280ms
slow TTFB warning
browser chunk #1 +34283ms | +3ms from headers
browser chunk #30 +34891ms | +614ms from headers   ← all body in one burst
```

**Server healthy (both cases):**

```text
[sse-proxy] app_route tee-log #1 +1609ms
[sse-proxy] app_route tee-log #4 +9400ms
```

---

## 9. One-paragraph executive summary

We spent multiple iterations proving ADK and the Next.js server proxy **do** stream SSE incrementally, while the browser often showed a end-of-run burst. Instrumentation (`fetch headers` timing) showed the delay happens **before** `connection-manager` parses any data — ruling out `stream-processor.ts` as the root cause. **Safari on the same local stack streamed correctly** (~1.6s TTFB, labels during the run); **Chrome local** did not (~18–34s TTFB, burst). We attribute local Chrome behavior to **HTTP/1.1 loopback + dev tooling/extensions**, not a fundamental product bug. We added anti-buffer headers, diagnostics, and a **global 5s client heartbeat fallback** (not Chrome-specific fakes). **After deploy, one Chrome staging Network check (TTFB)** decides whether production is healthy or whether we need EventSource + ticket.

---

_Last updated: June 2026. Related: `unimadai-adk-agent/docs/SSE_STREAMING_INVESTIGATION.md` (ADK-focused)._
