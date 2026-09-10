import express from 'express';
import { pool } from '../db/connection.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);
router.use(authorizeRoles('super_admin', 'admin'));

// Helper to safely serialize array/object fields to JSON string for MySQL
const stringifyJson = (val) => {
  if (val === undefined || val === null) return JSON.stringify([]);
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
};

// Helper to parse JSON fields safely
const parseJsonField = (val) => {
  if (!val) return [];
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return [];
  }
};

// GET /api/admin/qualifications - List all qualifications
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM qualifications WHERE deleted_at IS NULL ORDER BY order_index ASC, id DESC'
    );

    const formatted = rows.map((q) => ({
      ...q,
      prerequisites: parseJsonField(q.prerequisites),
      key_modules: parseJsonField(q.key_modules),
      who_should_attend: parseJsonField(q.who_should_attend),
      benefits: parseJsonField(q.benefits),
      is_active: Boolean(q.is_active)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching admin qualifications:', error);
    res.status(500).json({ error: 'Server error fetching qualifications' });
  }
});

// GET /api/admin/qualifications/:id - Get single qualification
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM qualifications WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Qualification not found' });
    }

    const q = rows[0];
    res.json({
      ...q,
      prerequisites: parseJsonField(q.prerequisites),
      key_modules: parseJsonField(q.key_modules),
      who_should_attend: parseJsonField(q.who_should_attend),
      benefits: parseJsonField(q.benefits),
      is_active: Boolean(q.is_active)
    });
  } catch (error) {
    console.error('Error fetching qualification by id:', error);
    res.status(500).json({ error: 'Server error fetching qualification' });
  }
});

// POST /api/admin/qualifications - Create a qualification
router.post('/', async (req, res) => {
  const {
    slug,
    name,
    subtitle,
    short_description,
    full_description,
    category,
    level,
    duration,
    assessment_type,
    validity,
    prerequisites,
    key_modules,
    who_should_attend,
    benefits,
    badge_tag,
    image_url,
    icon_name,
    order_index,
    is_active
  } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Qualification name and slug are required' });
  }

  try {
    // Check if slug exists
    const [existing] = await pool.query(
      'SELECT id FROM qualifications WHERE slug = ? AND deleted_at IS NULL',
      [slug]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'A qualification with this slug already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO qualifications (
        slug, name, subtitle, short_description, full_description,
        category, level, duration, assessment_type, validity,
        prerequisites, key_modules, who_should_attend, benefits,
        badge_tag, image_url, icon_name, order_index, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name.trim(),
        subtitle || '',
        short_description || '',
        full_description || '',
        category || 'Food Safety',
        level || 'Advanced',
        duration || '',
        assessment_type || 'Online Examination',
        validity || 'Lifetime',
        stringifyJson(prerequisites),
        stringifyJson(key_modules),
        stringifyJson(who_should_attend),
        stringifyJson(benefits),
        badge_tag || '',
        image_url || '',
        icon_name || 'mdi-certificate',
        order_index ?? 0,
        is_active ?? true
      ]
    );

    res.status(201).json({ id: result.insertId, message: 'Qualification created successfully' });
  } catch (error) {
    console.error('Error creating qualification:', error);
    res.status(500).json({ error: 'Server error creating qualification' });
  }
});

// PUT /api/admin/qualifications/:id - Update a qualification
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    slug,
    name,
    subtitle,
    short_description,
    full_description,
    category,
    level,
    duration,
    assessment_type,
    validity,
    prerequisites,
    key_modules,
    who_should_attend,
    benefits,
    badge_tag,
    image_url,
    icon_name,
    order_index,
    is_active
  } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Qualification name and slug are required' });
  }

  try {
    // Check if slug is used by another ID
    const [existing] = await pool.query(
      'SELECT id FROM qualifications WHERE slug = ? AND id != ? AND deleted_at IS NULL',
      [slug, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'A qualification with this slug already exists' });
    }

    await pool.query(
      `UPDATE qualifications SET
        slug = ?,
        name = ?,
        subtitle = ?,
        short_description = ?,
        full_description = ?,
        category = ?,
        level = ?,
        duration = ?,
        assessment_type = ?,
        validity = ?,
        prerequisites = ?,
        key_modules = ?,
        who_should_attend = ?,
        benefits = ?,
        badge_tag = ?,
        image_url = ?,
        icon_name = ?,
        order_index = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL`,
      [
        slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name.trim(),
        subtitle || '',
        short_description || '',
        full_description || '',
        category || 'Food Safety',
        level || 'Advanced',
        duration || '',
        assessment_type || 'Online Examination',
        validity || 'Lifetime',
        stringifyJson(prerequisites),
        stringifyJson(key_modules),
        stringifyJson(who_should_attend),
        stringifyJson(benefits),
        badge_tag || '',
        image_url || '',
        icon_name || 'mdi-certificate',
        order_index ?? 0,
        is_active ?? true,
        id
      ]
    );

    res.json({ message: 'Qualification updated successfully' });
  } catch (error) {
    console.error('Error updating qualification:', error);
    res.status(500).json({ error: 'Server error updating qualification' });
  }
});

// PATCH /api/admin/qualifications/:id/toggle-active - Toggle is_active status
router.patch('/:id/toggle-active', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE qualifications SET is_active = NOT is_active, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    res.json({ message: 'Qualification status updated successfully' });
  } catch (error) {
    console.error('Error toggling qualification status:', error);
    res.status(500).json({ error: 'Server error updating status' });
  }
});

// DELETE /api/admin/qualifications/:id - Soft delete qualification
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE qualifications SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    res.json({ message: 'Qualification deleted successfully' });
  } catch (error) {
    console.error('Error deleting qualification:', error);
    res.status(500).json({ error: 'Server error deleting qualification' });
  }
});

export default router;
