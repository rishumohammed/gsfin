import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/connection.js';
import { ExamSessionService } from '../services/exam-session.service.js';
import emailService from '../services/email.service.js';
import proctoringService from '../services/proctoring.service.js';

const router = express.Router();

// ─── 1. Get Assignment Details for Exam Taker ─────────────────────────────

router.get('/:assignmentId/details', async (req, res) => {
  const { assignmentId } = req.params;
  try {
    let assignments = [];
    try {
      [assignments] = await pool.query(
        `SELECT ea.*, 
                COALESCE(e.name, pe.name, 'Certification Exam') as exam_name, 
                COALESCE(e.description, pe.description, 'GSFIN Standard Certification Examination') as exam_description, 
                COALESCE(e.duration_minutes, 60) as duration_minutes, 
                COALESCE(b.enable_certificate, e.enable_certificate, pe.enable_certificate, 1) as enable_certificate,
                COALESCE(b.enable_proctoring, e.enable_proctoring, pe.enable_proctoring, 0) as enable_proctoring,
                s.id as student_id, s.name as student_name, s.email as student_email,
                s.face_photo, s.face_descriptor,
                b.opens_at, b.closes_at, o.name as org_name, c.pdf_url as certificate_url,
                COALESCE(c.cert_number, CONCAT('GSFIN-', UPPER(SUBSTRING(c.id, 1, 8)))) as certificate_number
         FROM exam_assignments ea
         JOIN students s ON ea.student_id = s.id
         JOIN batches b ON ea.batch_id = b.id
         JOIN organizations o ON s.org_id = o.id
         LEFT JOIN exams e ON ea.exam_id = e.id
         LEFT JOIN public_exams pe ON ea.exam_id = pe.id
         LEFT JOIN certificates c ON ea.id = c.assignment_id
         WHERE ea.id = ?`,
        [assignmentId]
      );
    } catch (_) {
      // Fallback if enable_proctoring column is not yet present on batches or exams
      [assignments] = await pool.query(
        `SELECT ea.*, 
                COALESCE(e.name, pe.name, 'Certification Exam') as exam_name, 
                COALESCE(e.description, pe.description, 'GSFIN Standard Certification Examination') as exam_description, 
                COALESCE(e.duration_minutes, 60) as duration_minutes, 
                COALESCE(b.enable_certificate, e.enable_certificate, pe.enable_certificate, 1) as enable_certificate,
                COALESCE(pe.enable_proctoring, 0) as enable_proctoring,
                s.id as student_id, s.name as student_name, s.email as student_email,
                s.face_photo, s.face_descriptor,
                b.opens_at, b.closes_at, o.name as org_name, c.pdf_url as certificate_url,
                COALESCE(c.cert_number, CONCAT('GSFIN-', UPPER(SUBSTRING(c.id, 1, 8)))) as certificate_number
         FROM exam_assignments ea
         JOIN students s ON ea.student_id = s.id
         JOIN batches b ON ea.batch_id = b.id
         JOIN organizations o ON s.org_id = o.id
         LEFT JOIN exams e ON ea.exam_id = e.id
         LEFT JOIN public_exams pe ON ea.exam_id = pe.id
         LEFT JOIN certificates c ON ea.id = c.assignment_id
         WHERE ea.id = ?`,
        [assignmentId]
      );
    }

    if (assignments.length === 0) {
      return res.status(404).json({ message: 'Exam assignment link not found or invalid.' });
    }

    const assign = assignments[0];
    const maxCutoffMinutes = assign.duration_minutes * 1.25;

    res.json({
      assignmentId: assign.id,
      studentId: assign.student_id,
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
      enableCertificate: assign.enable_certificate !== false && assign.enable_certificate !== 0 && assign.enable_certificate !== '0',
      enableProctoring: assign.enable_proctoring !== false && assign.enable_proctoring !== 0 && assign.enable_proctoring !== '0' && assign.enable_proctoring !== null,
      certificateUrl: assign.certificate_url,
      hasFaceEnrolled: !!assign.face_photo,
      facePhoto: assign.face_photo || null,
      faceDescriptor: assign.face_descriptor || null,
      isAuthenticated: !!assign.is_authenticated,
      isFaceVerified: !!assign.face_verified
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 1B. Send Candidate Verification OTP ─────────────────────────────────────

router.post('/:assignmentId/send-otp', async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.email, o.name as org_name, e.name as exam_name
       FROM exam_assignments ea
       JOIN students s ON ea.student_id = s.id
       JOIN organizations o ON s.org_id = o.id
       JOIN exams e ON ea.exam_id = e.id
       WHERE ea.id = ?`,
      [assignmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Exam assignment not found.' });
    }
    const student = rows[0];
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await pool.query(
      `UPDATE students SET otp_code = ?, otp_expires_at = ? WHERE id = ?`,
      [otpCode, otpExpiresAt, student.id]
    );

    // Send OTP email
    try {
      const subject = `Your Exam Verification OTP: ${otpCode} - GSFIN Accreditation`;
      const html = `
        <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="border-bottom: 2px solid #e31b23; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #0f172a; font-size: 18px;">GSFIN Examination Security Verification</h2>
          </div>
          <p style="color: #334155; font-size: 14px;">Hello <strong>${student.name}</strong>,</p>
          <p style="color: #475569; font-size: 13px; line-height: 1.5;">
            You requested an authentication OTP to begin your proctored sitting for <strong>${student.exam_name}</strong>.
          </p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-size: 12px; color: #991b1b; display: block; font-weight: 600; text-transform: uppercase;">One-Time Security Verification Code</span>
            <div style="font-size: 32px; font-weight: 700; color: #e31b23; letter-spacing: 8px; margin-top: 8px; font-family: monospace;">${otpCode}</div>
            <span style="font-size: 11px; color: #b91c1c; display: block; margin-top: 6px;">Valid for 15 minutes. Do not share this code with anyone.</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">GSFIN Certifying Authority &bull; Proctoring &amp; Assessment Security</p>
        </div>
      `;
      await emailService.sendEmail({ to: student.email, subject, html });
    } catch (e) {
      console.error('OTP email error (non-fatal):', e.message);
    }

    res.json({ success: true, message: `Verification code sent to ${student.email}.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 1C. Verify Candidate Credentials & OTP ──────────────────────────────────

router.post('/:assignmentId/verify-login', async (req, res) => {
  const { assignmentId } = req.params;
  const { password, otp } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.email, s.password, s.initial_password, s.otp_code, s.otp_expires_at, s.face_photo, s.face_descriptor
       FROM exam_assignments ea
       JOIN students s ON ea.student_id = s.id
       WHERE ea.id = ?`,
      [assignmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Exam assignment not found.' });
    }
    const student = rows[0];

    let passwordValid = false;
    if (password && password.trim()) {
      if (student.initial_password && student.initial_password === password.trim()) {
        passwordValid = true;
      } else if (student.password) {
        passwordValid = await bcrypt.compare(password.trim(), student.password);
      }
    }

    let otpValid = false;
    if (otp && otp.trim() && student.otp_code) {
      const isExpired = student.otp_expires_at && new Date() > new Date(student.otp_expires_at);
      if (!isExpired && student.otp_code.trim() === otp.trim()) {
        otpValid = true;
      }
    }

    if (!passwordValid && !otpValid) {
      return res.status(401).json({
        message: 'Invalid password or verification OTP code. Please check your credentials.'
      });
    }

    // Mark assignment as authenticated
    try {
      await pool.query(
        `UPDATE exam_assignments SET is_authenticated = 1 WHERE id = ?`,
        [assignmentId]
      );
    } catch (e) {}

    res.json({
      success: true,
      authenticated: true,
      studentName: student.name,
      studentEmail: student.email,
      hasFaceEnrolled: !!student.face_photo,
      facePhoto: student.face_photo || null,
      faceDescriptor: student.face_descriptor || null,
      message: 'Candidate credentials successfully verified.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 1D. Verify Candidate Live Face Biometrics ───────────────────────────────

router.post('/:assignmentId/verify-face', async (req, res) => {
  const { assignmentId } = req.params;
  const { live_photo, live_descriptor } = req.body;

  if (!live_photo && !live_descriptor) {
    return res.status(400).json({ message: 'Live face capture data is required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.face_photo, s.face_descriptor
       FROM exam_assignments ea
       JOIN students s ON ea.student_id = s.id
       WHERE ea.id = ?`,
      [assignmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Exam assignment not found.' });
    }
    const student = rows[0];

    let matched = true;
    let confidence = 98;

    // If student already had face descriptor enrolled, compare Euclidean distance
    if (student.face_descriptor && live_descriptor) {
      try {
        const refVec = typeof student.face_descriptor === 'string' ? JSON.parse(student.face_descriptor) : student.face_descriptor;
        const liveVec = typeof live_descriptor === 'string' ? JSON.parse(live_descriptor) : live_descriptor;
        if (Array.isArray(refVec) && Array.isArray(liveVec) && refVec.length === liveVec.length) {
          let sumSq = 0;
          for (let i = 0; i < refVec.length; i++) {
            sumSq += Math.pow(refVec[i] - liveVec[i], 2);
          }
          const dist = Math.sqrt(sumSq);
          confidence = Math.max(70, Math.min(99, Math.round((1 - Math.min(1, dist / 0.8)) * 100)));
          if (dist > 0.60) {
            matched = false;
          }
        }
      } catch (distErr) {
        console.warn('Descriptor distance calc error:', distErr);
      }
    } else if (live_photo) {
      // First-time face enrollment during sitting gate!
      await pool.query(
        `UPDATE students SET face_photo = ?, face_descriptor = ? WHERE id = ?`,
        [live_photo, live_descriptor ? (typeof live_descriptor === 'string' ? live_descriptor : JSON.stringify(live_descriptor)) : null, student.id]
      );
    }

    if (!matched) {
      return res.status(400).json({
        matched: false,
        confidence,
        message: 'Facial biometric mismatch detected. Please adjust lighting and face the camera directly.'
      });
    }

    try {
      await pool.query(
        `UPDATE exam_assignments SET face_verified = 1 WHERE id = ?`,
        [assignmentId]
      );

      // Also ensure latest attempt has this reference selfie photo
      if (live_photo) {
        await pool.query(
          `UPDATE exam_attempts 
           SET reference_selfie_url = COALESCE(reference_selfie_url, ?)
           WHERE assignment_id = ?
           ORDER BY started_at DESC LIMIT 1`,
          [live_photo, assignmentId]
        );
      }
    } catch (e) {}

    res.json({
      success: true,
      matched: true,
      confidence,
      message: 'Biometric identity verification confirmed.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 1C. Record Proctoring Event (Tab Switch, Fullscreen Exit, Blur, Camera) ──

router.post('/:assignmentId/proctoring-event', async (req, res) => {
  const { assignmentId } = req.params;
  const { attempt_id, type, reason, metadata } = req.body;
  if (!attempt_id || !type) {
    return res.status(400).json({ message: 'attempt_id and type are required' });
  }

  try {
    const event = await proctoringService.logEvent(attempt_id, type, {
      reason,
      assignmentId,
      timestamp: new Date().toISOString(),
      ...(metadata || {})
    });
    res.status(201).json(event);
  } catch (err) {
    console.warn('Proctoring event logging warning:', err.message);
    res.status(200).json({ ok: false, error: err.message });
  }
});

// ─── Question Bank Certification Resolver ────────────────────────────────────

export function resolveQuestionBankExamId(examId, examName) {
  const norm = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const nId = norm(examId);
  const nName = norm(examName);

  if (nId.includes('haccp') || nName.includes('haccp')) return 'exam-codex-haccp';
  if (nId.includes('fssc') || nName.includes('fssc')) return 'exam-fssc-22000';
  if (nId.includes('22000') || nName.includes('22000') || nName.includes('fsms')) return 'exam-iso-22000';
  if (nId.includes('brc') || nName.includes('brc')) return 'exam-brcgs';
  if (nId.includes('micro') || nName.includes('micro')) return 'exam-food-microbiology';
  if (nId.includes('ghp') || nName.includes('ghp') || nId.includes('gmp') || nName.includes('gmp')) return 'exam-ghp-gmp';
  if (nId.includes('tech') || nName.includes('tech')) return 'exam-food-technology';
  if (nId.includes('safety') || nName.includes('safety')) return 'exam-food-safety';

  return examId;
}

// ─── 2. Start Exam Sitting ──────────────────────────────────────────────────

router.post('/:assignmentId/start', async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const session = await ExamSessionService.startSitting({ assignmentId });

    // Ensure assigned_question_ids column exists in exam_attempts
    try {
      await pool.query('ALTER TABLE exam_attempts ADD COLUMN assigned_question_ids JSON NULL');
    } catch (_) {}

    // Fetch questions for this certification exam
    let questions = [];
    try {
      const [assignRows] = await pool.query(
        `SELECT ea.exam_id, e.name as exam_name FROM exam_assignments ea JOIN exams e ON ea.exam_id = e.id WHERE ea.id = ?`,
        [assignmentId]
      );
      if (assignRows.length > 0) {
        const rawExamId = assignRows[0].exam_id;
        const examName = assignRows[0].exam_name;
        const targetBankId = resolveQuestionBankExamId(rawExamId, examName);

        let [qRows] = await pool.query(
          `SELECT id, question_text, type, options_json, marks, order_index FROM public_exam_questions WHERE exam_id = ? ORDER BY order_index ASC`,
          [targetBankId]
        );

        if (qRows.length === 0) {
          // Fallback direct match on exam_id or like search
          [qRows] = await pool.query(
            `SELECT id, question_text, type, options_json, marks, order_index FROM public_exam_questions WHERE exam_id = ? ORDER BY order_index ASC`,
            [rawExamId]
          );
        }

        if (qRows.length === 0) {
          const [matchExams] = await pool.query(
            `SELECT id FROM public_exams WHERE name LIKE ? OR id LIKE ? LIMIT 1`,
            [`%${examName}%`, `%${rawExamId}%`]
          );
          if (matchExams.length > 0) {
            [qRows] = await pool.query(
              `SELECT id, question_text, type, options_json, marks, order_index FROM public_exam_questions WHERE exam_id = ? ORDER BY order_index ASC`,
              [matchExams[0].id]
            );
          }
        }

        if (qRows.length === 0) {
          [qRows] = await pool.query(
            `SELECT id, question_text, type, options_json, marks, order_index FROM public_exam_questions WHERE exam_id = 'exam-codex-haccp' ORDER BY order_index ASC`
          );
        }

        // Shuffle question pool and sample 10 questions (standard GSFIN 3x pool rule: 10 selected from 30)
        const shuffled = [...qRows].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 10);

        // Record assigned question IDs in attempt
        if (session.attemptId && selected.length > 0) {
          try {
            const questionIds = selected.map(q => q.id);
            await pool.query(
              `UPDATE exam_attempts SET assigned_question_ids = ? WHERE id = ?`,
              [JSON.stringify(questionIds), session.attemptId]
            );
          } catch (attQErr) {
            console.warn('Could not record assigned question ids:', attQErr.message);
          }
        }

        questions = selected.map(q => {
          let rawOpts = [];
          try {
            rawOpts = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : (q.options_json || []);
          } catch (e) {
            rawOpts = [];
          }

          const formattedOptions = rawOpts.map((opt, idx) => {
            const text = typeof opt === 'object' && opt !== null ? (opt.text || opt.title || '') : String(opt);
            return {
              letter: ['A', 'B', 'C', 'D', 'E'][idx] || String(idx + 1),
              text: text
            };
          });

          return {
            id: q.id,
            question_text: q.question_text,
            type: q.type || 'mcq',
            marks: q.marks || 1,
            options: formattedOptions
          };
        });
      }
    } catch (qErr) {
      console.error('Error fetching questions for sitting (non-fatal):', qErr);
    }

    res.json({
      ...session,
      questions
    });
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
  const { assignmentId } = req.params;
  const { attempt_id, answers, score, percentage, passed } = req.body;
  if (!attempt_id) {
    return res.status(400).json({ message: 'Attempt ID is required to submit exam.' });
  }

  try {
    let finalScore = Number(score) || 0;
    let finalPercentage = Number(percentage) || 0;
    let isPassed = Boolean(passed);
    let totalQuestionsCount = 0;
    let answeredQuestionsCount = 0;
    let correctCount = 0;

    // Evaluate answers against question bank if answers map provided
    if (answers && typeof answers === 'object') {
      const qIds = Object.keys(answers);
      answeredQuestionsCount = qIds.length;

      if (qIds.length > 0) {
        // Also check if attempt has assigned_question_ids recorded
        let evalQuestionIds = qIds;
        try {
          const [attRows] = await pool.query(
            `SELECT assigned_question_ids FROM exam_attempts WHERE id = ?`,
            [attempt_id]
          );
          if (attRows.length > 0 && attRows[0].assigned_question_ids) {
            const recorded = typeof attRows[0].assigned_question_ids === 'string' 
              ? JSON.parse(attRows[0].assigned_question_ids) 
              : attRows[0].assigned_question_ids;
            if (Array.isArray(recorded) && recorded.length > 0) {
              evalQuestionIds = Array.from(new Set([...recorded, ...qIds]));
            }
          }
        } catch (_) {}

        totalQuestionsCount = evalQuestionIds.length;

        const placeholders = evalQuestionIds.map(() => '?').join(',');
        const [bankRows] = await pool.query(
          `SELECT id, correct_answer, options_json, marks FROM public_exam_questions WHERE id IN (${placeholders})`,
          evalQuestionIds
        );

        let earnedMarks = 0;
        let totalMarks = 0;

        for (const q of bankRows) {
          const markValue = Number(q.marks) || 1;
          totalMarks += markValue;

          const candidateAns = answers[q.id];
          if (candidateAns !== undefined && candidateAns !== null && candidateAns !== '') {
            let rawOpts = [];
            try {
              rawOpts = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : (q.options_json || []);
            } catch (_) {}

            let isCorrect = false;
            const norm = (s) => String(s || '').trim().toLowerCase();
            const correctNorm = norm(q.correct_answer);

            // Check if candidate submitted option letter ('A', 'B', 'C', 'D')
            const letterMap = { A: 0, B: 1, C: 2, D: 3, E: 4 };
            const candidateStr = String(candidateAns).trim();
            const upperLetter = candidateStr.toUpperCase();

            if (letterMap[upperLetter] !== undefined && rawOpts[letterMap[upperLetter]]) {
              const optVal = rawOpts[letterMap[upperLetter]];
              const optText = typeof optVal === 'object' && optVal !== null ? (optVal.text || optVal.title || '') : String(optVal);
              if (norm(optText) === correctNorm || upperLetter === correctNorm) {
                isCorrect = true;
              }
            } else if (norm(candidateAns) === correctNorm) {
              isCorrect = true;
            }

            if (isCorrect) {
              earnedMarks += markValue;
              correctCount++;
            }
          }
        }

        finalScore = earnedMarks;
        finalPercentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
        isPassed = finalPercentage >= 50; // 50% passing threshold for GSFIN Certification
      }
    }

    const result = await ExamSessionService.endSitting({
      attemptId: attempt_id,
      endReason: 'submitted',
      score: finalScore,
      percentage: finalPercentage,
      passed: isPassed
    });

    res.json({
      message: isPassed ? (result.certificate_url ? 'Exam passed! Certificate issued and sent to your email.' : 'Exam passed!') : 'Exam completed.',
      score: finalScore,
      percentage: finalPercentage,
      passed: isPassed,
      totalQuestions: totalQuestionsCount || 10,
      answeredCount: answeredQuestionsCount,
      correctCount,
      enableCertificate: result.enable_certificate,
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
