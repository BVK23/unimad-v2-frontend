# Code guidelines (Unimad V2)

Short reference for humans and AI agents. **Enforcement is gradual** — apply these rules to new code and when touching existing files; full-repo migration is not required immediately.

For where files live, see [STRUCTURE.md](../STRUCTURE.md) (current) and [FOLDER_STRUCTURE_V2.md](./FOLDER_STRUCTURE_V2.md) (target).

---

## Core principles

1. **Colocation** — Keep UI, hooks, and logic for a feature together.
2. **Separation of concerns** — UI renders; hooks coordinate; server actions orchestrate; services implement business logic.
3. **Minimal side effects** — Prefer derived state, event handlers, and framework primitives over `useEffect`.
4. **Small diffs** — Match existing patterns in the file you edit.

---

## `useEffect` policy

`useEffect` is for **synchronizing with systems outside React** (DOM APIs, subscriptions, timers, third-party widgets). It is not a general-purpose “when X changes, do Y” tool.

### Prefer instead

| Need                                 | Prefer                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| State derived from props/other state | Compute inline or `useMemo`                                                                                   |
| Run logic on user action             | Event handler (`onClick`, `onSubmit`, …)                                                                      |
| Fetch on navigation / mount          | Server Components, server actions, React Query (`useQuery` with a stable key)                                 |
| Sync UI to URL                       | `useSearchParams` + render from params; `history.replaceState` when you must avoid Next.js scroll restoration |
| Subscribe to external store          | `useSyncExternalStore` or the store’s hook (e.g. Zustand)                                                     |
| Layout measurement after paint       | `useLayoutEffect` only when DOM measurement is required (menus, tooltips, panels)                             |

### When `useEffect` is appropriate

- Subscribing to `window` / `document` events (resize, scroll, `visibilitychange`)
- Cleaning up timers, intervals, or abort controllers started in handlers
- Integrating non-React libraries that require imperative setup/teardown
- One-off DOM work that cannot run in an event handler (rare)

### Anti-patterns

```tsx
// ❌ Syncing state that can be derived
useEffect(() => {
  setFullName(`${first} ${last}`);
}, [first, last]);

// ✅ Derive during render
const fullName = `${first} ${last}`;
```

```tsx
// ❌ Fetch on mount in a client component when RSC/React Query fits
useEffect(() => {
  fetchData().then(setData);
}, []);

// ✅ Server Component data fetch, or useQuery in a thin client wrapper
```

```tsx
// ❌ Chained effects (“effect soup”)
useEffect(() => {
  setA(x);
}, [x]);
useEffect(() => {
  setB(a);
}, [a]);

// ✅ Single derived value or one handler that sets related state together
```

### Overlay / menu dismiss

Closing a portaled menu on outside click:

- Use **`onPointerDown`** on the backdrop with **`preventDefault()`** so the release does not fire a `click` on the element underneath.
- Give the overlay a **real `zIndex`** (inline `style` if Tailwind arbitrary classes are not safelisted).
- While a card menu is open, set **`pointer-events-none`** on the card and **`pointer-events-auto`** on the menu trigger/actions only.

---

## React & Next.js

- **Server first** — Default to Server Components; add `"use client"` only for interactivity.
- **Server actions** — Live in `src/features/<feature>/server-actions/` (current) or `features/<feature>/actions.ts` (target). Actions orchestrate; they should not contain heavy business logic inline.
- **No DB/API in components** — Components call hooks or actions, not raw fetch to internal APIs from deep UI trees.
- **URL state** — Prefer the URL as source of truth for shareable view state (`?id=`, tabs). Use `{ scroll: false }` or `history.replaceState` when navigation must not reset scroll on a nested scroll container (e.g. Uniboard `<main>`).

---

## TypeScript

- Prefer explicit types on public feature boundaries (actions, hooks return values, shared `types/`).
- Avoid `any`; use `unknown` + narrowing at system boundaries.

---

## Styling

- Use design tokens / Tailwind classes from the design system.
- For **critical z-index** (modals, menus, overlays), prefer **inline `style={{ zIndex }}`** or safelist entries in `tailwind.config.js` — arbitrary `z-[###]` classes are stripped if not in content paths or safelist.

---

## PR checklist (lightweight)

- [ ] New code in the correct feature folder (see structure docs)
- [ ] No new `useEffect` unless one of the approved cases above
- [ ] Portals/overlays: pointer-events + z-index + dismiss without click-through
- [ ] Server actions thin; logic in services/utils inside the feature

---

## Related docs

- [STRUCTURE.md](../STRUCTURE.md) — **current** repo layout
- [FOLDER_STRUCTURE_V2.md](./FOLDER_STRUCTURE_V2.md) — **target** feature-first layout
- [AGENTS.md](../AGENTS.md) — agent quick reference
