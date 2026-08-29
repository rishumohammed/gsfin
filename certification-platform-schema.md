# Build prompt: multi-tenant certification platform (main company + sub-centers)

Use this as the working spec. Build against it directly — schema, business rules, and workflows are final for v1. Reuse the existing **security exam module** and **certificate module** as-is; everything below is the new layer that sits around them.

---

## 1. System overview

One main certification company operates as a certification **authority only** — it has no students of its own. All students belong to a **sub-center**. Sub-centers are the only place students register, and the only way students get into an exam is when a sub-center spends a **token** to enroll them, as part of a **batch**.

There is no admin-direct assignment path. There is no sub-center-authored exam content — every exam a sub-center runs comes from the main company's catalog, paid for via tokens.

```
Main company (certification authority, owns exam catalog, sells token packages)
   └── Sub-center A (own portal, own students, own token wallet)
   │      └── Batches → exam_assignments → shared exam engine → shared certificate module
   └── Sub-center B (own portal, own students, own token wallet)
          └── ...
```

---

## 2. Portals / roles

| Portal | Who | Can do |
|---|---|---|
| **Main admin panel** | Main company staff | Manage exam catalog, define `max_attempts` per exam, manage sub-center accounts, define/sell token packages, view real-time read-only dashboard of all sub-centers' batches, view reporting. Cannot assign students, cannot act on a sub-center's batch (no force-close/cancel). |
| **Sub-center portal** | Sub-center staff | Register students, purchase token packages, create/edit/cancel batches, manually grant retries, create dedicated single-student retry links, view own wallet/history. |
| **Shared exam engine** (existing module, reused) | Students | Take the exam. Needs to expose an "abnormal termination" signal (crash/disconnect) distinct from normal submit, and support a dynamic session-time extension (see §6.4). |
| **Shared certificate module** (existing module, reused) | System | Issues a certificate on pass. Identical template regardless of sub-center — no per-sub-center branding or attribution anywhere in the system (portal UI or certificate). |

---

## 3. Core entities / schema

### `organizations` (sub-centers only — main company is not a peer row)
```
id                  PK
name
contact_email
contact_phone
status              enum: active, suspended
created_at
```

### `students`
```
id                  PK
org_id              FK -> organizations.id   -- always a sub-center, never null
name
email
phone
created_at
```
Registration only happens through the owning sub-center's portal.

### `exams`
```
id                  PK
name
description
duration_minutes           -- total exam duration, used for the 25% cutoff calc
max_attempts                -- admin-set cap; sub-centers cannot override
status              enum: active, retired
```

### `token_packages` (catalog item main admin sells)
```
id                  PK
name
covers                      -- list of exam_ids or a category tag (bundle scope)
token_count
price
status              enum: active, retired
```

### `sub_center_wallets`
```
id                  PK
org_id              FK -> organizations.id
package_id          FK -> token_packages.id   -- which package this wallet's tokens came from
tokens_purchased
tokens_used
tokens_remaining     -- derived: tokens_purchased - tokens_used (or maintain directly, your call)
purchased_at
```
Tokens never expire. When multiple wallets/packages cover the same exam, draw oldest `purchased_at` first (FIFO).

### `token_transactions`
```
id                  PK
org_id              FK -> organizations.id
wallet_id           FK -> sub_center_wallets.id
type                enum: purchase, consume, refund_unused, refund_edit_removal
token_count         -- signed: negative for consume, positive for purchase/refund
related_batch_id    FK -> batches.id (nullable)
related_assignment_id FK -> exam_assignments.id (nullable)
created_at
```
Every token movement (purchase, batch consumption, batch-close refund, edit-window removal refund) gets a row here. This is the audit trail sub-centers and admin both read from.

### `batches`
```
id                  PK
org_id              FK -> organizations.id
exam_id             FK -> exams.id
created_by                   -- sub-center staff user id
status               enum: draft, open, closed, cancelled
opens_at
closes_at                    -- fixed time window; batch auto-closes here
created_at
```

### `exam_assignments`
```
id                  PK
student_id           FK -> students.id
exam_id              FK -> exams.id
batch_id             FK -> batches.id            -- always set, including for dedicated retry links (see §6.5)
wallet_id            FK -> sub_center_wallets.id  -- which wallet's token was spent
max_attempts          -- snapshotted from exams.max_attempts at creation time
attempts_used
status                enum: not_started, in_progress, passed, failed, expired
is_retry_link         boolean, default false      -- true if created via dedicated single-student link
retry_link_expires_at  nullable, only set if is_retry_link
notified_at
reminder_sent_at
created_at
```

### `exam_attempts` (one row per actual sitting, under an assignment)
```
id                  PK
assignment_id        FK -> exam_assignments.id
started_at
ended_at
end_reason            enum: submitted, technical_void, force_ended_cutoff
result                enum: pass, fail, null (null while in progress)
granted_by             enum: automatic, manual_subcenter, null   -- null for the first attempt
granted_by_user_id      nullable, set when granted_by = manual_subcenter
```
This is what lets both the automatic and manual retry paths write to the same `attempts_used` counter on the parent assignment without conflating *why* an attempt happened.

### `certificates` (reusing existing module — just documenting the link point)
```
id                  PK
assignment_id        FK -> exam_assignments.id
issued_at
-- template is uniform; no org_id-driven branding fields
```

---

## 4. Key relationships

