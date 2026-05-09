# Project folder structure

This document defines where code and assets live. **Follow it when adding or moving files.** AI agents and contributors should use it to decide where to put new code.

---

## Quick reference (for AI agents)

- **Feature logic** (store, hooks, server actions, API mappers) → `src/features/<feature-name>/`
- **Feature UI** (pages, components, templates) → `components/<feature-name>/` or root `components/`
- **App-wide hooks** → `src/hooks/`
- **App-wide server helpers / actions** → `src/lib/` (e.g. `src/lib/actions/`)
- **Routes and layouts** → `src/app/` (App Router)
- **Shared types** → `types/` or root `types.ts`
- **Shared utils** → `utils/`
- **Shared constants** → `constants/`
- **External services (e.g. APIs)** → `services/`
- **Do not** move existing `components/`, `utils/`, `constants/`, `types/`, `services/` into `src/` unless the team agrees on a migration.

---

## Directory tree

```
unimad-app/
├── src/
│   ├── app/                    # Next.js App Router (routes, layouts, pages)
│   │   ├── api/                # API route handlers
│   │   ├── signin/
│   │   ├── uniboard/           # Dashboard: portfolio, resume, linkedin, jobs, studio, community
│   │   └── (published-content)/# Public portfolio / resume / vpd by slug
│   ├── features/               # Feature slices (logic only; UI stays in components/)
│   │   └── <name>/             # e.g. resume, jobs, studio
│   │       ├── store/         # Zustand or other state
│   │       ├── hooks/         # React Query / custom hooks
│   │       ├── server-actions/# "use server" functions
│   │       └── api/           # DTOs, mappers, fetch helpers
│   ├── hooks/                  # App-wide hooks (e.g. useAuthStatus)
│   ├── lib/                    # Shared server helpers (e.g. auth actions)
│   └── proxy.ts
├── components/                 # All UI (shared + feature-specific)
│   ├── <Feature>.tsx          # Shared or entry components at root
│   ├── jobs/, studio/, community/, resume/  # Feature UI subfolders
│   └── resume/templates/, resume/config/, resume/shared/
├── utils/                      # Shared utility functions
├── constants/                  # Shared constants (e.g. errors)
├── types/                      # Shared TypeScript types (plus root types.ts)
└── services/                   # External service clients (e.g. Gemini)
```

---

## Rules

### Where to put new code

| What you're adding                                       | Put it here                                                                                                                 |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| New feature that has server actions, state, or API calls | Create `src/features/<name>/` with `store/`, `hooks/`, `server-actions/`, `api/` as needed. Put UI in `components/<name>/`. |
| New feature that is UI-only for now                      | Put everything in `components/<name>/`. Add `src/features/<name>/` later when you add logic.                                |
| New app-wide hook                                        | `src/hooks/`                                                                                                                |
| New shared server action or helper                       | `src/lib/` or `src/lib/actions/`                                                                                            |
| New shared component                                     | `components/` (or `components/ui/` for primitives)                                                                          |
| New shared type                                          | `types/` or root `types.ts`                                                                                                 |
| New shared util                                          | `utils/`                                                                                                                    |
| New API route                                            | `src/app/api/...`                                                                                                           |
| New page or layout                                       | `src/app/...` under the correct route                                                                                       |

### What not to do

- Do **not** put feature UI inside `src/features/<name>/ui/`; feature UI lives in `components/<name>/`.
- Do **not** move the existing `components/`, `utils/`, `constants/`, `types/`, or `services/` folders into `src/` without a team decision.
- Do **not** put shared utilities inside `components/`; use `utils/` (e.g. move things like `components/dateUtils.ts` to `utils/` when touching that code).

### Path alias

- `@/*` resolves to both repo root and `src/` (see `tsconfig.json`). Use `@/components/...`, `@/types/...`, `@/utils/...`, `src/features/...` in imports as appropriate.

---

## Uniboard features

| Feature   | Route               | Feature logic (src/features) | UI (components)                             |
| --------- | ------------------- | ---------------------------- | ------------------------------------------- |
| Portfolio | /uniboard/portfolio | —                            | components/Portfolio.tsx                    |
| Resume    | /uniboard/resume    | src/features/resume/         | components/Resume\*.tsx, components/resume/ |
| LinkedIn  | /uniboard/linkedin  | —                            | components/LinkedInDashboard.tsx            |
| Jobs      | /uniboard/jobs      | —                            | components/jobs/                            |
| Studio    | /uniboard/studio    | —                            | components/studio/                          |
| Community | /uniboard/community | —                            | components/community/                       |

When you add server actions or non-trivial state to any feature, add a slice under `src/features/<name>/` and keep its UI in `components/<name>/`.
