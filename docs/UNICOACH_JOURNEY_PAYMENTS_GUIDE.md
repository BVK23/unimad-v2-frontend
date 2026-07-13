# Unicoach Journey, Gating & Payments

**Audience:** PMs, QA, Unicoach coaches/ops, and engineers  
**Repos:** `unimad-app` / `unimad-v2-frontend` (frontend) · `unimadai-django-gcr` (backend)  
**Related ClickUp docs:** [UniCoach V2 Journey v3](https://app.clickup.com/90161632295/v/dc/2kz0un17-76/2kz0un17-5116) · [Subscription & Payment Architecture](https://app.clickup.com/90161632295/v/dc/2kz0un17-76/2kz0un17-2856) · [Masterclass VSL Flow](https://app.clickup.com/90161632295/v/dc/2kz0un17-76/2kz0un17-4756) · [This guide on ClickUp](https://app.clickup.com/90161632295/v/dc/2kz0un17-76/2kz0un17-5676)

This is the **current source of truth** for how Unicoach journey unlocks, booking CTAs, coach pipeline moves, and payments work after the July 2026 gating fixes.

---

## 1. Product story (plain language)

Unicoach is a **coached career programme** with four student modules:

| Student module       | Coach pipeline column label | Coach call completed |
| -------------------- | --------------------------- | -------------------- |
| Discovery call       | Discovery call              | Call 1               |
| LinkedIn branding    | LinkedIn branding           | Call 2               |
| Application Strategy | Application Strategy        | Call 3               |
| Interview Prep & VPD | Interview mastery           | Call 4               |

After Call 4, **Follow the system** stays ongoing. Programme progress only hits **100% when Offered** (landed a role). Call 4 star sits near **~90%**; the last segment fills on Offered.

Most students start as **VSL Discovery** (`enrollment_type = vsl_discovery`). Paid access unlocks later modules via Razorpay in-product or **manual coach payment** (UPI / bank / off-platform).

---

## 2. Two layers of access (do not mix these up)

### Layer A — Payment entitlement (sidebar unlock ceiling)

| Access          | Meaning                            | Highest module student may open |
| --------------- | ---------------------------------- | ------------------------------- |
| `vsl_discovery` | Free discovery only                | Discovery                       |
| `partial`       | First installment                  | Through LinkedIn                |
| `module`        | Bought specific modules            | Those modules only              |
| `full`          | Full programme / both installments | All four                        |

Full-paid students can **open later modules in the sidebar without a lock** once progress unlock allows it (see Layer B). Opening a later module does **not** mean its checklist is editable yet.

### Layer B — Progress unlock + working stage

| Concept                        | What it means                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`max_unlocked_stage`**       | Highest module the student may navigate to (sidebar). Driven by **coach call completions** and/or checklist completion, then **clamped by payment**.                |
| **`ux_stage` (working stage)** | Module where the student can **edit** checklist items. Advances only when the **coach call for the previous work is marked complete** — **not** by checklist alone. |

**Example (full-paid):** LinkedIn checklist finished, Call 2 **not** marked → Application Strategy can unlock in the sidebar (no lock), but working stage stays **LinkedIn**. Application Strategy checklist is visible as reference / disabled until Call 2 is marked.

---

## 3. Booking CTAs (where they appear)

Booking CTAs live on the **module that owns that call**, and are **not** gated on finishing that module’s checklist:

| CTA                            | Appears on           | When it shows                                                                                                             |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Continue program** (payment) | Discovery            | Discovery-only (`vsl_discovery`) after Discovery tasks (+ Call 1 when required)                                           |
| **Book Call 2**                | LinkedIn branding    | Call 1 done + LinkedIn access (full / partial / module) + Call 2 not yet complete                                         |
| **Book Call 3**                | Application Strategy | Call 2 coach-marked + Application Strategy access + Call 3 not yet complete                                               |
| **Book Call 4**                | Interview Prep & VPD | Working stage is Interview Prep + Interview Prep tasks done + interview-ready confirm + Call 3 done + Call 4 not complete |

**Important:** Completing LinkedIn checklist does **not** move Book Call 3 onto LinkedIn. Book Call 3 only appears on **Application Strategy**, and only after Call 2 is marked.

Partial / module students who need to pay more see **Continue program** on Application Strategy instead of Calendly for Call 3.

---

## 4. Task checklists

- Student can **edit** checklist only on **`ux_stage`** (current working module).
- Viewing another unlocked module: checklist shown as **reference** (checked items struck through, all disabled) plus a hint:
  - If current-stage checklist **done** but call **not** marked → _Open your current stage (X) and finish your call with your coach._
  - If current-stage checklist **incomplete** → _Open your current stage (X) and finish all checklist items._
- **Application Strategy** tasks become editable only after **Call 2** is marked.
- **Interview Prep** tasks become editable only after **Call 3** is marked.
- Coach pipeline **forward** moves auto-complete checklist tasks for covered modules (`source: coach_pipeline`).
- Coach pipeline **backward** moves clear later call flags **and** later checklist buckets.

---

## 5. Coach pipeline (columns vs student modules)

Coach column name = **last call completed**, not “next work”:

| Pipeline stage | Meaning                                               |
| -------------- | ----------------------------------------------------- |
| `not_started`  | No Discovery call yet                                 |
| `call_1`       | Discovery complete; student works LinkedIn            |
| `call_2`       | LinkedIn complete; student works Application Strategy |
| `call_3`       | Application complete; student works Interview Prep    |
| `call_4`       | Interview call complete                               |

**Forward move:** Completes calls through the target; may skip with confirm.  
**Backward move:** Target column is authoritative — **later call completions are cleared** (e.g. LinkedIn column clears Call 3 + Call 4). Confirm modal shows **intended stage** and **from** stage.

### Coach confirms (dropdown + mountain drag)

- **Payment** — unpaid Discovery → past Discovery
- **Skip** — jumping over an unmarked call
- **Same day** — advancing again after a call was marked complete today
- **Backward** — moving to an earlier column (clears later milestones)
- **Offered / Refund** — special terminals

Modal always shows **Intended stage** and **Moving from** so drag-drop destination is unambiguous.

### Manual payment

When payment is required, coach records plan / amount / date → `UserSubscription` **Active** → enrollment upgrades → move continues.

---

## 6. Progress, confetti, Offered

- Call milestone stars scale to **~90%** at Call 4 prep complete; **100% only on Offered**.
- **Follow the system** does not count toward %.
- Student confetti: call finish / full stage checklist — not every refresh or every task click.
- **I have an interview — ready to prep** is hidden once Call 4 is already marked complete.

---

## 7. Payments (unchanged product rules)

### Journey product picker

| Card                 | Plan id            | Coupon         |
| -------------------- | ------------------ | -------------- |
| LinkedIn Branding    | `unicoach_call_2`  | No             |
| Application Strategy | `unicoach_call_3`  | No             |
| Interview Mastery    | `unicoach_call_4`  | No             |
| Full System          | `unicoach_program` | Yes (optional) |

Partial coupons on Full System unlock through LinkedIn; remaining payment unlocks Application + Interview.

### Manual coach payment

`POST /api/unicoach/record-manual-payment/` → Active subscription, enrollment fulfill, then stage move.

### Account settings

- Discovery: Free discovery copy
- Active: subscribed; `payment_verified` shows processing only for Razorpay-in-flight

---

## 8. Engineering notes

| Store                                   | Purpose                                            |
| --------------------------------------- | -------------------------------------------------- |
| `UnicoachStudentData.enrollment_type`   | `vsl_discovery` / `paid_partial` / `paid_full`     |
| `UnicoachStudentData.calls_data`        | Call buckets + `pipeline_stage` + offered/refunded |
| `UnicoachStudentData.journey_checklist` | Stage tasks + gates                                |
| `UnicoachStudentData.module_data`       | Purchased modules + `execution_tracker`            |
| `UserSubscription`                      | Plan, amount, status, billing_history              |

**Core logic**

- `derive_ux_stage` — earliest module whose coach call is not done (capped by max unlock)
- `derive_max_unlocked_stage` — sidebar unlock from calls/checklist, clamped by payment
- `_resolve_pending_booking` — Book Call 2/3/4 ownership as in §3
- `apply_coach_pipeline_stage` — mountain target completes calls through N and **clears later**
- `normalize_calls_data` — heals split-brain when `pipeline_stage` disagrees with later `completed` flags
- `sync_journey_for_coach_calls` — forward auto-complete / backward clear checklists

**Key files**

- Backend: `unicoach_journey.py`, `unicoach_stage_schema.py`, `unicoach_coach_pipeline.py`, `unicoach_coach_moves.py`, `views.py`
- Frontend: `UnicoachJourney.tsx`, `UnicoachStageTasksCard.tsx`, `coach-pipeline-gates.ts`, `use-coach-pipeline-move-flow.ts`, `journey-mapper.ts`, `curriculum.tsx`

---

## 9. QA setup — create a Discovery test student (required)

QA missed this last time and could not test Discovery locks / Continue program. **Do this first.**

### Prerequisites

1. A normal **UserProfile** that can sign into the app (test email / Google).
2. At least one active **UniCoach** row (coach account that appears on the coach desk).

### Django Admin steps (must follow exactly)

1. Open Django Admin → **Unicoach student datas** (`UnicoachStudentData`).
2. **Add Unicoach student data** (or edit if the user already has a row):
   - **User** → select the test UserProfile
   - **Enrollment type** → **`VSL Discovery`** (value `vsl_discovery`)
     - **Do not leave this blank.** Blank/wrong type often looks like full access or broken journey.
   - **Unicoaches** → assign the coach you will use on the coach desk
   - Optional: **Program start date**
   - **Calls data** → leave empty / `{}` for Not started, or set Call 1 complete only if you need mid-funnel
   - **Journey checklist** → can start empty `{}`
3. Confirm there is **no Active / Payment verified Unicoach `UserSubscription`** for that user (unless you intentionally want paid access).
4. Sign in as the **student** → `/uniboard/unicoach`
   - Expect: Discovery unlocked; LinkedIn+ locked.
5. Sign in as the **coach** → coach desk
   - Expect: student visible under Not started / Discovery depending on `calls_data`.

### Optional mid-funnel seed

- Coach moves student to **Discovery call** only → Call 1 marked; still `vsl_discovery` until payment.
- For full-programme testing: record manual Full System payment (or Razorpay), then continue.

### If journey looks wrong

- Re-check **Enrollment type = VSL Discovery** on `UnicoachStudentData`.
- Re-check coach assignment on the M2M **Unicoaches**.
- Hard-refresh; coach moves persist in `calls_data.pipeline_stage`.

---

## 10. Fresh QA checklist (July 2026)

Replace prior checklists with this set.

### A. Admin / Discovery setup

- [ ] New row in **Unicoach student data** with **Enrollment type = VSL Discovery**
- [ ] Coach assigned; student appears on coach desk
- [ ] Student: only Discovery unlocked
- [ ] Discovery Continue program opens pricing (not Calendly Call 2)

### B. Full-paid LinkedIn + Book Call 2

- [ ] After full pay + Call 1 done: on LinkedIn with **no tasks checked**, **Book Call 2** is visible immediately
- [ ] Completing LinkedIn checklist does **not** require Book Call 2 to appear (it was already there)
- [ ] Completing LinkedIn checklist unlocks Application Strategy in sidebar (full pay) **without** lock
- [ ] Working stage stays LinkedIn until Call 2 marked; AS checklist not editable yet
- [ ] Book Call 3 does **not** appear on LinkedIn or on AS until Call 2 is marked

### C. Application Strategy + Book Call 3

- [ ] Coach marks Call 2 → working stage Application Strategy; AS checklist editable
- [ ] **Book Call 3** visible on AS immediately (checklist not required)
- [ ] Past LinkedIn module: completed tasks shown disabled as reference; hint points to finish call / checklist on current stage as appropriate

### D. Interview Prep

- [ ] AS checklist done → Interview can unlock in sidebar; Interview checklist disabled until Call 3 marked
- [ ] Hint on Interview while still on AS (checklist done, call not marked): finish call on Application Strategy
- [ ] After Call 3 marked: Interview checklist editable; Book Call 4 after tasks + interview-ready confirm
- [ ] After Call 4 marked: **I have an interview — ready to prep** hidden

### E. Coach backward / skip / same-day

- [ ] Mark Application complete, then dropdown/drag back to **LinkedIn branding** → Call 3/4 cleared; student not stuck on Interview as complete
- [ ] Confirm modal shows **Intended stage** + **Moving from**
- [ ] Skip confirm when jumping over an unmarked call
- [ ] Same-day confirm when advancing twice after a call marked today
- [ ] Refresh after backward move: student UX matches coach column

### F. Payments (smoke)

- [ ] Manual payment → Active sub + unlock
- [ ] Full System coupon → Razorpay discounted
- [ ] Module cards: no coupon; list price
- [ ] Partial: LinkedIn ok; AS needs remaining / Continue program

### G. Progress / polish

- [ ] Call 4 star near ~90%; 100% only when Offered
- [ ] Confetti not on every refresh
- [ ] Execution tracker under `module_data.execution_tracker`

---

## 11. Open / deferred

- Legacy CSV backfill of historical coach payments
- Soft-landing copy for older `payment_verified` manual test rows

---

_Last updated: 13 Jul 2026 — working stage vs unlock, Book Call 2/3/4 ownership, backward pipeline clear + heal, coach confirm destination labels, Call 4 @ ~90%, fresh QA setup for VSL Discovery._
