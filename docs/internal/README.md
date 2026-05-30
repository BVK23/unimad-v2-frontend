# Internal design guidelines

Static HTML references for Unimad UI and brand. **Not linked from the product** — served only via `/internal/design/*`.

## Access

| Environment                               | Who can view                                                 |
| ----------------------------------------- | ------------------------------------------------------------ |
| **Localhost** (`localhost` / `127.0.0.1`) | Anyone (no login required)                                   |
| **Production / staging**                  | Authenticated users with `UserProfile.is_team_member = true` |

Unauthenticated or non-team requests receive **404** (not 403) so the routes are not discoverable.

## URLs (dev server)

- Index: http://localhost:3000/internal/design
- Design system: http://localhost:3000/internal/design/design-system
- Brand book: http://localhost:3000/internal/design/brand-book

## Updating

Replace the HTML files in this folder when design exports a new version. Keep filenames stable (`design-system.html`, `brand-book.html`).
