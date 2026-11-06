# GSFIN Platform: Complete QA Manual Test Suite & Verification Guide

This document contains step-by-step test cases to manually verify all modules, features, workflows, and edge policies across the **GSFIN Multi-Tenant Certification Platform**.

---

## 1. System Setup & Environment Prerequisites

Ensure all three platform services are active before running tests:

| Service | Port | Endpoint / URL | Expected Status |
| :--- | :--- | :--- | :--- |
| **MySQL 8.0** | `3306` | `127.0.0.1:3306` | Active connections to `gsfin_db` (or `keftaportal` in local dev) |
| **Backend API** | `5002` | `http://127.0.0.1:5002/health` | Returns `{"status":"OK"}` |
| **Frontend App** | `3000` | `http://localhost:3000` | Nuxt 3 rendering homepage |

### Default Credentials
| Role | Portal Entrypoint | Email | Password | Scope & Organization |
| :--- | :--- | :--- | :--- | :--- |
| **Main Authority Admin** | `/login` $\rightarrow$ `/admin/multi-tenant` | `mainadmin@certification.org` | `Password123!` | Global Certification Authority (`main_admin`) |
| **Sub-Center Staff** | `/login` $\rightarrow$ `/sub-center` | `staff@apexcenter.com` | `Password123!` | Apex Testing Center (`org-apex-01`) |
| **Candidate / Student** | Direct Link: `/exam/take-[assignmentId]` | Direct link / No password required | Single-use secure token |

---

## 2. Module 1: Public Portal, Standards Showcase & Partner Inquiries

### TC-PUB-01: Public Landing Page & Global Standards Showcase
- **Module**: Public Website
- **URL**: `http://localhost:3000`
- **Steps**:
  1. Open `http://localhost:3000` in your web browser.
  2. Inspect the **Hero Banner**:
     - Verify fluid ambient background animation (`heroFluidPan`).
     - Check the dark-glass trust strip (*Global Recognition, Trusted Assessments, Industry Aligned, Worldwide Partner Network*).
  3. Scroll down to **"Globally Recognized Standards"**:
     - Verify the 8 standard certification cards (*Codex HACCP, ISO 22000, BRCGS, SQF, ISO 9001, etc.*).
  4. Click on any qualification card (e.g. *Codex HACCP*).
- **Expected Result**: 
  - Navigates smoothly to `/qualifications/[slug]`.
  - Displays qualification overview, target audience, examination structure, and competency frameworks without console errors.
- **Pass Criteria**: All cards load images, typography matches Apple SF Pro styling, no 404 or broken assets.

---

### TC-PUB-02: Partner Center Application ("Become a Partner")
- **Module**: Public Partner Inquiries
- **URL**: `http://localhost:3000` or `http://localhost:3000/become-a-partner`
- **Steps**:
  1. Click the **"Partner with GSFIN"** primary crimson button.
  2. In the modal / application form, fill in:
     - **Organization Name**: `Royal Food Safety Academy`
     - **Contact Person**: `Dr. Sarah Jenkins`
     - **Official Email**: `sarah@royalfoodsafety.co.uk`
     - **Phone / WhatsApp**: `+44 7911 123456`
     - **Country**: `United Kingdom`
     - **City**: `London`
     - **Accreditation Programs**: Select `ISO 22000` and `CODEX HACCP`.
  3. Click **"Submit Application"**.
- **Expected Result**: 
  - Form validates all required fields with inline feedback.
  - Success banner displays confirming submission.
  - The record is recorded in the administrative backend (`/dashboard/admin/inquiries`).

---

## 3. Module 2: Authentication & Role-Based Access Control (RBAC)

### TC-AUTH-01: Main Authority Admin Login & Route Guard
- **Module**: Identity & Authentication
- **URL**: `http://localhost:3000/login`
- **Steps**:
  1. Enter `mainadmin@certification.org` and `Password123!`.
  2. Click **"Sign In"**.
- **Expected Result**:
  - JWT token is issued and stored securely.
  - Automatically redirects to the Admin Dashboard (`/admin/multi-tenant`).
  - Top header displays "Authority Chief Administrator" and role "Main Administrator".

---

