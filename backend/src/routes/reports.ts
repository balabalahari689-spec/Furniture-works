import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Generate Reports
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { type, range } = req.query; // type: 'production' | 'revenue' | 'inventory' | 'performance', range: 'daily' | 'weekly' | 'monthly' | 'yearly'

    const now = new Date();
    let startDate = new Date();

    if (range === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (range === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'monthly') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (range === 'yearly') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate.setMonth(now.getMonth() - 1); // default 30 days
    }

    if (type === 'production') {
      const totalCreated = await prisma.order.count({
        where: { createdAt: { gte: startDate } }
      });
      const totalDelivered = await prisma.order.count({
        where: { status: 'DELIVERED', updatedAt: { gte: startDate } }
      });
      const activeProduction = await prisma.order.count({
        where: { status: { notIn: ['DELIVERED', 'DESIGN_APPROVED'] } }
      });

      // Group by status
      const statusGroups = await prisma.order.groupBy({
        by: ['status'],
        _count: true
      });

      // Find completed orders within range to compute duration trend
      const completedOrders = await prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          deliveryDate: { not: null },
          createdAt: { gte: startDate }
        },
        select: {
          orderNumber: true,
          createdAt: true,
          deliveryDate: true
        }
      });

      const completionTrends = completedOrders.map(o => {
        const durationDays = Math.ceil(
          (new Date(o.deliveryDate!).getTime() - new Date(o.createdAt).getTime()) / (1000 * 3600 * 24)
        );
        return {
          orderNumber: o.orderNumber,
          completionDate: o.deliveryDate!.toISOString().slice(0, 10),
          durationDays: Math.max(1, durationDays) // Minimum 1 day
        };
      }).sort((a, b) => a.completionDate.localeCompare(b.completionDate));

      return res.json({
        reportName: 'Production Workflow Report',
        period: range || 'monthly',
        metrics: {
          totalCreated,
          totalDelivered,
          activeProduction,
          statusDistribution: statusGroups,
          completionTrends
        }
      });
    }

    if (type === 'revenue') {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          estimatedCost: true,
          finalCost: true,
          status: true
        }
      });

      const totalEstimated = orders.reduce((sum, o) => sum + o.estimatedCost, 0);
      const totalRealized = orders.reduce((sum, o) => sum + (o.finalCost || 0), 0);
      const pendingRevenue = totalEstimated - totalRealized;

      return res.json({
        reportName: 'Financial Revenue Report',
        period: range || 'monthly',
        metrics: {
          totalEstimatedRevenue: totalEstimated,
          totalRealizedRevenue: totalRealized,
          pendingRevenue,
          ordersEvaluated: orders.length
        }
      });
    }

    if (type === 'inventory') {
      const items = await prisma.inventoryItem.findMany();
      const lowStockItems = items.filter(item => item.currentStock <= item.lowStockThreshold);
      const totalValuation = items.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);

      return res.json({
        reportName: 'Raw Material Inventory Report',
        period: 'real-time',
        metrics: {
          totalUniqueItems: items.length,
          lowStockAlertsCount: lowStockItems.length,
          lowStockItems: lowStockItems.map(i => ({ name: i.name, stock: i.currentStock, unit: i.unit })),
          totalValuation
        }
      });
    }

    if (type === 'performance') {
      const employees = await prisma.employee.findMany({
        select: {
          id: true,
          name: true,
          role: true,
          performanceScore: true,
          attendanceStatus: true
        },
        orderBy: { performanceScore: 'desc' }
      });

      return res.json({
        reportName: 'Worker Performance Roster Report',
        period: 'real-time',
        metrics: {
          totalActiveStaff: employees.length,
          averagePerformanceScore: employees.reduce((acc, emp) => acc + emp.performanceScore, 0) / (employees.length || 1),
          roster: employees
        }
      });
    }

    // Default: return overall operations report
    return res.json({ message: 'Please specify a report type: production, revenue, inventory, or performance.' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;