```
organizations (sub-center) 1---* students
organizations (sub-center) 1---* sub_center_wallets
organizations (sub-center) 1---* batches
token_packages 1---* sub_center_wallets
batches 1---* exam_assignments
exam_assignments 1---* exam_attempts
exam_assignments 1---1 certificates (on pass)
sub_center_wallets 1---* token_transactions
```

---

## 5. Business rules to enforce at the application layer

1. **Registration**: students can only be created via a sub-center's own portal, scoped to `org_id = that sub-center`. No main-portal registration exists anywhere in the product.
2. **No admin-direct assignment**: the main admin panel has no "assign student to exam" action. Admin's only write actions are: manage exam catalog, manage sub-centers, manage token packages.
3. **No sub-center-authored exams**: sub-centers can only select from the main company's `exams` catalog when creating a batch. There is no exam-authoring UI in the sub-center portal.
4. **Batch creation**:
   - Sub-center selects one `exam_id` + a list/CSV of its own students.
   - System checks the relevant wallet(s) (FIFO by `purchased_at`) have enough combined `tokens_remaining` for the student count.
   - If insufficient: block submission, show shortfall, link to purchase more.
   - If sufficient: create `batches` row (`status = open`), one `exam_assignment` per student (snapshot `max_attempts` from the exam), one `token_transactions` (`type = consume`) row per token spent, decrement wallet(s), queue notification job.
5. **Edit window**: while `batches.status = open` and no assignment in that batch has `status != not_started`, sub-center can edit the batch (add/remove students) or cancel it entirely.
   - Removing a student before they start: immediately create a `refund_edit_removal` transaction, increment the wallet back, delete/void that assignment.
   - Cancelling the whole batch: refund every still-`not_started` assignment's token the same way, set `batches.status = cancelled`.
6. **Batch auto-close** (scheduled job watching `closes_at`):
   - For every assignment still `not_started`: refund token instantly (`refund_unused` transaction), mark assignment `expired`.
   - For every assignment `in_progress`: leave it running. Batch itself flips to `closed` (no new starts allowed), but these assignments resolve independently — do not block batch closure on them.
   - In-progress sessions get a hard outer cutoff of **exam duration × 1.25** from their own `started_at`; the exam engine force-ends the session at that point (`end_reason = force_ended_cutoff`) if the student still hasn't submitted. This cutoff applies only to the automatic batch-close case.
7. **Retry on technical issue** (both modes write to the same `exam_attempts` / `attempts_used`):
   - **Automatic**: exam engine reports abnormal termination (`end_reason = technical_void`) → system auto-creates a new `exam_attempts` row (`granted_by = automatic`) as long as `attempts_used < max_attempts`.
   - **Manual**: sub-center staff, from the batch/assignment view, can flag "grant retry" any time `attempts_used < max_attempts` → new `exam_attempts` row (`granted_by = manual_subcenter`, `granted_by_user_id` set). Available as a fallback alongside automatic detection at all times — not a batch-level mode toggle.
   - Neither mode can push `attempts_used` past the admin-set `max_attempts`. A normal `completed_fail` result closes the assignment (`status = failed`) and does **not** consume another attempt slot — retries are for interruptions, not re-tries after a clean fail.
8. **Genuine-fail re-enrollment (dedicated retry link)**: once an assignment is `failed` (attempts exhausted, no technical issue), the sub-center can generate a single-student exam link for that student:
   - Belongs to the original `batch_id` — creates a new `exam_assignments` row (`is_retry_link = true`) tied to that same batch, not a standalone record.
   - Consumes one token, same as any assignment.
   - Gets the same `max_attempts` as a normal assignment (not capped to 1).
   - `retry_link_expires_at` is set per-link, configurable by the sub-center at creation time; if unused past that timestamp, expire it (and refund the token, consistent with rule 6).
9. **Certificates**: identical template for every path (batch, technical retry, dedicated retry link). No field anywhere carries sub-center identity into the certificate.
10. **Notifications**: on assignment creation, send immediately (email/SMS). Send a second reminder notification closer to the exam/session time (exact lead time is a config value, not hardcoded).
11. **Admin dashboard**: real-time, read-only view across all sub-centers' batches (status, student counts, token usage). No write actions from this view — implement as a live feed/subscription (websocket, SSE, or polling short enough to feel real-time), not a page requiring manual refresh.
12. **No sub-center branding**: portal UI, emails, and certificates are visually identical across all sub-centers. Don't build any per-org theming fields.

---

## 6. Integration points with the existing (reused) modules

- **Exam engine**: needs to expose (a) an event/webhook for abnormal session termination distinct from normal submit, and (b) support for a per-session dynamic time extension (the 25% cutoff). Confirm both exist before relying on them — this is the main technical risk in reusing the module as-is.
- **Certificate module**: needs a hook that fires on `exam_assignments.status = passed`, passing `student_id` + `exam_id`. No template changes needed since output is uniform.

---

## 7. Suggested build order

1. `organizations`, `students`, sub-center auth/portal shell, self-registration.
2. `exams`, `token_packages`, `sub_center_wallets`, `token_transactions` — admin catalog + sub-center purchase flow.
3. `batches` + `exam_assignments` creation flow (batch creation, token deduction, edit window, cancel).
4. Wire into existing exam engine for session start/attempt tracking (`exam_attempts`).
5. Auto-close scheduled job (refunds, in-progress carve-out, 25% cutoff).
6. Automatic + manual retry paths.
7. Dedicated single-student retry link.
8. Wire into existing certificate module.
9. Notifications (assignment + reminder).
10. Main admin real-time read-only dashboard.
