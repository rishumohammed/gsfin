import { pool } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

class ProctoringService {
  async logEvent(attemptId, type, metadata = {}) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO proctoring_events (id, attempt_id, type, metadata_json) VALUES (?, ?, ?, ?)',
      [id, attemptId, type, JSON.stringify(metadata)]
    );
    return { id, attemptId, type };
  }

  async getEventsForAttempt(attemptId) {
    const [events] = await pool.query(
      'SELECT * FROM proctoring_events WHERE attempt_id = ? ORDER BY created_at ASC',
      [attemptId]
    );
    return events.map(e => ({
      ...e,
      metadata_json: typeof e.metadata_json === 'string' ? JSON.parse(e.metadata_json || '{}') : (e.metadata_json || {})
    }));
  }

  async getRecordingsForAttempt(attemptId) {
    const dir = path.join(process.cwd(), 'uploads', 'recordings', attemptId);
    try {
      const files = await fs.readdir(dir);
      const webmFiles = files
        .filter(f => f.endsWith('.webm'))
        .sort((a, b) => {
          const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
          const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
          return numA - numB;
        });

      return webmFiles.map(filename => ({
        url: `/uploads/recordings/${attemptId}/${filename}`,
        filename
      }));
    } catch (err) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  async getScreenshotsForAttempt(attemptId) {
    const dir = path.join(process.cwd(), 'uploads', 'screenshots', attemptId);
    try {
      const files = await fs.readdir(dir);
      const imageFiles = files
        .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
        .sort();

      return imageFiles.map(filename => ({
        url: `/uploads/screenshots/${attemptId}/${filename}`,
        filename
      }));
    } catch (err) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  async saveReferenceSelfie(attemptId, selfieUrl, baselineVector = null) {
    const vectorJson = baselineVector ? JSON.stringify(baselineVector) : null;
    
    // Try updating exam_attempts first
    const [res1] = await pool.query(
      'UPDATE exam_attempts SET reference_selfie_url = ?, baseline_vector = ? WHERE id = ?',
      [selfieUrl, vectorJson, attemptId]
    );

    // Try updating public_exam_attempts
    const [res2] = await pool.query(
      'UPDATE public_exam_attempts SET reference_selfie_url = ?, baseline_vector = ? WHERE id = ?',
      [selfieUrl, vectorJson, attemptId]
    );

    return { success: res1.affectedRows > 0 || res2.affectedRows > 0, selfieUrl };
  }

  async getAttemptDetails(attemptId) {
    // Try fetching from public_exam_attempts first
    const [publicAttempts] = await pool.query(
      `SELECT ea.*, e.name as exam_title, e.enable_proctoring, e.max_proctoring_warnings,
              COALESCE(c.name, ea.guest_name) as candidate_name, COALESCE(c.email, ea.guest_email) as candidate_email
       FROM public_exam_attempts ea
       JOIN public_exams e ON ea.exam_id = e.id
       LEFT JOIN public_exam_candidates c ON ea.candidate_id = c.id
       WHERE ea.id = ?`,
      [attemptId]
    );

    if (publicAttempts.length > 0) {
      return { type: 'public', ...publicAttempts[0] };
    }

    // Otherwise try exam_attempts
    const [standardAttempts] = await pool.query(
      `SELECT ea.*, e.title as exam_title, e.proctoring_enabled as enable_proctoring, e.max_proctoring_warnings,
              u.name as candidate_name, u.email as candidate_email
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       JOIN users u ON ea.student_id = u.id
       WHERE ea.id = ?`,
      [attemptId]
    );

    if (standardAttempts.length > 0) {
      return { type: 'standard', ...standardAttempts[0] };
    }

    return null;
  }

  async approveCertificate(attemptId) {
    // 1. Update proctoring_status in DB
    await pool.query('UPDATE public_exam_attempts SET proctoring_status = "approved" WHERE id = ?', [attemptId]);
    await pool.query('UPDATE exam_attempts SET proctoring_status = "approved" WHERE id = ?', [attemptId]);

    // 2. Issue Certificate if passed
    const details = await this.getAttemptDetails(attemptId);
    if (details && (details.passed || details.status === 'passed' || details.status === 'completed')) {
      if (details.type === 'public') {
        const certId = uuidv4();
        await pool.query(
          `INSERT IGNORE INTO public_exam_issued_certificates (id, candidate_id, exam_id, candidate_name, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [certId, details.candidate_id || details.id, details.exam_id, details.candidate_name]
        );
      } else {
        const certId = uuidv4();
        await pool.query(
          `INSERT IGNORE INTO certificates (id, assignment_id, issued_at)
           VALUES (?, ?, NOW())`,
          [certId, details.id]
        );
      }
    }

    return { success: true, proctoring_status: 'approved' };
  }

  async flagAttempt(attemptId, reason = 'Flagged by administrator') {
    await pool.query('UPDATE public_exam_attempts SET proctoring_status = "flagged" WHERE id = ?', [attemptId]);
    await pool.query('UPDATE exam_attempts SET proctoring_status = "flagged" WHERE id = ?', [attemptId]);
    
    await this.logEvent(attemptId, 'flagged_by_admin', { reason });
    return { success: true, proctoring_status: 'flagged' };
  }

  async getAttemptsWithViolations(userId, role) {
    let query = `
      SELECT 
        ea.id, ea.student_id, ea.exam_id, ea.status, ea.submitted_at, ea.proctoring_status, ea.reference_selfie_url,
        u.name as student_name, u.email as student_email,
        e.title as exam_title,
        COUNT(pe.id) as violation_count
      FROM exam_attempts ea
      JOIN users u ON ea.student_id = u.id
      JOIN exams e ON ea.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN proctoring_events pe ON ea.id = pe.attempt_id
      WHERE e.proctoring_enabled = TRUE
    `;
    const params = [];
    if (role === 'tutor') {
      query += ` AND c.tutor_id = ?`;
      params.push(userId);
    }
    
    query += `
      GROUP BY ea.id, ea.student_id, ea.exam_id, ea.status, ea.submitted_at, ea.proctoring_status, ea.reference_selfie_url, u.name, u.email, e.title
      ORDER BY ea.submitted_at DESC
    `;
    const [attempts] = await pool.query(query, params);
    return attempts;
  }

  async getViolationsGroupedByExam(userId, role) {
    let query = `
      SELECT 
        pe.id as event_id, pe.type as violation_type, pe.metadata_json, pe.created_at as timestamp,
        ea.id as attempt_id, ea.student_id, ea.exam_id, ea.status as attempt_status, ea.proctoring_status, ea.reference_selfie_url,
        ea.submitted_at, ea.started_at as attempt_started_at,
        u.name as student_name, u.id as uid,
        e.title as exam_title, e.id as eid,
        c.title as course_title, c.id as cid
      FROM exam_attempts ea
      LEFT JOIN proctoring_events pe ON pe.attempt_id = ea.id
      JOIN users u ON ea.student_id = u.id
      JOIN exams e ON ea.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.proctoring_enabled = TRUE
    `;
    const params = [];
    if (role === 'tutor') {
      query += ` AND c.tutor_id = ?`;
      params.push(userId);
    }
    query += ` ORDER BY c.title ASC, u.name ASC, ea.started_at DESC, pe.created_at DESC`;
    const [rows] = await pool.query(query, params);

    const coursesMap = new Map();
    let totalViolations = 0;
    let highSeverityViolations = 0;
    const studentsFlaggedSet = new Set();
    const attemptsSet = new Set();

    const getSeverity = (type) => {
      const high = ['proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected', 'phone_detected', 'suspicious_object', 'camera_disabled', 'microphone_disabled'];
      const medium = ['tab_switch', 'window_blur', 'fullscreen_exit', 'gaze_deviation', 'looking_away'];
      if (high.includes(type)) return 'High';
      if (medium.includes(type)) return 'Medium';
      return 'Low';
    };

    rows.forEach(row => {
      const courseKey = row.cid;
      const studentKey = `${row.cid}_${row.uid}`;
      const attemptKey = row.attempt_id;

      if (!coursesMap.has(courseKey)) {
        coursesMap.set(courseKey, {
          id: courseKey,
          title: row.course_title,
          students: new Map()
        });
      }
      const courseGroup = coursesMap.get(courseKey);

      if (!courseGroup.students.has(studentKey)) {
        courseGroup.students.set(studentKey, {
          id: row.uid,
          name: row.student_name,
          attempts: new Map()
        });
      }
      const studentGroup = courseGroup.students.get(studentKey);

      if (!studentGroup.attempts.has(attemptKey)) {
        attemptsSet.add(row.exam_id);
        studentGroup.attempts.set(attemptKey, {
          attempt_id: row.attempt_id,
          exam_id: row.exam_id,
          exam_title: row.exam_title,
          started_at: row.attempt_started_at,
          submitted_at: row.submitted_at,
          status: row.attempt_status,
          proctoring_status: row.proctoring_status || 'pending_review',
          reference_selfie_url: row.reference_selfie_url,
          violations: [],
          violationCount: 0,
          highSeverityCount: 0
        });
      }
      const attemptGroup = studentGroup.attempts.get(attemptKey);

      if (row.event_id) {
        const severity = getSeverity(row.violation_type);
        totalViolations++;
        attemptGroup.violationCount++;
        studentsFlaggedSet.add(row.uid);
        if (severity === 'High') {
          highSeverityViolations++;
          attemptGroup.highSeverityCount++;
        }

        let has_screenshot = false;
        let screenshot_url = null;
        try {
          if (row.metadata_json) {
            const meta = typeof row.metadata_json === 'string' ? JSON.parse(row.metadata_json) : row.metadata_json;
            has_screenshot = !!meta.screenshot;
            screenshot_url = meta.screenshot || null;
          }
        } catch (e) {}

        attemptGroup.violations.push({
          id: row.event_id,
          attempt_id: row.attempt_id,
          violation_type: row.violation_type,
          severity,
          timestamp: row.timestamp,
          has_screenshot,
          screenshot_url
        });
      } else {
        if (attemptGroup.violations.length === 0) {
          attemptGroup.violations.push({
            id: row.attempt_id + '_clean',
            attempt_id: row.attempt_id,
            violation_type: 'No Violations',
            severity: 'None',
            timestamp: row.attempt_started_at,
            has_screenshot: false,
            screenshot_url: null
          });
        }
      }
    });

    const courses = Array.from(coursesMap.values()).map(course => ({
      ...course,
      students: Array.from(course.students.values()).map(student => ({
        ...student,
        attempts: Array.from(student.attempts.values())
      }))
    }));

    return {
      stats: {
        totalExamsMonitored: attemptsSet.size,
        totalViolations,
        highSeverityViolations,
        studentsFlagged: studentsFlaggedSet.size
      },
      courses
    };
  }

  async getPublicViolationsGroupedByExam(userId, role) {
    let query = `
      SELECT 
        pe.id as event_id, pe.type as violation_type, pe.metadata_json, pe.created_at as timestamp,
        ea.id as attempt_id, ea.exam_id, ea.status as attempt_status, ea.proctoring_status, ea.reference_selfie_url,
        ea.submitted_at, ea.started_at as attempt_started_at,
        COALESCE(c.name, ea.guest_name) as candidate_name, 
        COALESCE(ea.candidate_id, ea.id) as cid,
        e.name as exam_title, e.id as eid
      FROM public_exam_attempts ea
      LEFT JOIN proctoring_events pe ON pe.attempt_id = ea.id
      LEFT JOIN public_exam_candidates c ON ea.candidate_id = c.id
      JOIN public_exams e ON ea.exam_id = e.id
      WHERE e.enable_proctoring = 1
    `;
    const params = [];
    query += ` ORDER BY e.name ASC, c.name ASC, ea.started_at DESC, pe.created_at DESC`;
    const [rows] = await pool.query(query, params);

    const examsMap = new Map();
    let totalViolations = 0;
    let highSeverityViolations = 0;
    const candidatesFlaggedSet = new Set();
    const attemptsSet = new Set();

    const getSeverity = (type) => {
      const high = ['proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected', 'phone_detected', 'suspicious_object', 'camera_disabled', 'microphone_disabled'];
      const medium = ['tab_switch', 'window_blur', 'fullscreen_exit', 'gaze_deviation', 'looking_away'];
      if (high.includes(type)) return 'High';
      if (medium.includes(type)) return 'Medium';
      return 'Low';
    };

    rows.forEach(row => {
      const examKey = row.eid;
      const candidateKey = `${row.eid}_${row.cid}`;
      const attemptKey = row.attempt_id;

      if (!examsMap.has(examKey)) {
        examsMap.set(examKey, {
          id: examKey,
          title: row.exam_title,
          candidates: new Map()
        });
      }
      const examGroup = examsMap.get(examKey);

      if (!examGroup.candidates.has(candidateKey)) {
        examGroup.candidates.set(candidateKey, {
          id: row.cid,
          name: row.candidate_name,
          attempts: new Map()
        });
      }
      const candidateGroup = examGroup.candidates.get(candidateKey);

      if (!candidateGroup.attempts.has(attemptKey)) {
        attemptsSet.add(row.attempt_id);
        candidateGroup.attempts.set(attemptKey, {
          attempt_id: row.attempt_id,
          exam_id: row.exam_id,
          exam_title: row.exam_title,
          started_at: row.attempt_started_at,
          submitted_at: row.submitted_at,
          status: row.attempt_status,
          proctoring_status: row.proctoring_status || 'pending_review',
          reference_selfie_url: row.reference_selfie_url,
          violations: [],
          violationCount: 0,
          highSeverityCount: 0
        });
      }
      const attemptGroup = candidateGroup.attempts.get(attemptKey);

      if (row.event_id) {
        const severity = getSeverity(row.violation_type);
        totalViolations++;
        attemptGroup.violationCount++;
        candidatesFlaggedSet.add(row.cid);
        if (severity === 'High') {
          highSeverityViolations++;
          attemptGroup.highSeverityCount++;
        }

        let has_screenshot = false;
        let screenshot_url = null;
        try {
          if (row.metadata_json) {
            const meta = typeof row.metadata_json === 'string' ? JSON.parse(row.metadata_json) : row.metadata_json;
            has_screenshot = !!meta.screenshot;
            screenshot_url = meta.screenshot || null;
          }
        } catch (e) {}

        attemptGroup.violations.push({
          id: row.event_id,
          attempt_id: row.attempt_id,
          violation_type: row.violation_type,
          severity,
          timestamp: row.timestamp,
          has_screenshot,
          screenshot_url
        });
      } else {
        if (attemptGroup.violations.length === 0) {
          attemptGroup.violations.push({
            id: row.attempt_id + '_clean',
            attempt_id: row.attempt_id,
            violation_type: 'No Violations',
            severity: 'None',
            timestamp: row.attempt_started_at,
            has_screenshot: false,
            screenshot_url: null
          });
        }
      }
    });

    const exams = Array.from(examsMap.values()).map(exam => ({
      ...exam,
      candidates: Array.from(exam.candidates.values()).map(candidate => ({
        ...candidate,
        attempts: Array.from(candidate.attempts.values())
      }))
    }));

    return {
      stats: {
        totalExamsMonitored: attemptsSet.size,
        totalViolations,
        highSeverityViolations,
        candidatesFlagged: candidatesFlaggedSet.size
      },
      exams
    };
  }

  async clearViolations(attemptId) {
    await pool.query(
      "DELETE FROM proctoring_events WHERE attempt_id = ? AND type IN ('tab_switch', 'window_blur', 'fullscreen_exit', 'devtools_open', 'multiple_faces', 'face_absent', 'gaze_deviation', 'mobile_phone_detected', 'proxy_mismatch')",
      [attemptId]
    );
    return { success: true };
  }

  async deleteAttemptLogs(attemptId) {
    await pool.query('DELETE FROM proctoring_events WHERE attempt_id = ?', [attemptId]);
    
    // Delete recordings
    const recDir = path.join(process.cwd(), 'uploads', 'recordings', attemptId);
    try {
      await fs.rm(recDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to delete recording directory for attempt ${attemptId}:`, err.message);
    }

    // Delete screenshots
    const shotDir = path.join(process.cwd(), 'uploads', 'screenshots', attemptId);
    try {
      await fs.rm(shotDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to delete screenshot directory for attempt ${attemptId}:`, err.message);
    }

    return { success: true };
  }

  async deleteCandidateLogs(examId, candidateId) {
    const [attempts] = await pool.query(
      'SELECT id FROM public_exam_attempts WHERE exam_id = ? AND (candidate_id = ? OR id = ?)',
      [examId, candidateId, candidateId]
    );
    for (const attempt of attempts) {
      await this.deleteAttemptLogs(attempt.id);
    }
    return { success: true };
  }

  async deleteExamLogs(examId) {
    const [attempts] = await pool.query(
      'SELECT id FROM public_exam_attempts WHERE exam_id = ?',
      [examId]
    );
    for (const attempt of attempts) {
      await this.deleteAttemptLogs(attempt.id);
    }
    return { success: true };
  }
}

export default new ProctoringService();
