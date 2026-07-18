# Onboarding gates (field-based)

## Source of truth

Backend: `unimadai-django-gcr/app/unimadai/onboarding/feature_gates.py`  
Exposed on `/api/user-data/` as `feature_gates` (+ `onboarding_required` for hard redirect).

**Do not gate product UX on `onboarded_at` or `minimal_onboarded_at`.**  
Those columns are analytics / CRM markers. Existing and minimal-onboarded users often have them set while still missing resume or niche data.

## Field checks

| Gate                          | Meaning                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `initial_onboarding_complete` | Goals saved (`goal` or personalization `goals`)                                          |
| `profile_setup_complete`      | `preferred_name`, ≥1 education, ≥3 skills, ≥1 experience **or** project, ≥1 desired role |
| `niche_complete`              | ≥1 `desired_roles` entry                                                                 |

Soft “Finish onboarding” / sparkles floater: `!profile_setup_complete || !niche_complete`  
(`needsProfileSetup()` in `src/features/onboarding/featureGates.ts`).

## Computed onboarding entry step (Jul 2026)

All CTAs link to **`/uniboard/onboarding`** only (no `?mode=` deep links).  
`UniboardOnboardingFlow` calls `resolveOnboardingEntryStep(feature_gates, profile)` after profile loads.
Feature gates come from `OnboardingGateProvider` (also mounted on the onboarding route).

| Order | Condition                                            | Opens at                                     |
| ----- | ---------------------------------------------------- | -------------------------------------------- |
| 1     | `profile_setup_complete && niche_complete`           | Redirect to `/uniboard/resume` (server)      |
| 2     | `!initial_onboarding_complete`                       | `welcome`                                    |
| 3     | Missing `preferred_name` (minimal → full)            | `name` (then skip to `resume` if goals done) |
| 4     | `!niche_complete` **and** resume progress on profile | `niche`                                      |
| 5     | Otherwise                                            | `resume` (upload PDF / Build with Unibot)    |

**Resume progress** = any of: ≥1 education, ≥3 skills, ≥1 experience, ≥1 project (`hasResumeProfileProgress()`).

Legacy `?mode=niche|profile_setup|strengths` URLs are stripped client-side.

## Redirects

| Path                                      | Rule                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Hard redirect into `/uniboard/onboarding` | Missing phone **or** goals, unless full profile setup **or** legacy resume/niche progress already exists |
| Leave `/uniboard/onboarding`              | Redirect to `/uniboard/resume` when `profile_setup_complete && niche_complete`                           |

## Portfolio scratch + first save (Jul 2026)

Gates used: `needsProfileSetup()` (= `!profile_setup_complete || !niche_complete`); onboarding complete for portfolio = `portfolio_auto_create` (= profile + niche).

Prompts are **derived** only after `usePortfolio().isFetched` — never flash a modal before gates + portfolio row state are known.

| User state                                                                                                       | Portfolio page behaviour                                                                                   |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| No row **and** onboarding incomplete (`needsProfileSetup`)                                                       | Modal: Finish onboarding / Start from scratch. Local draft only until save.                                |
| No row **and** onboarding complete (`portfolio_auto_create`)                                                     | Soft “Generate your portfolio?” modal + floater Generate.                                                  |
| Row exists, never AI-generated, **light** scratch (`items ≤ 2` **or** `context_snapshot.number_of_edits ≤ 5`)    | Keep soft “Generate?” modal (nudge).                                                                       |
| Row exists, never AI-generated, **engaged** scratch (`items > 2` **and** `context_snapshot.number_of_edits > 5`) | Floater **Generate** only (no auto popup).                                                                 |
| Row exists, AI-generated (`portfolio_generated_at`)                                                              | Floater **Regenerate**; Revert when `pre_replace` + `replaced_at`.                                         |
| First autosave / manual save (scratch)                                                                           | `POST /api/portfolio/update/` creates row (`created: true`); empty snapshot (no `portfolio_generated_at`). |
