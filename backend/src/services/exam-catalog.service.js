import { pool } from '../db/connection.js';

export const OFFICIAL_GSFIN_EXAMS = [
  {
    id: 'exam-codex-haccp',
    name: 'CODEX HACCP',
    description: 'Hazard Analysis & Critical Control Points International Qualification Exam',
    duration_minutes: 60,
    max_attempts: 1
  },
  {
    id: 'exam-iso-22000',
    name: 'ISO 22000 Food Safety',
    description: 'Food Safety Management Systems Auditor & Implementer Qualification Exam',
    duration_minutes: 60,
    max_attempts: 1
  },
  {
    id: 'exam-food-safety',
    name: 'Food Safety Manager',
    description: 'Food Safety Manager Professional Certification Exam',
    duration_minutes: 60,
    max_attempts: 1
  },
  {
    id: 'exam-halal-audit',
    name: 'Halal Audit Certification',
    description: 'Halal Assurance System & Compliance Lead Auditor Exam',
    duration_minutes: 60,
    max_attempts: 1
  },
  {
    id: 'exam-brcgs',
    name: 'BRCGS Global Standard',
    description: 'BRCGS Global Standard for Food Safety Issue 9 Certification Exam',
    duration_minutes: 60,
    max_attempts: 1
  },
  {
    id: 'exam-fssc-22000',
    name: 'FSSC 22000 Lead Auditor',
    description: 'FSSC 22000 Scheme Certification Exam for Food Manufacturing & Packaging',
    duration_minutes: 60,
    max_attempts: 1
  },
  {
    id: 'exam-food-technology',
    name: 'Food Science & Technology',
    description: 'Advanced Food Processing, Innovation & Quality Technology Exam',
    duration_minutes: 60,
    max_attempts: 1
  },
  {
    id: 'exam-ghp-gmp',
    name: 'GHP & GMP Foundation',
    description: 'Good Hygiene Practices & Good Manufacturing Practices Compliance Exam',
    duration_minutes: 45,
    max_attempts: 1
  },
  {
    id: 'exam-microbiology',
    name: 'Food Microbiology',
    description: 'Food Pathogens, Spoilage & Laboratory Microbial Testing Exam',
    duration_minutes: 60,
    max_attempts: 1
  }
];

/**
 * Match a partner's selected program string against an exam title
 */
export function matchProgramWithExam(programString, examName) {
  if (!programString || !examName) return false;
  const p = String(programString).toLowerCase().trim();
  const e = String(examName).toLowerCase().trim();
  if (p === e) return true;

  const pNorm = p.replace(/[^a-z0-9]/g, '');
  const eNorm = e.replace(/[^a-z0-9]/g, '');
  if (!pNorm || !eNorm) return false;

  if (pNorm === eNorm || pNorm.includes(eNorm) || eNorm.includes(pNorm)) {
    return true;
  }

  // Domain keyword matching for GSFIN standards
  const domainKeywords = [
    'haccp', '22000', 'halal', 'brcgs', 'fssc',
    'microbiology', 'technology', 'safety', 'gmp', 'ghp'
  ];
  for (const kw of domainKeywords) {
    if (pNorm.includes(kw) && eNorm.includes(kw)) {
      return true;
    }
  }

  return false;
}

