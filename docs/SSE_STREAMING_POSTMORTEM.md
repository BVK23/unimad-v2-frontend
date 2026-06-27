# SSE streaming investigation — postmortem (Mar 2026)

This document summarizes ~20–40 iterations of debugging why Unibot activity labels (“Reading your draft…”, “Drafting your cover letter…”) appeared in **one burst at the end** of 15–40s ADK runs instead of incrementally during the run.

**Audience:** engineers shipping Unimad chat + ADK streaming to production.

**Related:** `unimadai-adk-agent/docs/SSE_STREAMING_INVESTIGATION.md` (layer map, curl probes, env flags).

---

## 1. Original symptom

Users (and devs) saw:

- Chat loading row stuck on “Working with Unibot…” for most of a run
- All activity labels (`get_application_asset_draft`, `cover_letter_draft_agent`, `update_post_draft`, etc.) appearing **together** in the last ~200–600ms
- Console `[adk-activity] browser chunk #1 +0ms … #11 +400ms` (early tests) or `fetch headers +18000ms` (later tests)

Expected: labels track ADK tool/author events as they happen (~2s, ~9s, ~12s apart).

---

## 2. Pipeline under test

```
Browser (fetch POST, Accept: text/event-stream)
  → Next.js /api/run_sse (App Router)
  → Node fetch → ADK POST /run_sse (Docker :8001 or host :8080)
  → Gemini + tools + transfer_to_agent
  → SSE data: lines back through the chain
  → connection-manager.ts → stream-processor.ts → activity labels in ChatSidebar
```

---

## 3. What we changed (chronological)

### 3.1 ADK agent (`unimadai-adk-agent`)

| Change                                   | Purpose                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `unimad_api_server.py` entrypoint        | Custom server + rewind + middleware                                                          |
| `sse_activity_middleware.py`             | Anti-buffer headers; optional chunk logging; optional synthetic progress                     |
| `sse_progress.py`                        | `no_buffer_response_headers()` — strip `content-length` / `content-encoding`, set `identity` |
| `scripts/probe_run_sse.sh`               | curl timing probe bypassing Next                                                             |
| `UNIMAD_ADK_SSE_PASSTHROUGH=1` (default) | Header-only middleware fast path                                                             |
| `UNIMAD_ADK_SSE_CHUNK_LOG=1` (dev)       | `[sse-chunk-out] +Nms` per ASGI body chunk                                                   |

### 3.2 Next.js app (`unimad-app`)

| Change                                                                     | Purpose                                                                                             |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Migrated `/api/run_sse` to **App Router** (`src/app/api/run_sse/route.ts`) | Replace Pages API buffering hypothesis                                                              |
| `run-sse-app-handler.ts`                                                   | Native `adkResponse.body` passthrough; `tee()` for server logs only                                 |
| `next.config.ts` `compress: false`                                         | Disable gzip on Next responses                                                                      |
| `run-sse-common.ts`                                                        | `Content-Encoding: identity`, strong `Cache-Control`, `Accept-Encoding: identity` on upstream fetch |
| `client-run-sse.ts`                                                        | Optional `NEXT_PUBLIC_ADK_SSE_DIRECT` (browser → ADK, dev only)                                     |
| `connection-manager.ts`                                                    | Diagnostics: `fetch headers +Xms`, `browser chunk +Xms from headers`                                |
| `stream-activity-heartbeat.ts` + `useAdkStreamingManager.ts`               | **Client-side** fallback labels every 3s when no real SSE hint (all browsers)                       |
| Next.js 16 null-safe fixes                                                 | `usePathname()` / `useSearchParams()` for production build                                          |

### 3.3 What we ruled out

| Hypothesis                             | How ruled out                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| ADK does not stream                    | Docker `[sse-chunk-out]` at +2s, +9s, +12s; curl to :8001 incremental                   |
| `stream-processor.ts` blocks network   | `fetch headers +18s` happens **before** any `reader.read()` — parser not involved       |
| `connection-manager.ts` blocks network | Same; chunk logs use `Date.now()` at `read()` — all reads in one window = network burst |
| Next dev only (Turbopack)              | `pnpm dev:webpack` and `pnpm start` — same Chrome TTFB ~18–34s                          |
| App Router vs Pages                    | Server `tee-log` incremental in both; Chrome still burst                                |
| `127.0.0.1` vs `localhost`             | Both tested on direct ADK — same Chrome burst                                           |
| Docker Desktop buffers **all** traffic | curl and Node proxy receive incremental chunks; **browser** does not (Chrome)           |
| Session PATCH slow                     | `session PATCH done +37–87ms` consistently                                              |

---

## 4. Diagnostic metrics (the ones that matter)

| Log line                          | Healthy (Safari local)                | Broken (Chrome local)                        |
| --------------------------------- | ------------------------------------- | -------------------------------------------- |
| `fetch headers +Xms`              | **~1.5–2s**                           | **~15–34s** (≈ full run duration)            |
| `browser chunk #1 … from headers` | +2–10ms                               | +3–6ms (body dumps right after late headers) |
| Later chunks spread               | +1.9s, +9.4s, +12.6s from fetch start | All within **+134–614ms from headers**       |
| Next `[sse-proxy] tee-log`        | +1.6s, +9.4s, +12.5s                  | Same (server streams regardless of browser)  |