### TC-AUTH-02: Sub-Center Staff Login & Tenant Isolation
- **Module**: Identity & Multi-Tenancy
- **URL**: `http://localhost:3000/login`
- **Steps**:
  1. Log out from any active session.
  2. Enter `staff@apexcenter.com` and `Password123!`.
  3. Click **"Sign In"**.
- **Expected Result**:
  - Automatically loads the Sub-Center Workspace (`/sub-center`).
  - The interface displays the center name: **"Apex Testing Center"**.
  - All student rosters, batches, and token counts are scoped strictly to `org-apex-01`.
  - Manual entry of `/admin/multi-tenant` in the URL bar is blocked or redirected.

---

## 4. Module 3: Main Authority Portal (`/admin/multi-tenant`)

### TC-ADMIN-01: Real-Time Live Hub Batches Feed
- **Module**: Live Hub Oversight
- **URL**: `http://localhost:3000/admin/multi-tenant` (as Main Admin)
- **Steps**:
  1. Inspect the **Top Executive Metric Cards**:
     - *Partner Centers* (Indigo)
     - *Active Batches* (Emerald)
     - *Tokens Issued* (Amber)
     - *Tokens Consumed* (Red)
  2. Observe the **Live Partner Center Batches Feed**:
     - Check the green pulsing radar dot (`Live Hub`).
     - Test the search bar by typing a batch ID or exam name.
     - Test the status filter dropdown (*All Statuses*, *In Progress*, *Completed*).
  3. Click the refresh button in the table header.
- **Expected Result**: Metrics update without full-page reload. The table filters immediately.

---

### TC-ADMIN-02: Partner Center Onboarding
- **Module**: Partner Center Governance
- **URL**: `http://localhost:3000/admin/multi-tenant` $\rightarrow$ Click **"Partner Centers"** tab
- **Steps**:
  1. Click **"+ Onboard New Center"**.
  2. In the modal, fill in:
     - **Center Name**: `Zurich Food Safety Testing AG`
     - **Contact Email**: `admin@zurichtesting.ch`
     - **Contact Phone**: `+41 44 668 12 00`
     - **Country**: `Switzerland`
     - **City**: `Zurich`
     - **Programs**: Check `ISO 22000` and `BRCGS`.
  3. Click **"Register Partner Center"**.
- **Expected Result**:
  - Center is created with status `Active`.
  - Appears immediately in the partner centers table with 0 tokens and 0 batches.
  - Center profile can be opened to inspect staff and transaction history.

---

### TC-ADMIN-03: Suspend and Reactivate Partner Center
- **Module**: Partner Center Governance
- **Steps**:
  1. On the Partner Centers list, locate any active center.
  2. Click the orange **Suspend** icon button. Confirm the dialog prompt.
  3. Verify the status chip flips to `Suspended`.
  4. Click the green **Reactivate** icon button.
- **Expected Result**: Status updates immediately in the database and UI without page reload.

---

### TC-ADMIN-04: Exam Catalog Management & Attempt Caps
- **Module**: Exam Catalog
- **URL**: `http://localhost:3000/admin/multi-tenant` $\rightarrow$ Click **"Exam Catalog"** tab
- **Steps**:
  1. Click **"+ Add Exam"**.
  2. Enter:
     - **Exam Name**: `SQF Food Safety Quality Code 9.0 Auditor`
     - **Description**: `Global benchmark certification for SQF quality systems auditors.`
     - **Duration (Minutes)**: `60`
     - **Max Allowed Attempts**: `2`
     - **Status**: `Active`
  3. Click **"Save Exam"**.
- **Expected Result**:
  - The exam is added to the global catalog.
  - Sub-centers can immediately select this exam in their batch creation wizard.

---

### TC-ADMIN-05: Token Package Creation (Authority Store)
- **Module**: Token Economy
- **URL**: `http://localhost:3000/admin/multi-tenant` $\rightarrow$ Click **"Token Packages"** tab
- **Steps**:
  1. Click **"+ Create Package"**.
  2. Enter:
     - **Package Name**: `Quarterly Growth Tier (150 Tokens)`
     - **Token Count**: `150`
     - **Price (USD)**: `1350.00`
  3. Click **"Save Package"**.
- **Expected Result**: Package appears in the active catalog for all sub-centers to purchase.

---

