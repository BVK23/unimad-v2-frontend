# Instructions for AI agents

When working in this repo, follow the project folder structure so new and modified code land in the right place.

## Where to read

- **Folder structure and conventions:** [STRUCTURE.md](./STRUCTURE.md) (current layout) · [docs/FOLDER_STRUCTURE_V2.md](./docs/FOLDER_STRUCTURE_V2.md) (target layout)  
  Use it to decide where to create or move files (feature logic vs UI, hooks, server actions, types, utils, etc.).
- **Code guidelines (`useEffect`, React, overlays):** [docs/CODE_GUIDELINES.md](./docs/CODE_GUIDELINES.md)
- **Design system (UI components, tokens, badges, cards):** `docs/internal/design-system.html` — browse at `/internal/design/design-system` when running locally, or when signed in as a team member in production.
- **Brand guidelines:** `docs/internal/brand-book.html` — browse at `/internal/design/brand-book` under the same access rules.

## Rules to follow

1. **Feature logic** goes in `src/features/<feature-name>/` (store, hooks, server-actions, api). **Feature UI** stays in `components/<feature-name>/` or root `components/`. Do not put feature UI under `src/features/*/ui/`.
2. **App-wide hooks** → `src/hooks/`. **App-wide server helpers** → `src/lib/`.
3. **Shared types** → `types/` or root `types.ts`. **Shared utils** → `utils/`. **Constants** → `constants/`. **External services** → `services/`.
4. **Routes and pages** → `src/app/` (Next.js App Router).
5. Do **not** move the existing `components/`, `utils/`, `constants/`, `types/`, or `services/` folders into `src/` unless the user explicitly asks for that migration.

For full details, examples, and the directory tree, see [STRUCTURE.md](./STRUCTURE.md).