**Rule:** If `fetch headers` ≈ total run time → problem is **before** parsing (HTTP/browser/proxy). If `fetch headers` is fast but labels still burst → then investigate parser/UI.

---

## 5. Breakthrough: Safari vs Chrome (same stack)

**Setup:** Docker ADK `:8001`, `pnpm dev:webpack`, `ADK_BACKEND_URL=http://127.0.0.1:8001`, no `NEXT_PUBLIC_ADK_SSE_DIRECT`.

### Safari (WebKit)

- `fetch headers +1647ms`
- Chunks: +1649ms, +1875ms, +9440ms, +12668ms
- Real labels during run: “Reading your application draft…”, “Drafting your cover letter…”, “Updating your cover letter draft…”
- LinkedIn content-gen: chunks spread +1.8s → +11.4s with matching tool/author labels

### Chrome

- `fetch headers +34280ms` (~34s)
- All chunks in ~614ms after headers
- **Heartbeats** rotated placeholders during the wait (every 3s) — **not** real ADK events
- Real labels + console chunk logs burst at the end
- `installHook.js` / React DevTools / Cursor `host-console-events.js` present in console

### Server (both browsers)

```
[sse-proxy] tee-log #1 +1609ms
[sse-proxy] tee-log #4 +9400ms
[sse-proxy] tee-log #12 +12569ms
```

ADK Docker logs match within ~5ms.

---

## 6. Final conclusion

1. **ADK streams correctly.** Tool and author events are emitted over ~10–25s with natural gaps (LLM thinking between agent steps).

2. **Next.js server proxy streams correctly.** Node receives and logs chunks incrementally from ADK.

3. **`stream-processor.ts` and `connection-manager.ts` are not the root cause** of multi-second silence when `fetch headers` is delayed until run end.

4. **Local Chrome + `fetch(POST)` + `text/event-stream` on `localhost` (HTTP/1.1)** buffers the HTTP response until the run completes (or nearly so). This is worsened by local dev tooling (Next dev, React DevTools, Cursor console hooks, possible AV/HTTPS inspection).

5. **Local Safari** processes the same `/api/run_sse` response incrementally — proving the product pipeline works.

6. **Client heartbeats** are a **fallback UX** for silent periods. They are **not** a substitute for real SSE on Chrome local. When Chrome bursts, heartbeats run during the wait and real labels appear at the end.

7. **Production Chrome** is **likely** better (HTTP/2 on Vercel + Cloud Run, no localhost loopback, no dev hooks) but **must be verified once** on staging — do not assume or panic.

8. **Do not** implement Chrome-only User-Agent sniffing or fake progress strings — real and synthetic labels would collide when streaming works.

---

## 7. Theories we held and retired

| Theory                                      | Status                                                       |
| ------------------------------------------- | ------------------------------------------------------------ |
| Turbopack buffers SSE                       | Partially true for Next→browser in dev; not root cause alone |
| Pages API must be used                      | Retired — App Router + native body passthrough               |
| Docker buffers everything                   | **Retired** — curl and Node stream; Chrome browser does not  |
| Browser POST SSE buffered locally           | **Current best model** for Chrome dev                        |
| HTTP/2 in prod fixes Chrome                 | **Plausible, unverified** — staging test required            |
| Stack Overflow: AV + compression + POST SSE | **Aligned** with evidence; Safari isolated browser layer     |

---

## 8. Action items after deploy

### 8.1 Before merge / deploy (done or in repo)

- [x] App Router `/api/run_sse` with native stream passthrough
- [x] `compress: false`, `Content-Encoding: identity`, anti-buffer headers
- [x] Server + browser timing diagnostics (`NEXT_PUBLIC_ADK_ACTIVITY_TRACE=1` in dev)
- [x] Client heartbeat fallback (global, not Chrome-specific)
- [x] Investigation docs

### 8.2 Immediately after staging deploy (required — ~5 minutes)

1. Open **staging in Chrome** (normal window).
2. DevTools → **Network** → trigger improve / content-gen run → select **`run_sse`**.
3. **Timing** tab → **Time to First Byte (TTFB)**:
   - **TTFB &lt; ~2.5s** and response size grows over time → **prod Chrome is fine**; local Chrome dev was the outlier.
   - **TTFB ≈ full run (30s+)** → hosting or enterprise proxy buffers → plan **EventSource GET + ticket** (see §9).
4. Optionally repeat in **Safari** on staging as control.
5. Confirm activity labels appear during run (not only at end).

### 8.3 Local dev workflow (until prod verified)

