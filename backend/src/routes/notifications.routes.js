import express from 'express';
import { pool } from '../db/connection.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { createNotification, broadcastToRole } from '../services/notification.service.js';

const router = express.Router();

// Require authentication for all notification routes
router.use(authenticateJWT);

let tableChecked = false;
const ensureNotificationsTable = async () => {
  if (tableChecked) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(555) NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_user (user_id, created_at),
        INDEX idx_notif_user_read (user_id, is_read)
      )
    `);
    tableChecked = true;
  } catch (err) {
    console.error('Failed to ensure notifications table:', err);
  }
};

// GET /api/notifications - Get current user's notifications (latest 50)
router.get('/', async (req, res) => {
  try {
    await ensureNotificationsTable();
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT id, user_id, type, title, message, link, is_read, read_at, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    const formatted = rows.map((n) => ({
      ...n,
      is_read: Boolean(n.is_read)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count - Get unread count for badge
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    const [[result]] = await pool.query(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ unread_count: result ? result.unread_count : 0 });
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PUT /api/notifications/read-all - Mark all user notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// PUT /api/notifications/:id/read - Mark specific notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// POST /api/notifications/send - Send a notification to specific user or self (Admin feature)
router.post('/send', authorizeRoles('super_admin', 'main_admin', 'sub_admin', 'admin'), async (req, res) => {
  try {
    const { targetUserId, type = 'info', title, message, link, emailNotify = false } = req.body;
    const recipientId = targetUserId || req.user.id;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const notifId = await createNotification({
      userId: recipientId,
      type,
      title,
      message,
      link,
      emailNotify
    });

    res.status(201).json({ id: notifId, message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending targeted notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /api/notifications/broadcast - Broadcast system notification to all users or role (Admin feature)
router.post('/broadcast', authorizeRoles('super_admin', 'main_admin'), async (req, res) => {
  try {
    const { role = 'all', type = 'announcement', title, message, link, emailNotify = false } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const count = await broadcastToRole({ role, type, title, message, link, emailNotify });

    res.json({ message: `Broadcast sent to ${count} users` });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

export default router;
