# Portfolio API contract (v2)

Shared by Next.js (`PortfolioData` in `types.ts`) and Django (`Portfolio` model).

## Identifiers

- **`portfolio_id`**: string UUID, unique per `UserProfile` (stored on `Portfolio.portfolio_id`). Maps to frontend `PortfolioData.id`.
- **`name`**: dashboard title (model field). Maps to frontend `PortfolioData.title`.

## Base portfolio read: `GET /api/portfolio/`

Returns the user's **base** portfolio (`is_base=true`). Response envelope:

```json
{
  "assetData": {
    "portfolio_id": "uuid",
    "name": "Untitled Portfolio",
    "is_base": true,
    "slug": "my-slug-or-null",
    "published_at": null,
    "updated_at": "ISO-8601",
    "hasNewestTemplate": true,
    "hasOldTemplate": false,
    "profile": {},
    "editor_content": {},
    "document": {
      "schemaVersion": 2,
      "items": [],
      "profile": {}
    }
  }
}
```

- **`document`**: normalized shape for the Uniboard grid editor. `profile` inside `document` uses camelCase hero fields (`avatarUrl`, `coverUrl`, `contactButtons`, …) when derivable from stored JSON.
- **`schemaVersion`**: `2` means `editor_content` is stored as `{ "schemaVersion": 2, "items": [ ... ] }`. Legacy rows use a JSON **array** (BlockNote) at `editor_content`; then `document.schemaVersion` is `1`, `document.items` is `[]`, and `document.legacyEditorContent` holds the array (optional key).
- **`themeMode`**: stored in `profile.themeMode` (`"light"` | `"dark"`).

## Create initial: `POST /api/portfolio/create-initial/`

Optional JSON body:

```json
{ "name": "Optional title", "with_ai_template": true }
```

Response: `{ "assetData": <same shape as GET> }`.

**Client loading UX:** `create-initial` is synchronous (blocks until AI sections finish). The Uniboard app shows an indeterminate overlay until HTTP 200; there is no job/poll status API.

## Clone from base: `POST /api/portfolio/create/`

Optional `{ "name", "with_ai_template" }`. Requires existing base portfolio with v2 `editor_content`.

## Update: `POST /api/portfolio/update/`

Accept either:

**Legacy**

```json
{
  "content": {
    "name": "...",
    "profile_pic": "...",
    "cover_pic": {},
    "editor_content": {}
  }
}
```

**V2 (recommended)**

```json
{
  "portfolio_id": "uuid",
  "name": "Dashboard title optional",
  "profile": {},
  "items": [],
  "schemaVersion": 2,
  "is_base": false
}
```

Persist `items` + `schemaVersion` inside `editor_content` as `{ "schemaVersion": 2, "items": [...] }`. Merge `profile` into `Portfolio.profile`.

## Template: `POST /api/portfolio/replace-template/` and `revert-template/`

See backend `portfolio/views.py`.

## Publish: `POST /api/publish-asset/`

- `assetType`: `"portfolio"`
- `slug`: public slug string
- `content`: canonical portfolio document (same as v2 draft) **must** include `"id": "<portfolio_id>"` (or top-level `portfolio_id`).

## Published public read

`GET /api/public-asset-data/?assetType=portfolio&slug=...` returns `{ "assetData": <published snapshot> }`.

## ADK session keys (portfolio agentic editing)

Coexist with resume keys in the same global ADK session:

| Key                        | Type                                    | Description                                                                 |
| -------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `active_context`           | `"resume"` \| `"portfolio"` \| `"none"` | Which domain the UI is focused on                                           |
| `current_portfolio`        | `string \| null`                        | Active portfolio UUID                                                       |
| `portfolio_data`           | `Record<portfolioId, v2 backend JSON>`  | Mirrors `mapFrontendPortfolioToBackend` shape per id                        |
| `portfolio_focus_scope`    | `"root"` \| `"page_card"`               | Whether editor focus is root portfolio or inside a page-card detail view    |
| `portfolio_focus_block_id` | `string \| null`                        | Focused top-level page-card block id when `portfolio_focus_scope=page_card` |

Route PATCH on `/uniboard/portfolio` sets `active_context: "portfolio"` and updates `portfolio_data` **without** clearing `resume_data`.

## ADK Phase 2 — agentic edit loop (local ADK)

Requires `ADK_BACKEND_URL` (session PATCH/GET). `AGENT_ENGINE_ENDPOINT` disables session PATCH (follow-up for production).

### Mutating tool names (must match Python + `MUTATING_PORTFOLIO_TOOL_NAMES`)

| Tool                      | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `update_profile_field`    | Single hero field                                          |
| `update_profile`          | Batch hero JSON patch                                      |
| `add_block`               | Add grid block (all `ContentType` values)                  |
| `update_block`            | Partial block update by internal id (JSON)                 |
| `update_block_content`    | Update block body/title by `block_id` (preferred for text) |
| `update_block_by_heading` | Update block by visible title (e.g. Quick Summary)         |
| `remove_block`            | Remove block                                               |
| `reorder_blocks`          | JSON array of block ids in order                           |
| `duplicate_block`         | Clone block after source                                   |
| `add_page_block`          | Add nested block inside a page-card/project detailed view  |
| `update_page_block`       | Patch nested block inside page-card/project                |
| `remove_page_block`       | Remove nested block inside page-card/project               |
| `reorder_page_blocks`     | Reorder nested blocks inside page-card/project             |
| `duplicate_page_block`    | Duplicate nested block inside page-card/project            |

Read tools: `get_portfolio`, `get_profile`, `get_items`, `get_item`, `get_section`, `get_page_blocks`, `get_page_block`.

### Frontend flow

1. User on `/uniboard/portfolio` → PATCH `portfolio_data` + focus keys (`portfolio_focus_scope`, `portfolio_focus_block_id`) from Zustand.
2. Agent mutates session via tools → SSE `function_response` → debounced GET session.
3. `mapAdkPortfolioDataMapToFrontend` → `usePortfolioStore` + review diff.
4. Chat **Accept** → `usePortfolioAutosave` `runSave("manual")` → Django.
5. Chat **Discard** → restore baseline to store + PATCH session + `portfolio-adk-discard` event.

### Review highlight keys (`adkPortfolioHighlightDiff`)

| Key                              | Meaning                                            |
| -------------------------------- | -------------------------------------------------- |
| `hero`                           | Profile / hero section changed                     |
| `block:<itemId>`                 | Grid block added, modified, or removed             |
| `page:<pageId>:block:<nestedId>` | Nested page-card block added, modified, or removed |

Autosave is paused while `useAdkPortfolioReviewStore.hasPendingReviewForPortfolio(portfolioId)` is true.

### Media

Agents cannot upload binaries; they may set text URLs or placeholders. User adds files in the editor after Accept.
