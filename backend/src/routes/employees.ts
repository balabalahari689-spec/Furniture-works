import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest, requireRoles } from '../middleware/auth';

const router = Router();

// Get all employees
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        stagesAssigned: {
          include: {
            order: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.json(employees);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update employee attendance/performance (Admin, PM, Supervisor)
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { attendanceStatus, performanceScore } = req.body;

    const existingEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!existingEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        attendanceStatus: attendanceStatus || undefined,
        performanceScore: performanceScore !== undefined ? parseFloat(performanceScore) : undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_EMPLOYEE',
        details: `Updated employee ${updatedEmployee.name} details.`
      }
    });

    return res.json(updatedEmployee);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;
