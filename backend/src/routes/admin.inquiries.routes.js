import express from 'express';
import { pool } from '../db/connection.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT, authorizeRoles('super_admin', 'main_admin', 'sub_admin', 'admin'));

// GET /api/admin/inquiries - List all contact & partner submissions
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = 'SELECT * FROM contact_submissions WHERE 1=1';
    const params = [];

    if (type === 'partner') {
      query += ' AND subject LIKE "%Partner Application%"';
    } else if (type === 'general') {
      query += ' AND subject NOT LIKE "%Partner Application%"';
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY submitted_at DESC LIMIT 200';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admin inquiries:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// GET /api/admin/inquiries/:id - Get single inquiry details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [[inquiry]] = await pool.query('SELECT * FROM contact_submissions WHERE id = ?', [id]);

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry submission not found' });
    }

    res.json(inquiry);
  } catch (error) {
    console.error('Error fetching inquiry detail:', error);
    res.status(500).json({ error: 'Failed to fetch inquiry detail' });
  }
});

// PATCH /api/admin/inquiries/:id/status - Update inquiry status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    await pool.query('UPDATE contact_submissions SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Inquiry status updated successfully' });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ error: 'Failed to update inquiry status' });
  }
});

// DELETE /api/admin/inquiries/:id - Delete submission
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM contact_submissions WHERE id = ?', [id]);
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

export default router;
