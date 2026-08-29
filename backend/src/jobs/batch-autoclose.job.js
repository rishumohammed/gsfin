import cron from 'node-cron';
import { pool } from '../db/connection.js';
import { WalletService } from '../services/wallet.service.js';
import { ExamSessionService } from '../services/exam-session.service.js';

export function initBatchAutocloseJob() {
  // Run every 1 minute
  cron.schedule('* * * * *', async () => {
    try {
      await processExpiredBatches();
      await processExpiredRetryLinks();
      await enforceDurationCutoffs();
    } catch (err) {
      console.error('[BatchAutocloseJob] Error during execution:', err);
    }
  });
}

/**
 * 1. Process batches whose closes_at window has passed
 */
async function processExpiredBatches() {
  const connection = await pool.getConnection();
  try {
    const [batches] = await connection.query(
      `SELECT b.id, b.org_id 
       FROM batches b 
       WHERE b.status = 'open' AND b.closes_at IS NOT NULL AND b.closes_at <= NOW()`
    );

    for (const batch of batches) {
      await connection.beginTransaction();

      // Expire and refund all not_started assignments in this batch
      const [unstarted] = await connection.query(
        `SELECT ea.id, ea.wallet_id 
         FROM exam_assignments ea
         JOIN students s ON ea.student_id = s.id
         WHERE ea.batch_id = ? AND ea.status = 'not_started'`,
        [batch.id]
      );

      for (const assign of unstarted) {
        await WalletService.refundTokens(connection, {
          orgId: batch.org_id,
          walletId: assign.wallet_id,
          amount: 1,
          type: 'refund_unused',
          batchId: batch.id,
          assignmentId: assign.id
        });

        await connection.query(
          `UPDATE exam_assignments SET status = 'expired' WHERE id = ?`,
          [assign.id]
        );
      }

      // Flip batch status to closed (in_progress assignments continue running)
      await connection.query(
        `UPDATE batches SET status = 'closed' WHERE id = ?`,
        [batch.id]
      );

      await connection.commit();
    }
  } catch (err) {
    await connection.rollback();
    console.error('[processExpiredBatches] Error:', err);
  } finally {
    connection.release();
  }
}

/**
 * 2. Process expired single-student retry links
 */
async function processExpiredRetryLinks() {
  const connection = await pool.getConnection();
  try {
    const [expiredLinks] = await connection.query(
      `SELECT ea.id, ea.wallet_id, ea.batch_id, s.org_id
       FROM exam_assignments ea
       JOIN students s ON ea.student_id = s.id
       WHERE ea.is_retry_link = TRUE 
         AND ea.status = 'not_started' 
         AND ea.retry_link_expires_at IS NOT NULL 
         AND ea.retry_link_expires_at <= NOW()`
    );

    for (const link of expiredLinks) {
      await connection.beginTransaction();

      await WalletService.refundTokens(connection, {
        orgId: link.org_id,
        walletId: link.wallet_id,
        amount: 1,
        type: 'refund_unused',
        batchId: link.batch_id,
        assignmentId: link.id
      });

      await connection.query(
        `UPDATE exam_assignments SET status = 'expired' WHERE id = ?`,
        [link.id]
      );

      await connection.commit();
    }
  } catch (err) {
    await connection.rollback();
    console.error('[processExpiredRetryLinks] Error:', err);
  } finally {
    connection.release();
  }
}

/**
 * 3. Enforce 1.25x duration hard outer cutoff for active sittings
 */
async function enforceDurationCutoffs() {
  try {
    const [overdueSittings] = await pool.query(
      `SELECT att.id as attempt_id, att.started_at, e.duration_minutes
       FROM exam_attempts att
       JOIN exam_assignments ea ON att.assignment_id = ea.id
       JOIN exams e ON ea.exam_id = e.id
       WHERE att.ended_at IS NULL 
         AND TIMESTAMPDIFF(MINUTE, att.started_at, NOW()) >= (e.duration_minutes * 1.25)`
    );

    for (const sitting of overdueSittings) {
      await ExamSessionService.endSitting({
        attemptId: sitting.attempt_id,
        endReason: 'force_ended_cutoff',
        score: 0,
        percentage: 0,
        passed: false
      });
      console.log(`[enforceDurationCutoffs] Force-ended attempt ${sitting.attempt_id} due to 1.25x time cutoff.`);
    }
  } catch (err) {
    console.error('[enforceDurationCutoffs] Error:', err);
  }
}
