import prisma from '../db';

export const checkOverdueOrders = async () => {
  console.log('[Scheduler] Running daily check for overdue orders...');
  try {
    const now = new Date();
    const overdueOrders = await prisma.order.findMany({
      where: {
        status: { not: 'DELIVERED' },
        estimatedDeliveryDate: { lt: now }
      },
      include: {
        customer: true
      }
    });

    console.log(`[Scheduler] Found ${overdueOrders.length} overdue orders.`);

    for (const order of overdueOrders) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          orderId: order.id,
          type: 'LATE_ORDER'
        }
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            title: 'Overdue Order Alert',
            message: `Order ${order.orderNumber} for ${order.customer.name} is overdue! Estimated delivery was ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}.`,
            type: 'LATE_ORDER',
            orderId: order.id
          }
        });

        console.log(`[EMAIL ALERT] Sent email to manager/admin: Order ${order.orderNumber} is overdue.`);
        
        await prisma.auditLog.create({
          data: {
            action: 'OVERDUE_ALERT',
            details: `Automated system alert created for overdue order ${order.orderNumber}.`
          }
        });
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error checking overdue orders:', error);
  }
};

export const checkLowStockInventory = async () => {
  console.log('[Scheduler] Running daily check for low stock inventory...');
  try {
    const allItems = await prisma.inventoryItem.findMany();
    const lowStock = allItems.filter(item => item.currentStock <= item.lowStockThreshold);

    console.log(`[Scheduler] Found ${lowStock.length} low stock items.`);

    for (const item of lowStock) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          title: 'Low Stock Alert',
          message: { contains: item.name }
        }
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            title: 'Low Stock Alert',
            message: `Material "${item.name}" has dropped below threshold. Current stock: ${item.currentStock} ${item.unit}.`,
            type: 'LOW_INVENTORY'
          }
        });
        console.log(`[EMAIL ALERT] Sent low stock warning for item: ${item.name}`);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error checking low stock:', err);
  }
};

export const initScheduler = () => {
  // Run checks immediately on start
  checkOverdueOrders();
  checkLowStockInventory();

  // Run checks daily (every 24 hours)
  const intervalTime = 24 * 60 * 60 * 1000;
  setInterval(() => {
    checkOverdueOrders();
    checkLowStockInventory();
  }, intervalTime);
};
