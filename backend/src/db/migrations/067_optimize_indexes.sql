-- 067_optimize_indexes.sql
-- High-Performance Composite Indexes for Multi-Tenant Certification Platform

-- 1. FIFO Wallet Deduction Index
CREATE INDEX IF NOT EXISTS idx_wallets_org_fifo ON sub_center_wallets (org_id, tokens_remaining, purchased_at);

-- 2. Token Transactions Audit History Index
CREATE INDEX IF NOT EXISTS idx_tx_org_created ON token_transactions (org_id, created_at DESC);

-- 3. Batch Auto-Close Job Index
CREATE INDEX IF NOT EXISTS idx_batches_status_closes ON batches (status, closes_at);

-- 4. Exam Assignment Status & Query Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_batch_status ON exam_assignments (batch_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_student_status ON exam_assignments (student_id, status);

-- 5. Exam Sitting Cutoff Monitoring Index
CREATE INDEX IF NOT EXISTS idx_attempts_ended_started ON exam_attempts (ended_at, started_at);
