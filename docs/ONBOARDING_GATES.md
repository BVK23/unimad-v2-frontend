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

## Redirects

| Path                                      | Rule                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Hard redirect into `/uniboard/onboarding` | Missing phone **or** goals, unless full profile setup **or** legacy resume/niche progress already exists   |
| Leave `/uniboard/onboarding`              | Redirect to resume when `profile_setup_complete && niche_complete`, except `?mode=niche\|strengths` refine |

Return mode `?mode=profile_setup` opens the resume step for users finishing after minimal entry.
