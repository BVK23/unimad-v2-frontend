# Unicoach Journey, Gating & Payments

**Audience:** PMs, QA, coaches ops, and engineers  
**Repos:** `unimad-app` (frontend) · `unimadai-django-gcr` (backend)  
**Related ClickUp docs:** [UniCoach V2 Journey v3](https://app.clickup.com/90161632295/v/dc/2kz0un17-76/2kz0un17-5116) · [Subscription & Payment Architecture](https://app.clickup.com/90161632295/v/dc/2kz0un17-76/2kz0un17-2856) · [Masterclass VSL Flow](https://app.clickup.com/90161632295/v/dc/2kz0un17-76/2kz0un17-4756) · [This guide on ClickUp](https://app.clickup.com/90161632295/v/dc/2kz0un17-76/2kz0un17-5676)

This page explains **how Unicoach works end-to-end**: student journey, unlock/gating rules, coach pipeline moves, **manual payment recording** (UPI / bank / off-Razorpay), and **in-product Razorpay checkout** (journey + masterclass). Start with the product story; technical notes are later.

---

## 1. What Unicoach is (plain language)

Unicoach is a **coached career programme** with four modules:

| Module (student UI)  | Coach pipeline column         | Typical call |
| -------------------- | ----------------------------- | ------------ |
| Discovery call       | Discovery / Call 1            | Call 1       |
| LinkedIn branding    | LinkedIn branding / Call 2    | Call 2       |
| Application Strategy | Application Strategy / Call 3 | Call 3       |
| Interview Prep & VPD | Interview mastery / Call 4    | Call 4       |

After Call 4, students keep **Follow the system** (ongoing). Programme progress only reaches **100% when the student is marked Offered** (landed a role).

Most students start on a **free Discovery** enrollment (`vsl_discovery`). Paid access unlocks later modules via:

1. **Razorpay in the product** (card / supported methods), or
2. **Manual coach recording** when the student paid outside the app (UPI, bank transfer, etc.).

---

## 2. Happy path — Discovery to paid programme

```
Not started
  → Student books Discovery (VSL / Calendly / masterclass)
  → Coach adds them / they appear as VSL Discovery student
  → Coach pipeline: Not started → Discovery (Call 1)
  → After Discovery call, student wants Call 2+
       ├─ Path A: Student pays in-app (Razorpay picker / masterclass)
       └─ Path B: Student paid outside → coach records payment, then moves stage
  → LinkedIn → Application → Interview → … → Offered
```

### Discovery-only students

- Can use **Discovery call** content and checklist.
- CTA to continue is typically **Continue program** (opens product pricing), **not** Calendly for Call 2.
- LinkedIn and later modules stay **locked** until payment entitlement upgrades.

### After payment (full / partial / module)

- Enrollment upgrades (`paid_full`, `paid_partial`, or module purchases in `module_data`).
- Unlock ceiling follows payment (see section 3).
- Student books the next coach call via Calendly when allowed.

---

## 3. Gating logic (what unlocks what)

Two ideas work together:

### A. Payment entitlement (access level)

| Access level    | Meaning                                          | Student may unlock up to                                         |
| --------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| `vsl_discovery` | Free discovery only                              | Discovery module                                                 |
| `module`        | Bought one or more single modules                | Those modules only                                               |
| `partial`       | First installment (~50% via coupon/partial plan) | Through LinkedIn (Call 2); Call 3/4 blocked until remaining paid |
| `full`          | Full programme or second installment             | All four modules                                                 |

### B. Progress unlock (calls + checklist)

Real coaching is **not strictly linear**. Coaches often mark calls complete or drag students forward without every checklist box.

**Rules now:**

- **Unlock primarily follows coach-marked call completions**, clamped by payment entitlement.
- Student checklist still matters for their own progress UI and CTAs.
- When a coach moves a student (dropdown / drag-drop), the backend **auto-completes checklist tasks** for stages covered by completed calls (`source: coach_pipeline`), so the student is not stuck locked with empty boxes.
- Journey load also **re-aligns checklists** with already-completed calls (fixes older rows).

**Coach sidebar locks:** Coaches still **see lock icons** matching what the student cannot open yet, but coaches **can click** locked modules to inspect content.

**Progress bar:** Call stars sit before 100%. The segment after Call 4 fills only when **Offered**. Follow the system does not count toward percent.

**Confetti (student):** Celebrates when a call was just finished (new module checklist still empty — once per session key), or when a **full stage checklist** becomes complete. Not on every refresh, and not on every single task click.

---

## 4. Coach pipeline moves and manual payment

### Why manual payment exists

Many students pay via **UPI, bank transfer, or other channels** that coaches handle outside Razorpay Checkout. The product still needs:

- A **UserSubscription** row (Active),
- Correct **enrollment** on `UnicoachStudentData`,
- Unlock so the journey matches reality.

### How coaches record payment

1. Coach tries to move a Discovery student **past** Discovery (e.g. to LinkedIn or Application).
2. If payment is required, the UI opens **Record payment** (plan, amount, paid date, optional note).
3. Backend `POST /api/unicoach/record-manual-payment/`:
   - Creates subscription id like `manual_coach_{coach_user_id}_{YYYYMMDD}`
   - Status: **`active`** (not `payment_verified` — that status is for Razorpay pre-webhook state)
   - `billing_history`: only `period_start` / `period_end` (+90 days)
   - Runs the same enrollment fulfill path as paid Razorpay orders
4. Coach move then proceeds; calls/checklists sync.

**Skip confirm:** Dragging Discovery to Application skips LinkedIn on the graph; payment gate already covers that — no extra skip confirm if payment is required.

**Offered from Discovery:** No subscription is created (student never paid; edge case).

**Refund:** Coach can move to Refund; enrollment downgrades back toward discovery-only.

### Moving stages

| Action                               | Effect                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------- |
| Dropdown / drag to LinkedIn branding | Marks Discovery (+ LinkedIn call per pipeline semantics), unlocks after pay |
| Mark call complete button            | Same pipeline targets; shows already marked when done                       |
| Move to Offered                      | Sets offered flag; progress can hit 100%                                    |

---

## 5. In-app Razorpay (after Discovery / masterclass)

### Journey product picker (Continue program)

After Discovery, the student sees **four paid options** (no intermediate Pay £199 modal — Razorpay opens directly):

| Card                 | Plan id            | Price | Coupon                               |
| -------------------- | ------------------ | ----- | ------------------------------------ |
| LinkedIn Branding    | `unicoach_call_2`  | £77   | No                                   |
| Application Strategy | `unicoach_call_3`  | £85   | No                                   |
| Interview Mastery    | `unicoach_call_4`  | £99   | No                                   |
| Full System          | `unicoach_program` | £199  | **Yes** (optional field on the card) |

**Partial (~50%):** Coupons that include `partial` in the code apply to Full System and create the partial-payment entitlement (Call 2 unlocked; later modules need remaining balance).

Flow: enter coupon on Full System (optional) → spinner while order creates → **Razorpay Checkout** with discounted amount / correct plan.

### Masterclass page

Same catalogue: Discovery (free book) + three modules + Full System with optional coupon → **direct Razorpay** (guest claim token → sign-in if not authenticated).

### Razorpay status lifecycle (product payments)

1. Checkout success → often **`payment_verified`** briefly while webhook / verification completes
2. Webhook / fulfill → **`active`**
3. Account Settings: show payment being processed **only** for `payment_verified`; Active students see subscribed Unicoach without that line

Manual coach payments skip step 1 and write **Active** immediately.

### Account Settings (subscription tab)

- Discovery with no paid sub: **Unicoach — Free discovery**
- Paid: plan banner **Unicoach**, purchases list, billing history
- Billing **End** column: empty/dash for full programme in UI; **~30 days** display for partial; backend may still store +90d period_end for bookkeeping

---

## 6. Data model (for engineers)

| Store                                   | Purpose                                                  |
| --------------------------------------- | -------------------------------------------------------- |
| `UnicoachStudentData.enrollment_type`   | `vsl_discovery` / `paid_partial` / `paid_full`           |
| `UnicoachStudentData.calls_data`        | Coach milestones + `pipeline_stage`, offered/refunded    |
| `UnicoachStudentData.journey_checklist` | Stage task checklists + gates (not execution daily log)  |
| `UnicoachStudentData.module_data`       | Purchased modules + `execution_tracker` (daily activity) |
| `UserSubscription`                      | Plan id, amount, status, billing_history                 |

**Key backend files:** `unicoach_journey.py`, `unicoach_coach_moves.py`, `unicoach_coach_pipeline.py`, `unicoach_public_utils.py`, journey/payment endpoints in `views.py`.

**Key frontend files:** `UnicoachJourney.tsx`, `UnicoachProductPricingPickerModal.tsx`, `use-coach-pipeline-move-flow.ts`, `coach-pipeline-gates.ts`, `launch-unicoach-razorpay-checkout.ts`, `MasterclassLandingPage.tsx`, `UserSubscriptionPanel.tsx`.

---

## 7. QA setup — simulate a Discovery student in Admin

Use this when you cannot wait for a real Calendly/VSL booking.

### Prerequisites

- A normal **UserProfile** that can sign into the app (test email).
- At least one active **UniCoach** row (so the student can be assigned).

### Steps (Django Admin)

1. Open **Unicoach student data** (`UnicoachStudentData`).
2. **Add** a row (or edit existing):
   - **User:** pick the test profile
   - **Enrollment type:** `VSL Discovery` / `vsl_discovery`
   - **Unicoaches:** assign the coach who will appear on the coach desk
   - Optionally set **program start date**
   - Leave `calls_data` empty or `{}` for not started; or set Discovery completed if you want mid-funnel
3. Ensure **no Active Unicoach UserSubscription** exists for that user (or you get paid access instead of discovery).
4. Sign in as the **student** → `/uniboard/unicoach` → should see Discovery unlocked, later modules locked.
5. Sign in as the **coach** → coach dashboard → student should appear under Discovery / Not started (depending on `calls_data`).

### Optional: seed Discovery call complete without payment

Coach UI: move student to **Discovery (Call 1)** only. Student remains discovery-entitled until payment.

---

## 8. QA checklist

### A. Discovery and locks

- [ ] New VSL discovery student: only Discovery unlocked; LinkedIn+ locked
- [ ] Coach sidebar shows **same locks** as student, but coach can still open locked modules
- [ ] Student CTA after Discovery tasks/call: **Continue program** (not Book Call 2 to Calendly)
- [ ] Hint under CTA hidden when Discovery tasks + Call 1 are done

### B. Manual payment and coach moves

- [ ] Drag Discovery → LinkedIn: payment modal appears if unpaid
- [ ] Record payment (plan Full / module / partial, amount, date) → subscription **Active**, enrollment upgraded
- [ ] Billing history has period_start / period_end only (no manual coach junk in user-facing details)
- [ ] After pay + move to LinkedIn: student sees LinkedIn **unlocked** even if they never checked boxes
- [ ] Checklist auto-filled for completed calls; progress % updates
- [ ] Drag Discovery → Application: payment + skip stages works; LinkedIn not left wrongly locked
- [ ] Move Discovery → Offered: **no** subscription created
- [ ] Coach Mark call complete disabled with already marked when call already complete
- [ ] Progress / Calls stats on coach header match student-sized cards; track has Call 4 before end + Landed role

### C. Razorpay — journey picker

- [ ] Full System: optional coupon → spinner → Razorpay with discounted amount
- [ ] Module cards: no coupon field; Razorpay at list price
- [ ] Invalid coupon: error, no checkout
- [ ] Partial coupon: partial access (Call 2 ok; Call 3 blocked until remaining)
- [ ] No intermediate Unicoach Full System / Pay £199 modal

### D. Razorpay — masterclass

- [ ] Same as C for Full System + modules
- [ ] Guest checkout → claim / sign-in path still works

### E. Account settings

- [ ] Discovery: Unicoach free discovery copy
- [ ] Active full: Unicoach + Full program; **no** payment being processed
- [ ] `payment_verified` only: shows processing message
- [ ] Banner CTA readable (not white-on-white)
- [ ] Billing End: dash for full; ~30 days UI for partial

### F. Confetti and polish

- [ ] Refresh does **not** re-fire confetti every time
- [ ] Completing last checklist item of a stage → confetti once
- [ ] Checking a middle task → no confetti
- [ ] After coach marks a call / student lands on empty next-module checklist → confetti once (session)

### G. Execution tracker

- [ ] Daily log / comments / connections persist under **module_data.execution_tracker**, not journey_checklist

---

## 9. Open / deferred

- Legacy CSV backfill of historical coach payments (ClickUp follow-up)
- Optional soft-landing messaging for older `payment_verified` manual rows created during testing

---

_Last updated: 13 Jul 2026 — covers coach payment gates, call-based unlock, direct Razorpay + coupons, settings UI, progress-to-offered, confetti rules._
