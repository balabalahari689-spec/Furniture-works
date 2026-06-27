import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest, requireRoles } from '../middleware/auth';

const router = Router();

// Get all customers
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: true
      },
      orderBy: { name: 'asc' }
    });
    return res.json(customers);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Create customer record (Admin, PM, Sales)
router.post('/', authenticateToken, requireRoles(['ADMIN', 'PRODUCTION_MANAGER', 'SALES']), async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Name, phone number and address are required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_CUSTOMER',
        details: `Created customer profile for ${name}`
      }
    });

    return res.status(201).json(customer);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;
