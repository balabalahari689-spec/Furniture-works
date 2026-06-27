import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

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

// Get Kanban board view data
router.get('/kanban', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Return all orders with their stages
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        stages: {
          include: {
            assignedEmployee: true
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update specific workflow stage
router.put('/stage/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      assignedEmployeeId,
      completionPercentage,
      comments,
      photos,
      delayIndicator
    } = req.body;

    const currentStage = await prisma.workflowStage.findUnique({
      where: { id },
      include: { order: { include: { stages: { orderBy: { createdAt: 'asc' } } } } }
    });

    if (!currentStage) {
      return res.status(404).json({ message: 'Stage not found' });
    }

    const completion = completionPercentage !== undefined ? parseInt(completionPercentage, 10) : currentStage.completionPercentage;
    const isCompleted = completion === 100 || status === 'COMPLETED';

    // Update the stage
    const updatedStage = await prisma.workflowStage.update({
      where: { id },
      data: {
        status: status || (isCompleted ? 'COMPLETED' : currentStage.status),
        assignedEmployeeId: assignedEmployeeId || undefined,
        completionPercentage: completion,
        comments: comments !== undefined ? comments : currentStage.comments,
        photos: photos !== undefined ? JSON.stringify(photos) : currentStage.photos,
        delayIndicator: delayIndicator !== undefined ? delayIndicator : currentStage.delayIndicator,
        actualCompletionDate: isCompleted ? new Date() : (completion < 100 ? null : currentStage.actualCompletionDate)
      }
    });

    // Refresh stage list for order calculations
    const stages = await prisma.workflowStage.findMany({
      where: { orderId: currentStage.orderId },
      orderBy: { createdAt: 'asc' }
    });

    const completedStagesCount = stages.filter(s => s.status === 'COMPLETED').length;
    const progressPercentage = Math.round((completedStagesCount / stages.length) * 100);

    // Determine overall order status and update next stage status
    let orderStatus = currentStage.order.status;
    const currentIdx = stages.findIndex(s => s.id === id);

    if (isCompleted && currentIdx < stages.length - 1) {
      // Auto-unlock next stage
      const nextStage = stages[currentIdx + 1];
      if (nextStage.status === 'PENDING') {
        await prisma.workflowStage.update({
          where: { id: nextStage.id },
          data: { status: 'IN_PROGRESS', completionPercentage: 10 }
        });
      }
      orderStatus = stages[currentIdx + 1].stageName.toUpperCase().replace(/ /g, '_');
    } else if (isCompleted && currentIdx === stages.length - 1) {
      orderStatus = 'DELIVERED';
    } else if (status === 'IN_PROGRESS' || status === 'DELAYED') {
      orderStatus = currentStage.stageName.toUpperCase().replace(/ /g, '_');
    }

    // Trigger alerts/notifications for delay indicators
    if (delayIndicator) {
      await prisma.notification.create({
        data: {
          title: 'Production Delay Alert',
          message: `Order ${currentStage.order.orderNumber} stage "${currentStage.stageName}" is experiencing delays.`,
          type: 'LATE_ORDER',
          orderId: currentStage.orderId
        }
      });
    }

    // Update the order metrics
    const updatedOrder = await prisma.order.update({
      where: { id: currentStage.orderId },
      data: {
        progressPercentage,
        status: orderStatus,
        deliveryDate: orderStatus === 'DELIVERED' ? new Date() : undefined
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_STAGE',
        details: `Updated stage "${currentStage.stageName}" for ${currentStage.order.orderNumber}. Progress: ${completion}%, Status: ${status || (isCompleted ? 'COMPLETED' : 'UPDATED')}`
      }
    });

    return res.json({
      stage: updatedStage,
      order: updatedOrder
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});


// Workflow stage engine
const WORKFLOW_STAGES = ['design', 'raw_material', 'carpentry', 'finishing', 'QC', 'dispatch'];

router.post('/advance', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { order_id, current_stage } = req.body;

    if (!order_id || !current_stage) {
      return res.status(400).json({ message: 'Missing order_id or current_stage' });
    }

    const targetStage = current_stage.toLowerCase().trim();
    if (!WORKFLOW_STAGES.includes(targetStage)) {
      return res.status(400).json({
        message: `Invalid stage. Must be one of: ${WORKFLOW_STAGES.join(', ')}`
      });
    }

    // 1. Fetch complete stage transition history for this order
    const history = await prisma.furniture_production_workflow_stage.findMany({
      where: { order_id },
      orderBy: { created_at: 'asc' }
    });

    let currentIdx = -1;
    if (history.length > 0) {
      const latestEntry = history[history.length - 1];
      currentIdx = WORKFLOW_STAGES.indexOf(latestEntry.stage);
    }

    const targetIdx = WORKFLOW_STAGES.indexOf(targetStage);

    // 2. Validate transition (no skipping stages)
    // If transitioning forward, it must be the immediate next stage
    if (targetIdx > currentIdx + 1) {
      const nextExpectedStage = currentIdx === -1 ? 'design' : WORKFLOW_STAGES[currentIdx + 1];
      return res.status(400).json({
        message: `Invalid transition. Cannot skip stages. Next stage must be "${nextExpectedStage}"`
      });
    }

    // 3. Create the new stage transition entry
    const newStageEntry = await prisma.furniture_production_workflow_stage.create({
      data: {
        order_id,
        stage: targetStage
      }
    });

    // 4. Update the main Order status if the order exists in SVS db
    // Maps 6-stage engine to order status definitions
    const statusMap: { [key: string]: string } = {
      design: 'DESIGN_APPROVED',
      raw_material: 'IN_PRODUCTION',
      carpentry: 'CARPENTRY',
      finishing: 'FINISHING',
      QC: 'QUALITY_CHECK',
      dispatch: 'READY_FOR_DISPATCH'
    };

    const svsStatus = statusMap[targetStage];
    if (svsStatus) {
      const svsOrder = await prisma.order.findUnique({ where: { id: order_id } });
      if (svsOrder) {
        await prisma.order.update({
          where: { id: order_id },
          data: { status: svsStatus }
        });
      }
    }

    // 5. Retrieve updated history list
    const updatedHistory = await prisma.furniture_production_workflow_stage.findMany({
      where: { order_id },
      orderBy: { created_at: 'asc' }
    });

    return res.json({
      status: 'SUCCESS',
      updatedStage: targetStage,
      history: updatedHistory
    });

  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

router.get('/:order_id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { order_id } = req.params;

    const history = await prisma.furniture_production_workflow_stage.findMany({
      where: { order_id },
      orderBy: { created_at: 'asc' }
    });

    return res.json(history);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;