### TC-ADMIN-06: Financial & Token Audit Trail
- **Module**: Double-Entry Audit Trail
- **URL**: `http://localhost:3000/admin/multi-tenant` $\rightarrow$ Click **"Audit Trail"** tab
- **Steps**:
  1. Inspect the transaction ledger table.
  2. Verify transaction types:
     - `purchase` (green chip, positive count)
     - `consume` (red chip, negative count)
     - `refund_edit_removal` (amber chip, positive count)
     - `refund_unused` (amber chip, positive count)
- **Expected Result**: Every token movement contains immutable timestamps, partner name, wallet ID, and associated batch ID.

---

## 5. Module 4: Sub-Center Workspace (`/sub-center`)

### TC-CENTER-01: Candidate Registration
- **Module**: Candidate Roster
- **URL**: `http://localhost:3000/sub-center?tab=students` (as Sub-Center Staff)
- **Steps**:
  1. Click **"+ Register Candidate"**.
  2. Enter:
     - **Full Name**: `Marcus Vance`
     - **Email Address**: `marcus.vance@example.com`
     - **Phone Number**: `+1 555-0199`
  3. Click **"Register Candidate"**.
- **Expected Result**:
  - Candidate is saved to the local roster.
  - The student record is strictly scoped to `org_id = org-apex-01`.

---

### TC-CENTER-02: Purchasing Token Packages (Wallet Top-Up)
- **Module**: Token Wallet
- **URL**: `http://localhost:3000/sub-center?tab=wallet`
- **Steps**:
  1. Note the current **Token Wallet Balance**.
  2. Under **Available Token Packages**, select any active package (e.g. `Starter Pack (50 Tokens)`).
  3. Click **"Purchase Package"**.
- **Expected Result**:
  - Success alert confirms purchase.
  - Token balance increments immediately by the package token count.
  - An entry is logged in the center's local transaction table.

---

### TC-CENTER-03: Batch Creation with FIFO Token Deduction
- **Module**: Batch Creation
- **URL**: `http://localhost:3000/sub-center?tab=batches`
- **Steps**:
  1. Click **"+ Create New Batch"**.
  2. In the Batch Creation Wizard:
     - **Select Exam**: Choose any active catalog exam (e.g., `Cybersecurity Fundamentals` or `SQF Food Safety`).
     - **Set Window**: Select start time and end time (e.g. 2 hours from current time).
     - **Select Candidates**: Check 2 registered candidates.
  3. Verify summary displays: `Tokens Required: 2`, `Available Balance: X`.
  4. Click **"Launch Batch & Deduct Tokens"**.
- **Expected Result**:
  - Batch is created with status `Open`.
  - Exactly 2 tokens are deducted FIFO from the oldest purchased package.
  - Wallet balance decrements by 2.

---

### TC-CENTER-04: Batch Edit Window (Student Removal & Refund)
- **Module**: Batch Edit Rules
- **Steps**:
  1. Locate the batch created in TC-CENTER-03 (ensure no candidate has started the exam).
  2. Click **"Manage Batch"**.
  3. Next to one of the candidates, click **"Remove Candidate"**. Confirm the prompt.
- **Expected Result**:
  - Candidate assignment is deleted from the batch.
  - Exactly **1 token is immediately refunded** back to the wallet (`refund_edit_removal`).
  - Wallet balance increments by 1.

---

### TC-CENTER-05: Batch Cancellation & Full Unstarted Token Refund
- **Module**: Batch Cancellation
- **Steps**:
  1. In the same batch view, click **"Cancel Entire Batch"**.
  2. Confirm the cancellation prompt.
- **Expected Result**:
  - Batch flips to `Cancelled`.
  - All remaining unstarted candidates' tokens are refunded 100% to the wallet (`refund_unused`).

---

## 6. Module 5: Candidate Exam Engine & Uniform Certification

### TC-EXAM-01: Candidate Pre-Flight Sitting Link
- **Module**: Exam Session Sitting
- **Steps**:
  1. As Sub-Center Staff, open an active batch and copy an unstarted candidate's exam link (format: `http://localhost:3000/exam/take-[assignmentId]`).
  2. Open the URL in an incognito window or separate browser.
