import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { WalletService } from './wallet.service.js';

export class BatchService {
  /**
   * Create a new batch with student assignments and FIFO token deduction
   */
  static async createBatch({ orgId, examId, createdBy, studentIds, opensAt = null, closesAt = null }) {
    if (!studentIds || studentIds.length === 0) {
      throw new Error('At least one student is required to create a batch.');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Fetch Exam & snapshot max_attempts
      const [exams] = await connection.query(
        `SELECT id, name, max_attempts, status FROM exams WHERE id = ?`,
        [examId]
      );
      if (exams.length === 0 || exams[0].status !== 'active') {
        throw new Error('Exam not found or is currently retired.');
      }
      const exam = exams[0];

      // 2. Validate students belong to this sub-center
      const [students] = await connection.query(
        `SELECT id FROM students WHERE org_id = ? AND id IN (?)`,
        [orgId, studentIds]
      );
      if (students.length !== studentIds.length) {
        throw new Error('One or more selected students do not belong to your organization.');
      }

      // 3. Deduct tokens FIFO
      const totalTokensNeeded = studentIds.length;
      const batchId = uuidv4();

      const deductions = await WalletService.deductTokensFIFO(connection, {
        orgId,
        count: totalTokensNeeded,
        batchId
      });

      // 4. Create Batch record
      await connection.query(
        `INSERT INTO batches (id, org_id, exam_id, created_by, status, opens_at, closes_at)
         VALUES (?, ?, ?, ?, 'open', ?, ?)`,
        [batchId, orgId, examId, createdBy, opensAt, closesAt]
      );

      // 5. Create Exam Assignments mapping wallet_ids from deductions
      let deductionIdx = 0;
      let walletRemainingForCurrentChunk = deductions[0].amount;
      const assignmentIds = [];

      for (const studentId of studentIds) {
        if (walletRemainingForCurrentChunk === 0 && deductionIdx < deductions.length - 1) {
          deductionIdx++;
          walletRemainingForCurrentChunk = deductions[deductionIdx].amount;
        }

        const walletId = deductions[deductionIdx].walletId;
        walletRemainingForCurrentChunk--;

        const assignmentId = uuidv4();
        await connection.query(
          `INSERT INTO exam_assignments 
           (id, student_id, exam_id, batch_id, wallet_id, max_attempts, attempts_used, status)
           VALUES (?, ?, ?, ?, ?, ?, 0, 'not_started')`,
          [assignmentId, studentId, examId, batchId, walletId, exam.max_attempts]
        );
        assignmentIds.push(assignmentId);
      }

      await connection.commit();
      return { batchId, studentCount: studentIds.length, assignmentIds };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Edit open batch (add or remove students before any exam has started)
   */
  static async editBatch({ orgId, batchId, addStudentIds = [], removeStudentIds = [] }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Fetch batch and verify ownership & status
      const [batches] = await connection.query(
        `SELECT b.*, e.max_attempts 
         FROM batches b 
         JOIN exams e ON b.exam_id = e.id
         WHERE b.id = ? AND b.org_id = ? FOR UPDATE`,
        [batchId, orgId]
      );
      if (batches.length === 0) throw new Error('Batch not found.');
      const batch = batches[0];

      if (batch.status !== 'open') {
        throw new Error('Batch can only be edited while status is open.');
      }

      // Check if any assignment in batch has started
      const [started] = await connection.query(
        `SELECT COUNT(*) as cnt FROM exam_assignments WHERE batch_id = ? AND status != 'not_started'`,
        [batchId]
      );
      if (started[0].cnt > 0) {
        throw new Error('Cannot edit batch once a student has started an exam sitting.');
      }

      // 2. Process removals
      if (removeStudentIds.length > 0) {
        const [assignmentsToRemove] = await connection.query(
          `SELECT id, student_id, wallet_id FROM exam_assignments 
           WHERE batch_id = ? AND student_id IN (?) AND status = 'not_started'`,
          [batchId, removeStudentIds]
        );

        for (const assign of assignmentsToRemove) {
          await WalletService.refundTokens(connection, {
            orgId,
            walletId: assign.wallet_id,
            amount: 1,
            type: 'refund_edit_removal',
            batchId,
            assignmentId: assign.id
          });

          await connection.query(`DELETE FROM exam_assignments WHERE id = ?`, [assign.id]);
        }
      }

      // 3. Process additions
      if (addStudentIds.length > 0) {
        const deductions = await WalletService.deductTokensFIFO(connection, {
          orgId,
          count: addStudentIds.length,
          batchId
        });

        let deductionIdx = 0;
        let walletRemaining = deductions[0].amount;

        for (const studentId of addStudentIds) {
          if (walletRemaining === 0 && deductionIdx < deductions.length - 1) {
            deductionIdx++;
            walletRemaining = deductions[deductionIdx].amount;
          }

          const walletId = deductions[deductionIdx].walletId;
          walletRemaining--;

          const assignmentId = uuidv4();
          await connection.query(
            `INSERT INTO exam_assignments 
             (id, student_id, exam_id, batch_id, wallet_id, max_attempts, attempts_used, status)
             VALUES (?, ?, ?, ?, ?, ?, 0, 'not_started')`,
            [assignmentId, studentId, batch.exam_id, batchId, walletId, batch.max_attempts]
          );
        }
      }

      await connection.commit();
      return { success: true, added: addStudentIds.length, removed: removeStudentIds.length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cancel an entire batch (refunds all unstarted tokens)
   */
  static async cancelBatch({ orgId, batchId }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [batches] = await connection.query(
        `SELECT * FROM batches WHERE id = ? AND org_id = ? FOR UPDATE`,
        [batchId, orgId]
      );
      if (batches.length === 0) throw new Error('Batch not found.');
      const batch = batches[0];

      if (batch.status === 'cancelled') {
        throw new Error('Batch is already cancelled.');
      }

      const [unstartedAssignments] = await connection.query(
        `SELECT id, wallet_id FROM exam_assignments WHERE batch_id = ? AND status = 'not_started'`,
        [batchId]
      );

      for (const assign of unstartedAssignments) {
        await WalletService.refundTokens(connection, {
          orgId,
          walletId: assign.wallet_id,
          amount: 1,
          type: 'refund_edit_removal',
          batchId,
          assignmentId: assign.id
        });

        await connection.query(
          `UPDATE exam_assignments SET status = 'expired' WHERE id = ?`,
          [assign.id]
        );
      }

      await connection.query(`UPDATE batches SET status = 'cancelled' WHERE id = ?`, [batchId]);

      await connection.commit();
      return { success: true, refundedCount: unstartedAssignments.length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Create dedicated single-student retry link for a failed assignment (Rule 8)
   */
  static async createDedicatedRetryLink({ orgId, originalAssignmentId, expiresAt = null }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [assignments] = await connection.query(
        `SELECT ea.*, s.org_id, e.max_attempts as exam_max_attempts
         FROM exam_assignments ea
         JOIN students s ON ea.student_id = s.id
         JOIN exams e ON ea.exam_id = e.id
         WHERE ea.id = ? AND s.org_id = ? FOR UPDATE`,
        [originalAssignmentId, orgId]
      );

      if (assignments.length === 0) throw new Error('Original assignment not found.');
      const orig = assignments[0];

      if (orig.status !== 'failed') {
        throw new Error('Dedicated retry link can only be generated for failed assignments.');
      }

      // Deduct 1 token FIFO
      const newAssignmentId = uuidv4();
      const deductions = await WalletService.deductTokensFIFO(connection, {
        orgId,
        count: 1,
        batchId: orig.batch_id,
        assignmentId: newAssignmentId
      });

      const walletId = deductions[0].walletId;

      await connection.query(
        `INSERT INTO exam_assignments 
         (id, student_id, exam_id, batch_id, wallet_id, max_attempts, attempts_used, status, is_retry_link, retry_link_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, 'not_started', TRUE, ?)`,
        [newAssignmentId, orig.student_id, orig.exam_id, orig.batch_id, walletId, orig.exam_max_attempts, expiresAt]
      );

      await connection.commit();
      return { retryAssignmentId: newAssignmentId, studentId: orig.student_id };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
