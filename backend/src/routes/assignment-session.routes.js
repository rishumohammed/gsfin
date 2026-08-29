import express from 'express';
import { pool } from '../db/connection.js';
import { ExamSessionService } from '../services/exam-session.service.js';

const router = express.Router();

// ─── 1. Get Assignment Details for Exam Taker ─────────────────────────────

router.get('/:assignmentId/details', async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const [assignments] = await pool.query(
      `SELECT ea.*, e.name as exam_name, e.description as exam_description, 
              e.duration_minutes, s.name as student_name, s.email as student_email,
              b.opens_at, b.closes_at, o.name as org_name, c.pdf_url as certificate_url
       FROM exam_assignments ea
       JOIN exams e ON ea.exam_id = e.id
       JOIN students s ON ea.student_id = s.id
       JOIN batches b ON ea.batch_id = b.id
       JOIN organizations o ON s.org_id = o.id
       LEFT JOIN certificates c ON ea.id = c.assignment_id
       WHERE ea.id = ?`,
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ message: 'Exam assignment link not found or invalid.' });
    }

    const assign = assignments[0];
    const maxCutoffMinutes = assign.duration_minutes * 1.25;

    res.json({
      assignmentId: assign.id,
      studentName: assign.student_name,
      studentEmail: assign.student_email,
      organizationName: assign.org_name,
      examName: assign.exam_name,
      examDescription: assign.exam_description,
      durationMinutes: assign.duration_minutes,
      maxCutoffMinutes,
      maxAttempts: assign.max_attempts,
      attemptsUsed: assign.attempts_used,
      status: assign.status,
      opensAt: assign.opens_at,
      closesAt: assign.closes_at,
      isRetryLink: !!assign.is_retry_link,
      retryLinkExpiresAt: assign.retry_link_expires_at,
      certificateUrl: assign.certificate_url
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 2. Start Exam Sitting ──────────────────────────────────────────────────

router.post('/:assignmentId/start', async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const session = await ExamSessionService.startSitting({ assignmentId });
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── 3. Expose Abnormal Session Termination Signal (Crash / Disconnect) ────

router.post('/:assignmentId/abnormal-terminate', async (req, res) => {
  const { attempt_id } = req.body;
  if (!attempt_id) {
    return res.status(400).json({ message: 'Attempt ID is required for abnormal termination signal.' });
  }

  try {
    const result = await ExamSessionService.endSitting({
      attemptId: attempt_id,
      endReason: 'technical_void',
      score: 0,
      percentage: 0,
      passed: false
    });

    res.json({
      message: 'Abnormal termination recorded. Attempt voided for technical issue.',
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── 4. Normal Submit Exam Sitting ─────────────────────────────────────────

router.post('/:assignmentId/submit', async (req, res) => {
  const { attempt_id, score = 0, percentage = 0, passed = false } = req.body;
  if (!attempt_id) {
    return res.status(400).json({ message: 'Attempt ID is required to submit exam.' });
  }

  try {
    const result = await ExamSessionService.endSitting({
      attemptId: attempt_id,
      endReason: 'submitted',
      score: Number(score),
      percentage: Number(percentage),
      passed: Boolean(passed)
    });

    res.json({
      message: passed ? 'Exam passed! Certificate issued.' : 'Exam completed.',
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