- **Expected Result**:
  - Renders the pre-flight sitting screen.
  - Displays Candidate Name, Sub-Center Authority, Exam Name, Duration, and **Hard Cutoff Window ($1.25\times$)**.
  - Displays official exam guidelines and rules.

---

### TC-EXAM-02: Abnormal Disconnect & Automatic Technical Retry
- **Module**: Exam Session Resilience
- **Steps**:
  1. On the sitting screen, click **"Begin Certification Exam"**.
  2. Verify that the countdown timer begins.
  3. Click **"Simulate Disconnect (Tech Void)"** (or close the browser/simulate network drop).
- **Expected Result**:
  - System captures abnormal termination signal (`end_reason = "technical_void"`).
  - Because `attempts_used < max_attempts`, the assignment status resets to `not_started`.
  - Reloading the page offers Attempt #2 with **zero token penalty**.

---

### TC-EXAM-03: Exam Submission & Passing Grade
- **Module**: Exam Grading & Pass Flow
- **Steps**:
  1. Click **"Begin Certification Exam"** to launch Attempt #2.
  2. Select answers for questions.
  3. Click **"Submit Final Exam"**.
- **Expected Result**:
  - Submission records score $\ge$ passing threshold.
  - Assignment transitions to `passed`.
  - Congratulations screen displays score, pass verification, and a **"Download Official Certificate"** button.

---

### TC-EXAM-04: Uniform Certificate Inspection
- **Module**: Certificate Issuance
- **Steps**:
  1. Click **"Download Official Certificate"** (or view the generated PDF).
  2. Verify the visual layout:
     - Official Gold & Navy border styling.
     - Candidate's full name.
     - Qualification Standard title.
     - QR code for instant public verification.
     - **Verification**: Ensure **zero sub-center branding** appears on the certificate (maintaining uniform global standards).

---

## 7. Module 6: Retry Policies & Edge Cases

### TC-RETRY-01: Clean Failure (No Free Retry)
- **Module**: Attempt Governance
- **Steps**:
  1. Enroll a new student in a batch and start their exam sitting.
  2. Complete the exam with failing answers (score below passing grade).
- **Expected Result**:
  - Status transitions to `Failed`.
  - The student **does NOT receive an automatic free retry** (free retries apply only to technical interruptions).

---

### TC-RETRY-02: Manual Sub-Center Staff Retry Grant
- **Module**: Center Staff Override
- **Steps**:
  1. In the Sub-Center portal (`/sub-center?tab=batches`), open the batch containing the student who cleanly failed in TC-RETRY-01.
  2. Confirm attempts used is less than the exam cap (e.g. 1 of 2 used).
  3. Click **"Grant Technical Retry"** on the student's row.
- **Expected Result**:
  - Staff override authorizes a retry (`granted_by = "manual_subcenter"`).
  - Student can re-enter the link and take Attempt #2.

---

### TC-RETRY-03: Dedicated Single-Student Retry Link (Rule 8)
- **Module**: Genuine-Fail Re-Enrollment
- **Steps**:
  1. Have the student take Attempt #2 and fail again, exhausting their maximum attempts (2/2).
  2. In the Sub-Center portal, verify that "Grant Technical Retry" is now disabled.
  3. Click **"Create Dedicated Retry Link"**.
  4. Configure an expiration window (e.g. 48 hours). Click **Generate**.
- **Expected Result**:
  - Creates a new assignment row (`is_retry_link = true`) tied to the same batch.
  - **Deducts 1 new token** from the sub-center's wallet.
  - Generates a dedicated exam URL for the student with full reset attempts.

---

## 8. Module 7: AI Proctoring Review & Certificate Hold Gate

### TC-PROC-01: Client-Side Edge Proctoring Detection
- **Module**: Edge AI Proctoring
- **Steps**:
  1. Open an active exam sitting with proctoring enabled.
  2. Allow webcam permissions; verify the floating video thumbnail is active.
  3. Switch to another browser tab, or minimize the window.
- **Expected Result**:
  - An on-screen warning banner triggers: *"Warning: Tab switch detected. Exam violation logged."*
  - The client streams a `tab_switch` violation event to the backend.

---

