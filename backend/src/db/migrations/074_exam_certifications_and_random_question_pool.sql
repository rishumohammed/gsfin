-- 074_exam_certifications_and_random_question_pool.sql
-- 1. Add qualification_id to public_exams
ALTER TABLE public_exams 
  ADD COLUMN qualification_id CHAR(36) NULL;

-- 2. Add assigned_question_ids to public_exam_attempts
ALTER TABLE public_exam_attempts 
  ADD COLUMN assigned_question_ids JSON NULL;

-- 3. Add index on qualification_id
CREATE INDEX idx_exam_qualification_id ON public_exams (qualification_id);

-- 4. Seed categories for food safety certifications if not present
INSERT IGNORE INTO public_exam_categories (id, name, slug, description, status) VALUES 
('cat-food-safety-001', 'Food Safety Standards', 'food-safety-standards', 'International food safety and hygiene qualification standards', 'active'),
('cat-mgmt-systems-002', 'Management Systems', 'management-systems', 'ISO and enterprise quality management systems', 'active'),
('cat-gfsi-standards-003', 'Global GFSI Standards', 'global-gfsi-standards', 'GFSI benchmarked global manufacturing standards', 'active');

-- 5. Seed an exam in public_exams for each qualification in qualifications if not already linked
INSERT IGNORE INTO public_exams (
    id, name, qualification_id, category_id, description, syllabus, duration_minutes,
    total_questions, total_marks, passing_marks, pass_percentage, difficulty_level,
    status, slug, instructions, enable_certificate, enable_proctoring
) VALUES 
('exam-codex-haccp', 'CODEX HACCP', 'qual-haccp-001', 'cat-food-safety-001',
 'Hazard Analysis & Critical Control Points — the cornerstone of food safety management worldwide.',
 'The GSFIN CODEX HACCP qualification provides comprehensive training and international certification on the 7 principles and 12 logic steps of HACCP as defined by the Codex Alimentarius Commission.',
 60, 10, 10, 5, 50, 'Medium', 'draft', 'codex-haccp',
 'Standard proctored examination for GSFIN Certification. 10 questions randomly sampled from question bank pool. 50% required to pass.',
 1, 1),

('exam-iso-22000', 'ISO 22000:2018', 'qual-iso22000-002', 'cat-mgmt-systems-002',
 'International standard for food safety management systems across the entire food supply chain.',
 'The GSFIN ISO 22000:2018 qualification is engineered for food safety professionals seeking mastery over ISO 22000 standards. It integrates High-Level Structure (HLS), PDCA cycles, and risk-based thinking.',
 60, 10, 10, 5, 50, 'Medium', 'draft', 'iso-22000',
 'Standard proctored examination for GSFIN Certification. 10 questions randomly sampled from question bank pool. 50% required to pass.',
 1, 1),

('exam-food-safety', 'Food Safety', 'qual-safety-003', 'cat-food-safety-001',
 'Comprehensive food safety principles, hygiene, contamination prevention, and compliance.',
 'The GSFIN Food Safety qualification establishes fundamental and operational excellence in food hygiene, allergen control, cross-contamination prevention, personal sanitation, and regulatory compliance.',
 45, 10, 10, 5, 50, 'Medium', 'draft', 'food-safety',
 'Standard proctored examination for GSFIN Certification. 10 questions randomly sampled from question bank pool. 50% required to pass.',
 1, 1),

('exam-food-technology', 'Food Technology', 'qual-tech-004', 'cat-food-safety-001',
 'A blend of food science and technology principles for modern food processing and innovation.',
 'The GSFIN Food Technology qualification bridges scientific principles with industrial food processing. Topics include thermal processing, non-thermal preservation, packaging, and shelf-life modeling.',
 60, 10, 10, 5, 50, 'Medium', 'draft', 'food-technology',
 'Standard proctored examination for GSFIN Certification. 10 questions randomly sampled from question bank pool. 50% required to pass.',
 1, 1),

('exam-brcgs', 'BRCGS', 'qual-brcgs-005', 'cat-gfsi-standards-003',
 'Global standard for retailers and foodservice sectors.',
 'The GSFIN BRCGS qualification prepares candidates for the rigorous demands of BRCGS Food Safety Issue 9 certification.',
 60, 10, 10, 5, 50, 'Medium', 'draft', 'brcgs',
 'Standard proctored examination for GSFIN Certification. 10 questions randomly sampled from question bank pool. 50% required to pass.',
 1, 1),

('exam-fssc-22000', 'FSSC 22000', 'qual-fssc-006', 'cat-gfsi-standards-003',
 'Food Safety System Certification recognized by GFSI worldwide.',
 'The GSFIN FSSC 22000 qualification provides deep domain expertise on the FSSC 22000 Version 6 scheme, combining ISO 22000 and sector PRPs.',
 60, 10, 10, 5, 50, 'Medium', 'draft', 'fssc-22000',
 'Standard proctored examination for GSFIN Certification. 10 questions randomly sampled from question bank pool. 50% required to pass.',
 1, 1),

('exam-ghp-gmp', 'GHP & GMP', 'qual-gmp-007', 'cat-food-safety-001',
 'Good Hygiene and Manufacturing Practices for safe food production.',
 'The GSFIN GHP & GMP qualification delivers foundational operational compliance in prerequisite programs, plant sanitation, and SOPs.',
 45, 10, 10, 5, 50, 'Medium', 'draft', 'ghp-gmp',
 'Standard proctored examination for GSFIN Certification. 10 questions randomly sampled from question bank pool. 50% required to pass.',
 1, 1),

('exam-food-microbiology', 'Food Microbiology', 'qual-microbiology-008', 'cat-food-safety-001',
 'Understanding microbial hazards, hygiene practices, and testing methods.',
 'The GSFIN Food Microbiology qualification provides specialized training on foodborne pathogens, EMP, and lab sampling protocols.',
 60, 10, 10, 5, 50, 'Medium', 'draft', 'food-microbiology',
 'Standard proctored examination for GSFIN Certification. 10 questions randomly sampled from question bank pool. 50% required to pass.',
 1, 1);
