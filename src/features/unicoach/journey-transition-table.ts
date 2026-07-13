/**
 * Transition table (authoritative mapping for product + tests).
 *
 * | from UX stage   | primary_action (server)     | Preconditions                         | Side effects (calls_data)                    |
 * |-----------------|----------------------------|---------------------------------------|----------------------------------------------|
 * | call-1-prep     | confirm_call_1_session     | Prep checklist complete               | call_1.call_completed                        |
 * | post-call-1    | confirm_portfolio_complete | Post–Call 1 checklist complete        | call_1.portfolio_completed                 |
 * | call-2         | confirm_call_2_session     | Call 2 checklist complete           | call_2.completed                             |
 * | post-call-2    | advance_to_call_3_phase    | Post–Call 2 checklist complete       | (none — unlocks Call 3 UX via derive only) |
 * | call-3         | confirm_call_3_session     | Call 3 checklist complete           | call_3.completed                             |
 * | complete       | noop_complete              | —                                     | —                                            |
 *
 * Coach overrides: coaches may still POST `update-student-calls`. Journey-state recomputes
 * `ux_stage` from `calls_data` + checklist; checklist rows are not auto-cleared (may look stale;
 * students can toggle checklist to match reality).
 *
 * Partial access: `unicoach_access_level === "partial"` unlocks through LinkedIn (`call-2`);
 * Application / Interview stay locked until remaining payment.
 * Module access unlocks only purchased modules.
 * `vsl_discovery` stays on Discovery until payment.
 * (mirrors legacy tab locks). Advance API rejects later stages.
 */
export const JOURNEY_TRANSITION_TABLE_VERSION = 1;
