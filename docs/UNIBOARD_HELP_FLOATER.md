# Uniboard help floater

## Component

**`components/uniboard/UniboardHelpFloater.tsx`** — bottom-right help FAB used across Uniboard (except Unicoach).

Legacy alias: `components/portfolio/FeatureOnboardingFloater.tsx` re-exports `UniboardHelpFloater`. Prefer the new name in new code.

### FAB icon

| User state                      | Icon                | Meaning                       |
| ------------------------------- | ------------------- | ----------------------------- |
| Onboarding incomplete (minimal) | Sparkles            | Finish setup / get started    |
| Fully onboarded                 | BookOpen (notebook) | Feature help / knowledge base |

Do not put a notebook icon on the Knowledge base row itself — the FAB already signals that. If the floater later hosts more actions for onboarded users, pick a different FAB icon then.

## What it hosts

| CTA                                             | When shown                                                                                  | Behavior                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Finish onboarding**                           | `!profile_setup_complete \|\| !niche_complete`                                              | Navigates to onboarding                                                    |
| **Knowledge base**                              | Always in the open menu                                                                     | Enabled when feature has a KB; else “Soon”                                 |
| **Generate / Regenerate portfolio with Unibot** | Portfolio page, `portfolio_auto_create`, based on `context_snapshot.portfolio_generated_at` | Confirm modal → create-initial or replace-template (Replace Portfolio Gen) |
| **Revert to previous portfolio**                | Portfolio page when `context_snapshot.can_revert` (`replaced_at` + `pre_replace`)           | Confirm (double-confirm if edited since replace) → revert-template         |

`portfolio_auto_create` = profile setup + niche complete (see [ONBOARDING_GATES.md](./ONBOARDING_GATES.md)).

Fully onboarded users still see the floater (notebook FAB) so they can open a knowledge base (or see the disabled placeholder on features without one yet).

## Adding a feature knowledge base

1. Build the modal UI under `components/<feature>/` (e.g. `ResumeKnowledgeBaseModal`).
2. In `UniboardHelpFloater`, update `resolveKnowledgeBaseAvailability` for that route so **Knowledge base** is enabled.
3. On click, open that feature’s modal from the floater (same pattern as resume).
4. Do **not** add a separate toolbar “i” / info button on the feature page header.

Resume is the reference implementation: enabled on `/uniboard/resume`, opens `ResumeKnowledgeBaseModal`.

## Mount points

- `src/app/uniboard/UniboardShell.tsx` — all Uniboard routes except Unicoach and Portfolio
- `src/app/uniboard/portfolio/PortfolioPageClient.tsx` — portfolio (generate / regenerate / revert props)
