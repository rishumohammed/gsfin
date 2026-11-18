import { pool } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { CertificateService } from './certificate.service.js';
import EmailService from './email.service.js';

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
    const parsedEvents = (events || []).map(e => {
      let meta = e.metadata_json;
      if (typeof meta === 'string') {
        try { meta = JSON.parse(meta); } catch (_) { meta = {}; }
      }
      return {
        ...e,
        metadata_json: meta || {}
      };
    });

    let proctoring_status = 'pending_review';
    try {
      const [[att]] = await pool.query('SELECT proctoring_status FROM public_exam_attempts WHERE id = ?', [attemptId]);
      if (att && att.proctoring_status) proctoring_status = att.proctoring_status;
    } catch (_) {}

    return { events: parsedEvents, proctoring_status };
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
              COALESCE(c.name, ea.guest_name) as candidate_name, COALESCE(c.email, ea.guest_email) as candidate_email,
              c.metadata as candidate_metadata
       FROM public_exam_attempts ea
       JOIN public_exams e ON ea.exam_id = e.id
       LEFT JOIN public_exam_candidates c ON ea.candidate_id = c.id
       WHERE ea.id = ?`,
      [attemptId]
    );

    if (publicAttempts.length > 0) {
      const att = publicAttempts[0];
      if (!att.reference_selfie_url && att.candidate_metadata) {
        try {
          const m = typeof att.candidate_metadata === 'string' ? JSON.parse(att.candidate_metadata) : att.candidate_metadata;
          if (m && m.reference_photo_url) {
            att.reference_selfie_url = m.reference_photo_url;
          }
        } catch (_) {}
      }
      return { type: 'public', ...att };
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

  async approveCertificateAndRelease(attemptId) {
    const [attempts] = await pool.query(`
      SELECT a.*, e.name as exam_name, e.enable_certificate,
             c.name as candidate_name, c.email as candidate_email
      FROM public_exam_attempts a
      JOIN public_exams e ON a.exam_id = e.id
      LEFT JOIN public_exam_candidates c ON a.candidate_id = c.id
      WHERE a.id = ?
    `, [attemptId]);

    if (attempts.length === 0) {
      // Fallback for standard course exam attempts
      await pool.query('UPDATE exam_attempts SET proctoring_status = "approved" WHERE id = ?', [attemptId]);
      const details = await this.getAttemptDetails(attemptId);
      if (details && (details.passed || details.status === 'passed' || details.status === 'completed')) {
        const certId = uuidv4();
        await pool.query(
          `INSERT IGNORE INTO certificates (id, assignment_id, issued_at) VALUES (?, ?, NOW())`,
          [certId, details.id]
        );
      }
      return { success: true, proctoring_status: 'approved' };
    }

    const attempt = attempts[0];
    const finalCandidateName = attempt.candidate_name || attempt.guest_name;
    const finalCandidateEmail = attempt.candidate_email || attempt.guest_email;
    const finalExamName = attempt.exam_name;

    // Check if the candidate actually passed the exam before issuing certificate
    const [results] = await pool.query(
      'SELECT passed, percentage, score FROM public_exam_results WHERE attempt_id = ?',
      [attemptId]
    );
    const hasPassed = results.length > 0 ? Boolean(results[0].passed) : false;

    // Mark as approved in proctoring audit
    await pool.query('UPDATE public_exam_attempts SET proctoring_status = ? WHERE id = ?', ['approved', attemptId]);

    let certInfo = null;
    // Generate certificate ONLY IF candidate passed the exam, certificate is enabled, and email exists
    if (hasPassed && finalCandidateEmail && attempt.enable_certificate) {
      let logoAbsPath = null;
      try {
        const [[logoRow]] = await pool.query("SELECT `value` FROM system_config WHERE `key` = 'certificate_logo'");
        if (logoRow && logoRow.value) {
          const relPath = logoRow.value.startsWith('/') ? logoRow.value : '/' + logoRow.value;
          const absPath = path.join(process.cwd(), relPath);
          if (fsSync.existsSync(absPath)) logoAbsPath = absPath;
        }
      } catch (_) {}

      const { buffer, pdfUrl, certificateNumber } = await CertificateService.generateParticipationCertificate(
        finalCandidateName,
        finalExamName,
        new Date(),
        logoAbsPath
      );

      // Check if already issued
      const [existing] = await pool.query('SELECT id FROM public_exam_issued_certificates WHERE attempt_id = ?', [attemptId]);
      if (existing.length === 0) {
        const certId = uuidv4();
        try {
          await pool.query(`
            INSERT INTO public_exam_issued_certificates 
              (id, exam_id, attempt_id, candidate_name, candidate_email, pdf_url, certificate_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [certId, attempt.exam_id, attemptId, finalCandidateName, finalCandidateEmail, pdfUrl, certificateNumber || null]);
        } catch (_) {
          await pool.query(`
            INSERT INTO public_exam_issued_certificates 
              (id, exam_id, attempt_id, candidate_name, candidate_email, pdf_url) 
            VALUES (?, ?, ?, ?, ?, ?)
          `, [certId, attempt.exam_id, attemptId, finalCandidateName, finalCandidateEmail, pdfUrl]);
        }
      }

      await EmailService.sendExamCertificateEmail(
        { name: finalCandidateName, email: finalCandidateEmail },
        { name: finalExamName },
        buffer
      );

      certInfo = { pdfUrl, certificateNumber };
    }

    await this.logEvent(attemptId, 'proctoring_approved', { approved_at: new Date() });
    return { success: true, proctoring_status: 'approved', certificate: certInfo };
  }

  async approveCertificate(attemptId) {
    return this.approveCertificateAndRelease(attemptId);
  }

  async flagAttempt(attemptId, reason = 'Flagged by proctor') {
    await pool.query('UPDATE public_exam_attempts SET proctoring_status = "flagged" WHERE id = ?', [attemptId]);
    await pool.query('UPDATE exam_attempts SET proctoring_status = "flagged" WHERE id = ?', [attemptId]);
    
    await this.logEvent(attemptId, 'attempt_flagged', { reason, flagged_at: new Date() });
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

  async getProctoringHierarchy() {
    // 1. Fetch partner branches (organizations)
    let organizations = [];
    try {
      const [rows] = await pool.query(`
        SELECT id, name, contact_email, contact_phone, country, city, institution_type, status, created_at
        FROM organizations
        ORDER BY name ASC
      `);
      organizations = rows || [];
    } catch (err) {
      console.warn('Proctoring hierarchy organizations fetch warning:', err.message);
    }

    // 2. Fetch all batches under organizations with exam details
    let batches = [];
    try {
      const [rows] = await pool.query(`
        SELECT 
          b.id, b.org_id, b.exam_id, b.status, b.opens_at, b.closes_at, b.created_at,
          COALESCE(e.name, pe.name, 'Certification Standard Exam') as exam_name
        FROM batches b
        LEFT JOIN exams e ON b.exam_id = e.id
        LEFT JOIN public_exams pe ON b.exam_id = pe.id
        ORDER BY b.created_at DESC
      `);
      batches = rows || [];
    } catch (err) {
      console.warn('Proctoring hierarchy batches fetch warning:', err.message);
    }

    // 3. Fetch sub-center attempts with violation aggregates
    let subCenterAttempts = [];
    try {
      const [rows] = await pool.query(`
        SELECT 
          ea.id as attempt_id,
          a.batch_id,
          b.org_id,
          a.status as attempt_status,
          ea.proctoring_status,
          (SELECT COUNT(*) FROM proctoring_events pe WHERE pe.attempt_id = ea.id) as violation_count,
          (SELECT COUNT(*) FROM proctoring_events pe WHERE pe.attempt_id = ea.id AND pe.type IN ('proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected', 'phone_detected', 'suspicious_object', 'camera_disabled', 'microphone_disabled')) as high_severity_count
        FROM exam_attempts ea
        JOIN exam_assignments a ON ea.assignment_id = a.id
        JOIN batches b ON a.batch_id = b.id
      `);
      subCenterAttempts = rows || [];
    } catch (err) {
      console.warn('Proctoring hierarchy subCenterAttempts fetch warning:', err.message);
    }

    // 4. Fetch public exams (active for proctoring)
    let publicExams = [];
    try {
      const [rows] = await pool.query(`
        SELECT id, name, slug, status, exam_start_date as opens_at, exam_end_date as closes_at, created_at
        FROM public_exams
        ORDER BY name ASC
      `);
      publicExams = rows || [];
    } catch (err) {
      console.warn('Proctoring hierarchy publicExams fetch warning:', err.message);
    }

    // 5. Fetch public exam attempts with violation aggregates
    let publicAttempts = [];
    try {
      const [rows] = await pool.query(`
        SELECT 
          ea.id as attempt_id,
          CONCAT('pub-batch-', ea.exam_id) as batch_id,
          'branch-direct-portal' as org_id,
          ea.status as attempt_status,
          ea.proctoring_status,
          (SELECT COUNT(*) FROM proctoring_events pe WHERE pe.attempt_id = ea.id) as violation_count,
          (SELECT COUNT(*) FROM proctoring_events pe WHERE pe.attempt_id = ea.id AND pe.type IN ('proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected', 'phone_detected', 'suspicious_object', 'camera_disabled', 'microphone_disabled')) as high_severity_count
        FROM public_exam_attempts ea
        JOIN public_exams e ON ea.exam_id = e.id
      `);
      publicAttempts = rows || [];
    } catch (err) {
      console.warn('Proctoring hierarchy publicAttempts fetch warning:', err.message);
    }

    // Build Batches Map
    const batchMap = new Map();

    // Map sub-center batches
    batches.forEach(b => {
      batchMap.set(b.id, {
        id: b.id,
        org_id: b.org_id,
        exam_id: b.exam_id,
        exam_name: b.exam_name,
        batch_code: 'BATCH-' + b.id.slice(0, 8).toUpperCase(),
        status: b.status,
        opens_at: b.opens_at,
        closes_at: b.closes_at,
        created_at: b.created_at,
        total_candidates: 0,
        total_attempts: 0,
        violations_count: 0,
        high_severity_count: 0,
        pending_review_count: 0,
        flagged_count: 0,
        approved_count: 0
      });
    });

    // Map public exams as batches under 'branch-direct-portal'
    publicExams.forEach(pe => {
      const pubBatchId = 'pub-batch-' + pe.id;
      batchMap.set(pubBatchId, {
        id: pubBatchId,
        org_id: 'branch-direct-portal',
        exam_id: pe.id,
        exam_name: pe.name,
        batch_code: 'PORTAL-' + (pe.slug ? pe.slug.toUpperCase() : pe.id.slice(0, 8).toUpperCase()),
        status: pe.status === 'published' ? 'open' : 'draft',
        opens_at: pe.opens_at,
        closes_at: pe.closes_at,
        created_at: pe.created_at,
        total_candidates: 0,
        total_attempts: 0,
        violations_count: 0,
        high_severity_count: 0,
        pending_review_count: 0,
        flagged_count: 0,
        approved_count: 0
      });
    });

    // Process attempts into batch stats
    const allAttempts = [...subCenterAttempts, ...publicAttempts];
    allAttempts.forEach(att => {
      const batch = batchMap.get(att.batch_id);
      if (batch) {
        batch.total_attempts++;
        batch.total_candidates++;
        batch.violations_count += Number(att.violation_count || 0);
        batch.high_severity_count += Number(att.high_severity_count || 0);
        if (att.proctoring_status === 'flagged') batch.flagged_count++;
        else if (att.proctoring_status === 'approved') batch.approved_count++;
        else if (att.proctoring_status === 'pending_review' || Number(att.violation_count) > 0) batch.pending_review_count++;
      }
    });

    // Build Branches (Organizations + Direct Portal)
    const branchesMap = new Map();

    // 1. Direct Portal Branch
    branchesMap.set('branch-direct-portal', {
      id: 'branch-direct-portal',
      name: 'GSFIN Direct Examination Portal',
      code: 'GSFIN-HQ',
      city: 'International',
      country: 'Global Jurisdiction',
      type: 'Direct Public Portal',
      status: 'active',
      batches: [],
      total_batches: 0,
      total_candidates: 0,
      total_violations: 0,
      high_severity_count: 0,
      flagged_count: 0,
      pending_review_count: 0,
      approved_count: 0
    });

    // 2. Partner Organizations
    organizations.forEach(org => {
      branchesMap.set(org.id, {
        id: org.id,
        name: org.name,
        code: 'BRANCH-' + org.id.slice(0, 6).toUpperCase(),
        city: org.city || 'International',
        country: org.country || 'Global Jurisdiction',
        type: org.institution_type || 'Authorized Testing Center',
        status: org.status || 'active',
        batches: [],
        total_batches: 0,
        total_candidates: 0,
        total_violations: 0,
        high_severity_count: 0,
        flagged_count: 0,
        pending_review_count: 0,
        approved_count: 0
      });
    });

    // Attach batches to branches
    batchMap.forEach(batch => {
      const branch = branchesMap.get(batch.org_id);
      if (branch) {
        branch.batches.push(batch);
        branch.total_batches++;
        branch.total_candidates += batch.total_candidates;
        branch.total_violations += batch.violations_count;
        branch.high_severity_count += batch.high_severity_count;
        branch.flagged_count += batch.flagged_count;
        branch.pending_review_count += batch.pending_review_count;
        branch.approved_count += batch.approved_count;
      }
    });

    const branchesList = Array.from(branchesMap.values());

    // Top Level KPI Stats
    let totalMonitoredBranches = branchesList.filter(b => b.total_candidates > 0 || b.total_batches > 0).length;
    let totalBatchesCount = batchMap.size;
    let totalViolationsAll = 0;
    let totalHighSeverityAll = 0;
    let totalFlaggedAll = 0;
    let totalPendingAll = 0;
    let totalCandidatesAll = 0;

    branchesList.forEach(b => {
      totalViolationsAll += b.total_violations;
      totalHighSeverityAll += b.high_severity_count;
      totalFlaggedAll += b.flagged_count;
      totalPendingAll += b.pending_review_count;
      totalCandidatesAll += b.total_candidates;
    });

    return {
      stats: {
        totalBranches: branchesList.length,
        totalMonitoredBranches,
        totalBatches: totalBatchesCount,
        totalCandidates: totalCandidatesAll,
        totalViolations: totalViolationsAll,
        highSeverityViolations: totalHighSeverityAll,
        flaggedCount: totalFlaggedAll,
        pendingReviewCount: totalPendingAll
      },
      branches: branchesList
    };
  }

  async getBatchProctoringCandidates(batchId) {
    if (batchId.startsWith('pub-batch-')) {
      const examId = batchId.replace('pub-batch-', '');
      const [examRows] = await pool.query(
        'SELECT id, name, slug FROM public_exams WHERE id = ?',
        [examId]
      );
      const exam = examRows[0] || { name: 'Public Certification Exam' };

      const [attempts] = await pool.query(`
        SELECT 
          ea.id as attempt_id,
          ea.exam_id,
          COALESCE(c.id, ea.id) as student_id,
          COALESCE(c.name, ea.guest_name, 'Online Candidate') as candidate_name,
          COALESCE(c.email, ea.guest_email, 'N/A') as candidate_email,
          ea.started_at,
          ea.submitted_at,
          r.passed,
          r.score,
          r.percentage,
          ea.proctoring_status,
          ea.reference_selfie_url,
          (SELECT COUNT(*) FROM proctoring_events pe WHERE pe.attempt_id = ea.id) as violation_count,
          (SELECT COUNT(*) FROM proctoring_events pe WHERE pe.attempt_id = ea.id AND pe.type IN ('proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected', 'phone_detected', 'suspicious_object', 'camera_disabled', 'microphone_disabled')) as high_severity_count
        FROM public_exam_attempts ea
        LEFT JOIN public_exam_candidates c ON ea.candidate_id = c.id
        LEFT JOIN public_exam_results r ON ea.id = r.attempt_id
        WHERE ea.exam_id = ?
        ORDER BY ea.started_at DESC
      `, [examId]);

      // Fetch violation events for all attempts in this batch
      const attemptIds = attempts.map(a => a.attempt_id);
      let eventsMap = new Map();
      if (attemptIds.length > 0) {
        const [events] = await pool.query(
          `SELECT id, attempt_id, type, metadata_json, created_at 
           FROM proctoring_events 
           WHERE attempt_id IN (?) 
           ORDER BY created_at DESC`,
          [attemptIds]
        );
        events.forEach(ev => {
          if (!eventsMap.has(ev.attempt_id)) eventsMap.set(ev.attempt_id, []);
          eventsMap.get(ev.attempt_id).push(ev);
        });
      }

      const candidates = attempts.map(att => {
        const evs = eventsMap.get(att.attempt_id) || [];
        const typeCounts = {};
        evs.forEach(e => {
          typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
        });
        const summary = Object.entries(typeCounts).map(([t, c]) => `${t} (${c})`);

        return {
          ...att,
          result: att.passed ? 'pass' : (att.submitted_at ? 'fail' : 'in_progress'),
          violations: evs.slice(0, 10),
          violations_summary: summary
        };
      });

      return {
        batch: {
          id: batchId,
          branch_name: 'GSFIN Direct Examination Portal',
          exam_name: exam.name,
          batch_code: 'PORTAL-' + (exam.slug ? exam.slug.toUpperCase() : exam.id.slice(0, 8).toUpperCase()),
          status: 'open'
        },
        candidates
      };
    } else {
      // Sub-center batch
      const [batchRows] = await pool.query(`
        SELECT b.*, o.name as branch_name, COALESCE(e.name, pe.name, 'Certification Exam') as exam_name
        FROM batches b
        JOIN organizations o ON b.org_id = o.id
        LEFT JOIN exams e ON b.exam_id = e.id
        LEFT JOIN public_exams pe ON b.exam_id = pe.id
        WHERE b.id = ?
      `, [batchId]);

      if (batchRows.length === 0) {
        throw new Error('Batch not found');
      }
      const batch = batchRows[0];

      const [attempts] = await pool.query(`
        SELECT 
          ea.id as attempt_id,
          s.id as student_id,
          s.name as candidate_name,
          s.email as candidate_email,
          ea.started_at,
          ea.ended_at as submitted_at,
          ea.result,
          ea.proctoring_status,
          ea.reference_selfie_url,
          (SELECT COUNT(*) FROM proctoring_events pe WHERE pe.attempt_id = ea.id) as violation_count,
          (SELECT COUNT(*) FROM proctoring_events pe WHERE pe.attempt_id = ea.id AND pe.type IN ('proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected', 'phone_detected', 'suspicious_object', 'camera_disabled', 'microphone_disabled')) as high_severity_count
        FROM exam_attempts ea
        JOIN exam_assignments a ON ea.assignment_id = a.id
        JOIN students s ON a.student_id = s.id
        WHERE a.batch_id = ?
        ORDER BY ea.started_at DESC
      `, [batchId]);

      // Fetch violation events for all attempts in this batch
      const attemptIds = attempts.map(a => a.attempt_id);
      let eventsMap = new Map();
      if (attemptIds.length > 0) {
        const [events] = await pool.query(
          `SELECT id, attempt_id, type, metadata_json, created_at 
           FROM proctoring_events 
           WHERE attempt_id IN (?) 
           ORDER BY created_at DESC`,
          [attemptIds]
        );
        events.forEach(ev => {
          if (!eventsMap.has(ev.attempt_id)) eventsMap.set(ev.attempt_id, []);
          eventsMap.get(ev.attempt_id).push(ev);
        });
      }

      const candidates = attempts.map(att => {
        const evs = eventsMap.get(att.attempt_id) || [];
        const typeCounts = {};
        evs.forEach(e => {
          typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
        });
        const summary = Object.entries(typeCounts).map(([t, c]) => `${t} (${c})`);

        return {
          ...att,
          violations: evs.slice(0, 10),
          violations_summary: summary
        };
      });

      return {
        batch: {
          id: batch.id,
          branch_name: batch.branch_name,
          exam_name: batch.exam_name,
          batch_code: 'BATCH-' + batch.id.slice(0, 8).toUpperCase(),
          status: batch.status
        },
        candidates
      };
    }
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
