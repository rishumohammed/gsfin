import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aems_db',
});

const qualifications = [
  {
    id: 'qual-haccp-001',
    slug: 'codex-haccp',
    name: 'CODEX HACCP',
    subtitle: 'Hazard Analysis & Critical Control Points International Qualification',
    short_description: 'Hazard Analysis & Critical Control Points — the cornerstone of food safety management worldwide.',
    full_description: 'The GSFIN CODEX HACCP qualification provides comprehensive training and international certification on the 7 principles and 12 logic steps of HACCP as defined by the Codex Alimentarius Commission. Candidates learn how to conduct hazard analysis, establish critical limits, design monitoring systems, and implement corrective action frameworks in commercial food processing environments.',
    category: 'Food Safety Standard',
    level: 'Advanced Level',
    duration: '35 Hours Self-Paced + Exam',
    assessment_type: 'Proctored Computer-Based Exam (MCQ & Scenario Analysis)',
    validity: '3 Years International Recognition',
    prerequisites: 'Basic knowledge of food handling, hygiene practices, or food production environments.',
    key_modules: JSON.stringify([
      'Introduction to Codex Alimentarius & Global Food Regulations',
      'The 5 Preliminary Steps of HACCP System Implementation',
      'Principle 1: Conducting Comprehensive Biological, Chemical & Physical Hazard Analysis',
      'Principle 2: Determining Critical Control Points (CCPs) Using Decision Trees',
      'Principle 3 & 4: Establishing Critical Limits & Monitoring Procedures',
      'Principle 5 & 6: Establishing Corrective Actions & Verification Procedures',
      'Principle 7: Documentation, Recordkeeping & HACCP Auditing Readiness'
    ]),
    who_should_attend: JSON.stringify([
      'Food Safety Managers & Quality Assurance Officers',
      'HACCP Team Leaders & Internal Auditors',
      'Food Processing Engineers & Technical Supervisors',
      'Catering & Hospitality Hygiene Managers'
    ]),
    benefits: JSON.stringify([
      'Globally verified GSFIN Certificate with digital QR verification',
      'Equips professionals to design regulatory-compliant HACCP plans',
      'Enhances institutional accreditation for authorized training partners',
      'Prepares candidates for ISO 22000 & GFSI audit protocols'
    ]),
    badge_tag: 'GSFIN Standard',
    image_url: '/img/course-haccp.jpg',
    icon_name: 'mdi-shield-check-outline',
    order_index: 1,
    is_active: 1,
  },
  {
    id: 'qual-iso22000-002',
    slug: 'iso-22000',
    name: 'ISO 22000:2018',
    subtitle: 'Food Safety Management Systems Auditor & Implementer Qualification',
    short_description: 'International standard for food safety management systems across the entire food supply chain.',
    full_description: 'The GSFIN ISO 22000:2018 qualification is engineered for food safety professionals seeking mastery over ISO 22000 standards. It integrates High-Level Structure (HLS), Plan-Do-Check-Act (PDCA) cycles at organizational and operational levels, and risk-based thinking for food safety management across global supply chains.',
    category: 'Management Systems',
    level: 'Professional Level',
    duration: '40 Hours Self-Paced + Exam',
    assessment_type: 'Proctored Online Exam & Case Study Evaluation',
    validity: '3 Years International Recognition',
    prerequisites: 'Familiarity with basic food safety principles or prior HACCP qualification recommended.',
    key_modules: JSON.stringify([
      'Context of the Organization & Food Safety Culture',
      'Leadership Commitment & Policy Formulation',
      'Planning: Addressing Risks, Opportunities & Food Safety Objectives',
      'Operational Planning: PRPs, OPRPs, and HACCP Integration',
      'Performance Evaluation, Internal Audits & Management Review',
      'Continual Improvement & ISO 22000 Revision Transition'
    ]),
    who_should_attend: JSON.stringify([
      'Quality Directors & Compliance Managers',
      'ISO 22000 Consultants & Lead Auditors',
      'Supply Chain & Procurement Directors',
      'Food Manufacturing Facility Supervisors'
    ]),
    benefits: JSON.stringify([
      'Mastery of ISO 22000:2018 global audit requirements',
      'Globally verifiable credential for career progression',
      'Empowers training centers to grant accredited ISO certification'
    ]),
    badge_tag: 'GSFIN Standard',
    image_url: '/img/course-iso22000.jpg',
    icon_name: 'mdi-certificate-outline',
    order_index: 2,
    is_active: 1,
  },
  {
    id: 'qual-safety-003',
    slug: 'food-safety',
    name: 'Food Safety',
    subtitle: 'Comprehensive Food Hygiene, Safety & Compliance Qualification',
    short_description: 'Comprehensive food safety principles, hygiene, contamination prevention, and compliance.',
    full_description: 'The GSFIN Food Safety qualification establishes fundamental and operational excellence in food hygiene, allergen control, cross-contamination prevention, personal sanitation, and regulatory compliance. Designed for all food handling sectors from manufacturing to retail and food service.',
    category: 'General Safety',
    level: 'Foundation Level',
    duration: '25 Hours Self-Paced + Exam',
    assessment_type: 'Online Multiple-Choice Examination',
    validity: '3 Years International Recognition',
    prerequisites: 'No prior prerequisites required.',
    key_modules: JSON.stringify([
      'Fundamentals of Food Microbiology & Foodborne Illnesses',
      'Personal Hygiene & Employee Sanitation Standards',
      'Cross-Contamination Prevention & Allergen Management',
      'Time-Temperature Control for Food Safety (TCS)',
      'Cleaning, Sanitization & Facility Pest Control',
      'Regulatory Inspection Preparation & Best Practices'
    ]),
    who_should_attend: JSON.stringify([
      'Food Handlers, Chefs, & Culinary Staff',
      'Restaurant & Catering Supervisors',
      'Retail Food Store & Supermarket Managers',
      'Food Processing Entry-Level Personnel'
    ]),
    benefits: JSON.stringify([
      'Essential hygiene qualification required by international food establishments',
      'Verifiable digital certificate for employment portfolio',
      'Ensures compliance with international health department regulations'
    ]),
    badge_tag: 'GSFIN Standard',
    image_url: '/img/course-food-safety.jpg',
    icon_name: 'mdi-hand-wash-outline',
    order_index: 3,
    is_active: 1,
  },
  {
    id: 'qual-tech-004',
    slug: 'food-technology',
    name: 'Food Technology',
    subtitle: 'Modern Food Science, Processing & Innovation Qualification',
    short_description: 'A blend of food science and technology principles for modern food processing and innovation.',
    full_description: 'The GSFIN Food Technology qualification bridges scientific principles with industrial food processing. Topics include thermal processing, non-thermal preservation, food packaging dynamics, shelf-life modeling, food chemistry, sensory evaluation, and sustainable product development.',
    category: 'Food Science & Tech',
    level: 'Advanced Level',
    duration: '45 Hours Self-Paced + Exam',
    assessment_type: 'Online Exam & Practical Scenario Assessment',
    validity: '3 Years International Recognition',
    prerequisites: 'Diploma or degree in science, chemistry, biology, or food engineering recommended.',
    key_modules: JSON.stringify([
      'Food Chemistry & Compositional Analysis',
      'Thermal & Non-Thermal Food Preservation Techniques',
      'Novel Packaging Technologies & Active/Intelligent Packaging',
      'Sensory Evaluation & Quality Control Assays',
      'Shelf-Life Determination & Accelerated Testing Methods',
      'Emerging Trends: Alternative Proteins & Clean Label Products'
    ]),
    who_should_attend: JSON.stringify([
      'Food Technologists & Product Development Scientists',
      'Quality Control Specialists in Food Plants',
      'R&D Engineers in Commercial Food Enterprises',
      'Students of Food Science & Bio-Technology'
    ]),
    benefits: JSON.stringify([
      'High-demand technical qualification for R&D and QA leadership',
      'Understands modern sustainable packaging & processing trends',
      'International accreditation recognized by food industries globally'
    ]),
    badge_tag: 'GSFIN Standard',
    image_url: '/img/course-food-tech.png',
    icon_name: 'mdi-flask-outline',
    order_index: 4,
    is_active: 1,
  },
  {
    id: 'qual-brcgs-005',
    slug: 'brcgs',
    name: 'BRCGS',
    subtitle: 'British Retail Consortium Global Standard Qualification',
    short_description: 'Global standard for retailers and foodservice sectors.',
    full_description: 'The GSFIN BRCGS qualification prepares candidates for the rigorous demands of BRCGS Food Safety Issue 9 certification. Covering senior management commitment, environmental monitoring, product authenticity, food defense, and supplier approval standards required by major international retailers.',
    category: 'Global GFSI Standards',
    level: 'Professional Level',
    duration: '35 Hours Self-Paced + Exam',
    assessment_type: 'Proctored Online Exam',
    validity: '3 Years International Recognition',
    prerequisites: 'Knowledge of HACCP or food safety management systems.',
    key_modules: JSON.stringify([
      'BRCGS Food Safety Issue 9 Standard Requirements',
      'Senior Management Commitment & Quality Culture',
      'The Food Safety Plan — HACCP Compliance',
      'Site Standards & Environmental Monitoring',
      'Product Control, Testing & Authenticity Verification',
      'Process Control, Personnel Hygiene & Audit Readiness'
    ]),
    who_should_attend: JSON.stringify([
      'Export Facility Quality Managers',
      'Retailer Compliance Officers & Auditors',
      'Food Packaging & Processing Plant Engineers'
    ]),
    benefits: JSON.stringify([
      'Demonstrates expertise in GFSI-benchmarked retail supply chain standards',
      'Prepares facilities for unannounced BRCGS audits',
      'Unlocks global commercial trade credentials'
    ]),
    badge_tag: 'GSFIN Standard',
    image_url: '/img/course-brcgs.jpg',
    icon_name: 'mdi-store-check-outline',
    order_index: 5,
    is_active: 1,
  },
  {
    id: 'qual-fssc-006',
    slug: 'fssc-22000',
    name: 'FSSC 22000',
    subtitle: 'Food Safety System Certification Scheme v6 Qualification',
    short_description: 'Food Safety System Certification recognized by GFSI worldwide.',
    full_description: 'The GSFIN FSSC 22000 qualification provides deep domain expertise on the FSSC 22000 Version 6 scheme. It combines ISO 22000 requirements, sector-specific PRPs (ISO/TS 22002-1), and FSSC additional requirements including food fraud prevention, food defense, equipment design, and allergen management.',
    category: 'Global GFSI Standards',
    level: 'Professional Level',
    duration: '40 Hours Self-Paced + Exam',
    assessment_type: 'Proctored Computer-Based Examination',
    validity: '3 Years International Recognition',
    prerequisites: 'ISO 22000 or HACCP certification recommended.',
    key_modules: JSON.stringify([
      'Overview of FSSC 22000 Version 6 Scheme',
      'Integration of ISO 22000 & Sector PRPs (ISO/TS 22002-1)',
      'FSSC Additional Requirements: Food Fraud Mitigation',
      'Food Defense Threat Assessment & Plan Execution',
      'Equipment Hygiene Design & Allergen Management',
      'Audit Methodology & Non-Conformity Management'
    ]),
    who_should_attend: JSON.stringify([
      'Food Manufacturing Technical Managers',
      'FSSC 22000 Lead Auditors & Internal Auditors',
      'Corporate Quality Assurance Directors'
    ]),
    benefits: JSON.stringify([
      'Highest international GFSI audit benchmark credential',
      'Globally verifiable credential accepted by multi-national brand networks',
      'Ensures regulatory compliance across international export markets'
    ]),
    badge_tag: 'GSFIN Standard',
    image_url: '/img/course-fssc.jpg',
    icon_name: 'mdi-shield-crown-outline',
    order_index: 6,
    is_active: 1,
  },
  {
    id: 'qual-gmp-007',
    slug: 'ghp-gmp',
    name: 'GHP & GMP',
    subtitle: 'Good Hygiene Practices & Good Manufacturing Practices Qualification',
    short_description: 'Good Hygiene and Manufacturing Practices for safe food production.',
    full_description: 'The GSFIN GHP & GMP qualification delivers foundational operational compliance in prerequisite programs. Topics include sanitary plant design, equipment maintenance, water quality, personal hygiene, waste management, pest control, and standard operating procedures (SOPs).',
    category: 'Prerequisite Programs',
    level: 'Foundation Level',
    duration: '25 Hours Self-Paced + Exam',
    assessment_type: 'Online Objective Examination',
    validity: '3 Years International Recognition',
    prerequisites: 'No prior prerequisites required.',
    key_modules: JSON.stringify([
      'Principles of Good Hygiene Practices (GHP)',
      'Good Manufacturing Practices (GMP) Infrastructure & Design',
      'Equipment Maintenance, Calibration & Sanitation',
      'Water, Air & Chemical Hygiene Controls',
      'Waste Management & Environmental Protection',
      'SOP Development & Operational Sanitation Records'
    ]),
    who_should_attend: JSON.stringify([
      'Food Plant Production Operators',
      'Sanitation & Maintenance Technicians',
      'Catering Supervisors & Warehouse Officers'
    ]),
    benefits: JSON.stringify([
      'Prerequisite foundation required before implementing HACCP',
      'Verifiable GSFIN certificate for industrial compliance',
      'Improves plant sanitation and reduces contamination risk'
    ]),
    badge_tag: 'GSFIN Standard',
    image_url: '/img/course-ghp-gmp.jpg',
    icon_name: 'mdi-cog-box',
    order_index: 7,
    is_active: 1,
  },
  {
    id: 'qual-microbiology-008',
    slug: 'food-microbiology',
    name: 'Food Microbiology',
    subtitle: 'Microbial Hazards, Hygiene Testing & Pathogen Control Qualification',
    short_description: 'Understanding microbial hazards, hygiene practices, and testing methods.',
    full_description: 'The GSFIN Food Microbiology qualification provides specialized training on foodborne pathogens (Salmonella, Listeria, E. coli), indicator organisms, spoilage mechanisms, environmental monitoring programs (EMP), rapid diagnostic testing methods, and lab sampling protocols.',
    category: 'Food Laboratory & Testing',
    level: 'Advanced Level',
    duration: '35 Hours Self-Paced + Exam',
    assessment_type: 'Online Exam & Laboratory Data Interpretation',
    validity: '3 Years International Recognition',
    prerequisites: 'Basic background in science or biology recommended.',
    key_modules: JSON.stringify([
      'Classification of Microorganisms in Foods',
      'Major Foodborne Pathogens & Disease Mechanisms',
      'Factors Influencing Microbial Growth (Intrinsic & Extrinsic)',
      'Environmental Monitoring Programs (EMP) & Swabbing Protocols',
      'Microbiological Culture Assays & Rapid Testing Technologies',
      'Interpreting Lab Certificates of Analysis (CoA) & Micro Standards'
    ]),
    who_should_attend: JSON.stringify([
      'Microbiologists & Food Laboratory Technicians',
      'Sanitation Managers & Hygiene Inspectors',
      'Quality Control Analysts in Food & Beverage Facilities'
    ]),
    benefits: JSON.stringify([
      'Specialized lab qualification highly valued in commercial testing labs',
      'Mastery over Environmental Monitoring & Pathogen Control',
      'Verifiable GSFIN credential for career growth'
    ]),
    badge_tag: 'GSFIN Standard',
    image_url: '/img/course-microbiology.jpg',
    icon_name: 'mdi-bacteria-outline',
    order_index: 8,
    is_active: 1,
  }
];

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Ensuring qualifications table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS qualifications (
          id CHAR(36) PRIMARY KEY,
          slug VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          subtitle VARCHAR(255) NULL,
          short_description TEXT NULL,
          full_description LONGTEXT NULL,
          category VARCHAR(100) DEFAULT 'Food Safety Standard',
          level VARCHAR(50) DEFAULT 'Professional',
          duration VARCHAR(100) DEFAULT '30 Hours Self-Paced',
          assessment_type VARCHAR(100) DEFAULT 'Online Exam',
          validity VARCHAR(100) DEFAULT '3 Years Global Validity',
          prerequisites TEXT NULL,
          key_modules JSON NULL,
          who_should_attend JSON NULL,
          benefits JSON NULL,
          badge_tag VARCHAR(100) DEFAULT 'GSFIN Standard',
          image_url VARCHAR(500) NULL,
          icon_name VARCHAR(100) DEFAULT 'mdi-shield-check-outline',
          order_index INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL
      )
    `);

    console.log('🌱 Seeding initial 8 GSFIN qualifications...');
    for (const q of qualifications) {
      await conn.query(`
        INSERT INTO qualifications (
          id, slug, name, subtitle, short_description, full_description,
          category, level, duration, assessment_type, validity, prerequisites,
          key_modules, who_should_attend, benefits, badge_tag, image_url, icon_name,
          order_index, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          subtitle = VALUES(subtitle),
          short_description = VALUES(short_description),
          full_description = VALUES(full_description),
          category = VALUES(category),
          level = VALUES(level),
          duration = VALUES(duration),
          assessment_type = VALUES(assessment_type),
          validity = VALUES(validity),
          prerequisites = VALUES(prerequisites),
          key_modules = VALUES(key_modules),
          who_should_attend = VALUES(who_should_attend),
          benefits = VALUES(benefits),
          badge_tag = VALUES(badge_tag),
          image_url = VALUES(image_url),
          icon_name = VALUES(icon_name),
          order_index = VALUES(order_index),
          is_active = VALUES(is_active)
      `, [
        q.id, q.slug, q.name, q.subtitle, q.short_description, q.full_description,
        q.category, q.level, q.duration, q.assessment_type, q.validity, q.prerequisites,
        q.key_modules, q.who_should_attend, q.benefits, q.badge_tag, q.image_url, q.icon_name,
        q.order_index, q.is_active
      ]);
      console.log(`  ✅ Seeded: ${q.name} (${q.slug})`);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