| Task                     | Tool                                                    |
| ------------------------ | ------------------------------------------------------- |
| Test real streaming UX   | **Safari** or Firefox                                   |
| General UI / React work  | Chrome OK                                               |
| Debug server-side stream | Next terminal `[sse-proxy] tee-log`                     |
| Debug ADK                | Docker `[sse-chunk-out]`                                |
| Chrome streaming debug   | Incognito, extensions off; compare `fetch headers +Xms` |

### 8.4 Only if staging Chrome fails TTFB

- [ ] Implement **GET `/api/run_sse/stream?ticket=…`** + **POST `/api/run_sse/ticket`** (EventSource cannot POST).
- [ ] Consider `UNIMAD_ADK_SSE_PROGRESS=1` with `_HEARTBEAT_INTERVAL_S = 5–7` on ADK for enterprise firewall cases.
- [ ] Do **not** add User-Agent conditionals.

### 8.5 Optional improvements (low priority)

- [ ] Bump client heartbeat interval 3s → **5s** (see §10).
- [ ] `/internal/sse-probe` dev page: side-by-side `fetch` TTFB display.
- [ ] Update `SSE_STREAMING_INVESTIGATION.md` Pages API references to App Router.

---

## 9. Future: EventSource ticket pattern (if prod Chrome buffers)

```
1. POST /api/run_sse/ticket
   Body: { message, userId, sessionId, adkAppName }
   Response: { ticket, expiresAt }

2. GET /api/run_sse/stream?ticket=...
   Response: text/event-stream (EventSource in browser)
```

Server stores ticket payload in Redis/memory; stream handler consumes ticket and proxies ADK. Avoids `fetch(POST)` streaming quirks in strict environments.

---

## 10. Code changes vs Google Search recommendations

Recommendations from external analysis and **what this repo already has / still needs**:

| Recommendation                                 | Status                                                 | Action                                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Do **not** Chrome-sniff synthetic messages     | ✅ Not implemented                                     | **None** — keep unified path                                                                                             |
| `compress: false` on Next                      | ✅ Done                                                | **None**                                                                                                                 |
| `Content-Encoding: identity` on SSE responses  | ✅ Done (`run-sse-common.ts`, ADK middleware)          | **None**                                                                                                                 |
| `Accept-Encoding: identity` on upstream fetch  | ✅ Done                                                | **None**                                                                                                                 |
| Global heartbeat as **fallback** (not primary) | ✅ Client heartbeats in `stream-activity-heartbeat.ts` | **Optional:** change default `intervalMs` **3000 → 5000**                                                                |
| Server ADK `UNIMAD_ADK_SSE_PROGRESS` at 5–7s   | ❌ Off by default (`_HEARTBEAT_INTERVAL_S = 2.5`)      | **None until staging fails**; then set env `UNIMAD_ADK_SSE_PROGRESS=1` and bump interval in `sse_activity_middleware.py` |
| EventSource GET + ticket                       | ❌ Not built                                           | **Only if** staging Chrome TTFB bad                                                                                      |
| Prod Chrome verification                       | N/A                                                    | **Process** — §8.2                                                                                                       |
| Remove `NEXT_PUBLIC_ADK_SSE_DIRECT` in prod    | ✅ Dev-only gate in code                               | **None** — do not set in prod env                                                                                        |

### Required code changes before ship

**None blocking** — streaming path and headers are in place. The ship gate is **staging Chrome TTFB test**, not more local Chrome fixes.

### Optional one-line change (Google-aligned)

In `src/features/adk-chat/streaming/stream-activity-heartbeat.ts`:

```typescript
const intervalMs = options.intervalMs ?? 5000; // was 3000
```

Rationale: real ADK events on Safari often arrive before 5s; heartbeats only fill LLM silent gaps or buffered connections.

---

## 11. Environment reference (local)

```bash
# unimad-app/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
ADK_BACKEND_URL=http://127.0.0.1:8001   # Docker adk-api
NEXT_PUBLIC_ADK_ACTIVITY_TRACE=1        # dev only
# Do NOT set NEXT_PUBLIC_ADK_SSE_DIRECT in prod
```

**Terminals:**

```bash
# 1 — ADK
cd unimadai-adk-agent && docker compose up

# 2 — Django (if needed)
cd unimadai-django-gcr && docker compose up

# 3 — Next
cd unimad-app && pnpm dev:webpack
```

---

## 12. One-page summary

| Question                            | Answer                                                         |
| ----------------------------------- | -------------------------------------------------------------- |
| Is ADK broken?                      | No                                                             |
| Is Next proxy broken?               | No (server-side)                                               |
| Is parser broken?                   | No (for this symptom)                                          |
| Why did Chrome local fail?          | POST SSE + HTTP/1.1 localhost + dev hooks buffer until run end |
| How did we prove the product works? | **Safari** — incremental `fetch headers` and chunks            |
| Will prod Chrome fail?              | **Unlikely** — verify staging TTFB once                        |
| What ships now?                     | Current code + staging test                                    |
| What if staging fails?              | EventSource ticket + optional server heartbeats                |

---

_Last updated: 2026-03-26. Authors: streaming investigation session (Unimad team + AI assist)._
