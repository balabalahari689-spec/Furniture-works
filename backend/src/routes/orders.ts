import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest, requireRoles } from '../middleware/auth';

const router = Router();

const STAGES_LIST = [
  'Design Approved',
  'Raw Material Sourced',
  'Carpentry',
  'Assembly',
  'Finishing',
  'Polishing',
  'Quality Check',
  'Packaging',
  'Ready for Dispatch',
  'Delivered'
];

// Get all orders with optional filter query parameters
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, category, woodType, search, employeeId, customerId } = req.query;

    let whereClause: any = {};

    if (status) {
      whereClause.status = status as string;
    }
    if (category) {
      whereClause.category = category as string;
    }
    if (woodType) {
      whereClause.woodType = woodType as string;
    }
    if (customerId) {
      whereClause.customerId = customerId as string;
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search as string } },
        { furnitureType: { contains: search as string } },
        { customer: { name: { contains: search as string } } }
      ];
    }

    if (employeeId) {
      whereClause.stages = {
        some: {
          assignedEmployeeId: employeeId as string
        }
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: true,
        stages: {
          include: {
            assignedEmployee: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Get single order details
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        stages: {
          include: {
            assignedEmployee: true
          },
          orderBy: { createdAt: 'asc' } // Keep stage order
        },
        inspections: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(order);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Create new order (Admin, PM, Sales Roles)
router.post('/', authenticateToken, requireRoles(['ADMIN', 'PRODUCTION_MANAGER', 'SALES']), async (req: AuthRequest, res) => {
  try {
    const {
      customerId,
      furnitureType,
      category,
      woodType,
      dimensions,
      quantity,
      estimatedCost,
      estimatedDeliveryDate,
      notes,
      designer,
      assignedCarpenter
    } = req.body;

    if (!customerId || !furnitureType || !category || !woodType || !dimensions || !quantity || !estimatedCost || !estimatedDeliveryDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Auto-generate order number (e.g. SVS-2026-1001)
    const orderCount = await prisma.order.count();
    const orderNumber = `SVS-${new Date().getFullYear()}-${1000 + orderCount + 1}`;

    const parsedEstDeliveryDate = new Date(estimatedDeliveryDate);
    const totalDays = Math.ceil((parsedEstDeliveryDate.getTime() - Date.now()) / (1000 * 3600 * 24));
    const daysPerStage = totalDays > 0 ? Math.max(1, Math.floor(totalDays / STAGES_LIST.length)) : 2;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        furnitureType,
        category,
        woodType,
        dimensions,
        quantity: parseInt(quantity, 10),
        estimatedCost: parseFloat(estimatedCost),
        estimatedDeliveryDate: parsedEstDeliveryDate,
        notes,
        designer,
        assignedCarpenter,
        status: 'DESIGN_APPROVED',
        progressPercentage: 10,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${orderNumber}`
      }
    });

    // Create default workflow stages
    const stagesData = STAGES_LIST.map((stageName, index) => {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + (index + 1) * daysPerStage);

      // The first stage starts completed or in progress
      let stageStatus = 'PENDING';
      let completion = 0;
      if (index === 0) {
        stageStatus = 'COMPLETED';
        completion = 100;
      } else if (index === 1) {
        stageStatus = 'IN_PROGRESS';
        completion = 10;
      }

      return {
        orderId: order.id,
        stageName,
        status: stageStatus,
        completionPercentage: completion,
        expectedCompletionDate: expectedDate,
        comments: index === 0 ? 'Design layout accepted by customer and production manager.' : null
      };
    });

    await prisma.workflowStage.createMany({
      data: stagesData
    });

    // Send notifications
    await prisma.notification.create({
      data: {
        title: 'New Order Placed',
        message: `Order ${orderNumber} for ${quantity}x ${furnitureType} has been successfully registered.`,
        type: 'ORDER_COMPLETED', // Generic status type
        orderId: order.id
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_ORDER',
        details: `Created order ${orderNumber} (${furnitureType})`
      }
    });

    // Retrieve order again with relations to return
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        stages: true
      }
    });

    return res.status(201).json(fullOrder);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Edit order details
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'PRODUCTION_MANAGER', 'SALES']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      furnitureType,
      category,
      woodType,
      dimensions,
      quantity,
      estimatedCost,
      finalCost,
      estimatedDeliveryDate,
      deliveryDate,
      notes,
      designer,
      assignedCarpenter,
      status
    } = req.body;

    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        furnitureType,
        category,
        woodType,
        dimensions,
        quantity: quantity ? parseInt(quantity, 10) : undefined,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        finalCost: finalCost ? parseFloat(finalCost) : undefined,
        estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        notes,
        designer,
        assignedCarpenter,
        status
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_ORDER',
        details: `Updated order ${updatedOrder.orderNumber}`
      }
    });

    return res.json(updatedOrder);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Delete order
router.delete('/:id', authenticateToken, requireRoles(['ADMIN', 'PRODUCTION_MANAGER']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await prisma.order.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'DELETE_ORDER',
        details: `Deleted order ${order.orderNumber}`
      }
    });

    return res.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;
