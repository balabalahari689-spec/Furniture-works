import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get active notifications
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to latest 50 notifications
    });
    return res.json(notifications);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true }
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;