export class ExamCatalogService {
  /**
   * Sync official certifications into exams table and retire dummy tech entries
   */
  static async ensureExamsCatalog(client = pool) {
    try {
      // 1. Retire old hardcoded mock entries from legacy scaffolding
      await client.query(`
        UPDATE exams 
        SET status = 'retired' 
        WHERE id IN ('ex-cloud-architect', 'ex-cyber-security', 'ex-gdpr-compliance')
           OR name LIKE '%Cloud Systems Architecture%'
           OR name LIKE '%Cybersecurity Fundamentals%'
           OR name LIKE '%Global Data Privacy%'
      `);

      // 2. Normalize legacy food safety entries to GSFIN official naming
      await client.query(`
        UPDATE exams 
        SET name = 'CODEX HACCP', status = 'active' 
        WHERE id = 'ex-codex-haccp' OR name = 'Codex HACCP Lead Assessor Certification'
      `);
      await client.query(`
        UPDATE exams 
        SET name = 'ISO 22000 Food Safety', status = 'active' 
        WHERE id = 'ex-iso-22000' OR name = 'ISO 22000:2018 Food Safety Management Lead Auditor'
      `);

      // 3. Upsert official GSFIN standard exams
      for (const ex of OFFICIAL_GSFIN_EXAMS) {
        await client.query(`
          INSERT INTO exams (id, name, description, duration_minutes, max_attempts, status)
          VALUES (?, ?, ?, ?, ?, 'active')
          ON DUPLICATE KEY UPDATE 
            name = VALUES(name),
            description = VALUES(description),
            duration_minutes = VALUES(duration_minutes),
            status = 'active'
        `, [ex.id, ex.name, ex.description, ex.duration_minutes, ex.max_attempts]);
      }

      // 4. Sync any active qualifications from the qualifications table
      try {
        const [quals] = await client.query(`
          SELECT id, name, slug, short_description 
          FROM qualifications 
          WHERE is_active = 1 AND deleted_at IS NULL
        `);
        for (const q of quals) {
          const qualExamId = `exam-${q.slug || q.id}`;
          await client.query(`
            INSERT INTO exams (id, name, description, duration_minutes, max_attempts, status)
            VALUES (?, ?, ?, 60, 1, 'active')
            ON DUPLICATE KEY UPDATE 
              name = VALUES(name),
              status = 'active'
          `, [qualExamId, q.name, q.short_description || `${q.name} Certification Exam`]);
        }
      } catch (qualErr) {
        // qualifications table might not be initialized yet
      }
    } catch (err) {
      console.warn('ensureExamsCatalog warning:', err.message);
    }
  }

  /**
   * Return only authorized exams for a given sub-center organization
   */
  static async getAuthorizedExamsForOrg(orgId) {
    await ExamCatalogService.ensureExamsCatalog();

    // Fetch active exams excluding retired
    const [allExams] = await pool.query(`
      SELECT id, name, description, duration_minutes, max_attempts, status 
      FROM exams 
      WHERE status = 'active' 
      ORDER BY name ASC
    `);

    if (!orgId) {
      return allExams;
    }

    // Fetch organization approved programs
    const [orgs] = await pool.query(
      `SELECT programs FROM organizations WHERE id = ?`,
      [orgId]
    );

    if (orgs.length === 0 || !orgs[0].programs) {
      return allExams;
    }

    let orgPrograms = null;
    try {
      const parsed = typeof orgs[0].programs === 'string' 
        ? JSON.parse(orgs[0].programs) 
        : orgs[0].programs;
      if (Array.isArray(parsed) && parsed.length > 0) {
        orgPrograms = parsed;
      }
    } catch (e) {
      console.warn('Failed to parse org programs:', e);
    }

    if (!orgPrograms || orgPrograms.length === 0) {
      return allExams;
    }

    // Filter to only approved programs for this partner branch
    return allExams.filter(exam => {
      return orgPrograms.some(prog => matchProgramWithExam(prog, exam.name));
    });
  }

  /**
   * Check if organization is authorized for a specific exam
   */
  static async isOrgAuthorizedForExam(connection, orgId, examName) {
    if (!orgId) return true;

    const [orgs] = await connection.query(
      `SELECT programs FROM organizations WHERE id = ?`,
      [orgId]
    );
    if (orgs.length === 0 || !orgs[0].programs) return true;

    try {
      const programs = typeof orgs[0].programs === 'string' 
        ? JSON.parse(orgs[0].programs) 
        : orgs[0].programs;
      if (!Array.isArray(programs) || programs.length === 0) return true;

      return programs.some(prog => matchProgramWithExam(prog, examName));
    } catch (e) {
      return true;
    }
  }
}