### TC-PROC-02: Admin Review of Proctoring Incidents
- **Module**: Proctoring Governance
- **URL**: `http://localhost:3000/dashboard/admin/proctoring` (as Main Admin)
- **Steps**:
  1. Locate the candidate's sitting attempt in the proctoring review log.
  2. Click **"Inspect Violations"**.
  3. Review the timeline of events (`tab_switch`, `multiple_faces`, `camera_lost`) and captured violation screenshots.
  4. Test administrative action:
     - Click **"Flag Attempt"** to place certificate on hold.
     - Click **"Approve & Release Certificate"** to clear the hold.
- **Expected Result**: Status updates immediately and audit logs record the review decision.

---

## 9. Module 8: Public Certificate Verification

### TC-VERIFY-01: Public Authenticity Verification
- **Module**: Public Credential Verification
- **URL**: `http://localhost:3000/verify`
- **Steps**:
  1. Obtain the certificate number from TC-EXAM-03 (or copy the URL encoded in the PDF's QR code).
  2. Paste the certificate number into the search input and click **"Verify Credential"**.
- **Expected Result**:
  - Displays the verified credential badge.
  - Shows candidate name, qualification standard, issue date, and issuing authority seal.
  - Confirms status as `Active`.

---

### TC-VERIFY-02: Revoked Credential Handling
- **Module**: Certificate Revocation
- **Steps**:
  1. As Main Admin, go to `/dashboard/admin/certificates` and click **"Revoke"** on an active certificate.
  2. Return to `http://localhost:3000/verify` and search for that certificate number again.
- **Expected Result**:
  - System displays a red warning banner: *"This certificate was revoked by the International Standards Authority"*, displaying revocation date and reason.

---

## 10. Summary Checklist & Pass / Fail Sign-Off

| Test Case ID | Test Case Description | Status | Sign-off Notes |
| :--- | :--- | :---: | :--- |
| **TC-PUB-01** | Public Homepage & Qualifications Catalog | [ ] | |
| **TC-PUB-02** | Partner Application Form ("Become a Partner") | [ ] | |
| **TC-AUTH-01** | Main Authority Admin Login & Route Guards | [ ] | |
| **TC-AUTH-02** | Sub-Center Staff Login & Tenant Isolation | [ ] | |
| **TC-ADMIN-01** | Real-Time Live Hub Batches Feed & Filters | [ ] | |
| **TC-ADMIN-02** | Partner Center Onboarding & Jurisdiction | [ ] | |
| **TC-ADMIN-03** | Suspend / Reactivate Partner Center | [ ] | |
| **TC-ADMIN-04** | Exam Catalog CRUD & Max Attempt Caps | [ ] | |
| **TC-ADMIN-05** | Token Package Creation (Authority Store) | [ ] | |
| **TC-ADMIN-06** | Financial & Token Double-Entry Audit Trail | [ ] | |
| **TC-CENTER-01** | Scoped Candidate Registration | [ ] | |
| **TC-CENTER-02** | Sub-Center Token Package Purchase | [ ] | |
| **TC-CENTER-03** | Batch Creation with FIFO Token Deduction | [ ] | |
| **TC-CENTER-04** | Batch Edit Window (Student Removal & Refund)| [ ] | |
| **TC-CENTER-05** | Batch Cancellation & 100% Token Refund | [ ] | |
| **TC-EXAM-01** | Candidate Sitting Link & $1.25\times$ Cutoff | [ ] | |
| **TC-EXAM-02** | Abnormal Crash Disconnect & Auto-Retry Slot | [ ] | |
| **TC-EXAM-03** | Final Submission & Passing Grade Flow | [ ] | |
| **TC-EXAM-04** | Uniform PDF Certificate Generation (No Branding)| [ ] | |
| **TC-RETRY-01** | Clean Failure (No Free Retry Granted) | [ ] | |
| **TC-RETRY-02** | Manual Sub-Center Staff Retry Override | [ ] | |
| **TC-RETRY-03** | Dedicated Single-Student Retry Link (Rule 8) | [ ] | |
| **TC-PROC-01** | Edge AI Proctoring Tab Switch Detection | [ ] | |
| **TC-PROC-02** | Admin Proctoring Review & Hold/Release Gate | [ ] | |
| **TC-VERIFY-01** | Public Certificate Verification via QR / Serial | [ ] | |
| **TC-VERIFY-02** | Revoked Certificate Public Validation | [ ] | |
