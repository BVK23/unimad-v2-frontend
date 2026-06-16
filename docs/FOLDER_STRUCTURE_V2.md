# Next.js app folder structure (V2 target)

**Status:** Target architecture for new work and gradual migration. The repo still uses a hybrid layout documented in [STRUCTURE.md](../STRUCTURE.md). Do not mass-move folders without a planned migration.

---

## Core principle

Organize code by **feature/domain**, not by file type.

Each feature should be self-contained so it can be developed, modified, or removed independently without affecting unrelated parts of the codebase.

---

## Top-level structure

```
src/
├── app/                # Next.js routing (App Router only)
├── features/           # Domain-based modules (PRIMARY STRUCTURE)
├── components/         # Global reusable UI components only
├── hooks/              # Global reusable hooks (rare)
├── lib/                # Core utilities (db, auth, constants, helpers)
├── server/             # Shared server-side logic (optional)
├── types/              # Global types
└── config/             # App-level configuration
```

**Current repo note:** Legacy folders at repo root (`components/`, `utils/`, `constants/`, `types/`, `services/`) remain valid until migrated. New feature logic goes under `src/features/`; feature UI stays in `components/<feature>/`.

---

## Feature structure (standard)

```
features/<feature-name>/
├── components/         # UI specific to this feature
├── hooks/              # Hooks specific to this feature
├── actions.ts          # Server actions related to this feature
├── services.ts         # Business logic (DB, APIs, transformations)
├── types.ts            # Feature-specific types
└── utils.ts            # Feature-specific helpers (optional)
```

**Current equivalent:** `src/features/<name>/` with `store/`, `hooks/`, `server-actions/`, `api/` plus UI in `components/<name>/`.

---

## Rules & responsibilities

### 1. Routing (`app/`)

- Only routing, layouts, and page composition
- May contain `_components/` for route-specific UI
- Must **not** contain business logic

### 2. Components

| Scope            | Location                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| Route-specific   | `app/<route>/_components/`                                                     |
| Feature-specific | `features/<feature>/components/` (target) or `components/<feature>/` (current) |
| Global reusable  | `components/`                                                                  |

Avoid placing feature-specific components in global folders.

### 3. Hooks

- Prefer colocating inside features
- Use global `hooks/` only for generic utilities (e.g. `useDebounce`)

### 4. Server actions

- Live inside the corresponding feature (`features/<feature>/actions.ts` or `src/features/<feature>/server-actions/`)
- Orchestrate only — call services, do not implement business logic inline

### 5. Services (critical layer)

All business logic belongs here:

- Database queries
- External API calls
- Data transformations

Server actions must call services, not access the DB directly.

### 6. Shared core (`lib/`)

Centralized utilities: `db.ts`, `auth.ts`, `utils.ts`, `constants.ts`

### 7. Optional shared server layer

```
server/
├── actions/
└── services/
```

Use only for logic shared across multiple features.

---

## Architectural principles

1. **Colocation over centralization** — Related code stays in one feature folder.
2. **Separation of concerns** — UI (components) · state/logic (hooks) · orchestration (actions) · business logic (services).
3. **Avoid global dumping grounds** — Do not grow unstructured `components/`, `hooks/`, or `utils/` without strict filtering.
4. **Feature isolation test** — A feature should be removable by deleting a single folder with minimal side effects.

---

## Anti-patterns (avoid)

- Accessing the database directly inside components or actions
- Placing feature logic in global folders
- Large unstructured `utils/` or `components/` directories
- Mixing unrelated features in the same module
- Putting feature UI under `src/features/*/ui/` (use `components/<feature>/` in current layout)

---

## Uniboard features (reference)

| Feature   | Route                 | Logic                  | UI (current)                                   |
| --------- | --------------------- | ---------------------- | ---------------------------------------------- |
| Portfolio | `/uniboard/portfolio` | —                      | `components/Portfolio.tsx`                     |
| Resume    | `/uniboard/resume`    | `src/features/resume/` | `components/Resume*.tsx`, `components/resume/` |
| LinkedIn  | `/uniboard/linkedin`  | —                      | `components/LinkedInDashboard.tsx`             |
| Jobs      | `/uniboard/jobs`      | `src/features/jobs/`   | `components/jobs/`                             |
| Studio    | `/uniboard/studio`    | —                      | `components/studio/`                           |
| Community | `/uniboard/community` | —                      | `components/community/`                        |

When adding server actions or non-trivial state, create or extend `src/features/<name>/` and keep UI in `components/<name>/`.

---

## Summary

- Use `app/` for routing only
- Use `features/` as the primary organizational unit (target: under `src/features/`, evolving toward full feature folders)
- Keep logic close to where it is used
- Enforce clear separation between UI, logic, and data layers
- Optimize for scalability, readability, and maintainability

See also [CODE_GUIDELINES.md](./CODE_GUIDELINES.md) for `useEffect` and React conventions.
