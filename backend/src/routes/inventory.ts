import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest, requireRoles } from '../middleware/auth';

const router = Router();

// Get all inventory items
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(items);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Add new raw material item (Admin, PM)
router.post('/', authenticateToken, requireRoles(['ADMIN', 'PRODUCTION_MANAGER']), async (req: AuthRequest, res) => {
  try {
    const { name, category, woodType, supplier, currentStock, lowStockThreshold, unit, costPerUnit } = req.body;

    if (!name || !category || currentStock === undefined || lowStockThreshold === undefined || !unit || !costPerUnit) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        woodType,
        supplier,
        currentStock: parseFloat(currentStock),
        lowStockThreshold: parseFloat(lowStockThreshold),
        unit,
        costPerUnit: parseFloat(costPerUnit),
        purchaseDate: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ADD_INVENTORY',
        details: `Added new inventory item: ${name} (${category})`
      }
    });

    return res.status(201).json(item);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update stock level (Stock In / Stock Out)
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { quantity, action } = req.body; // action: 'IN' or 'OUT', quantity: positive number

    if (!quantity || !action || !['IN', 'OUT'].includes(action)) {
      return res.status(400).json({ message: 'Valid quantity and action (IN/OUT) required' });
    }

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const qtyChange = parseFloat(quantity);
    let newStock = item.currentStock;

    if (action === 'IN') {
      newStock += qtyChange;
    } else {
      if (item.currentStock < qtyChange) {
        return res.status(400).json({ message: 'Insufficient stock available' });
      }
      newStock -= qtyChange;
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: { currentStock: newStock }
    });

    // Check low stock alert
    if (newStock <= item.lowStockThreshold) {
      await prisma.notification.create({
        data: {
          title: 'Low Inventory Alert',
          message: `Stock level for "${item.name}" is low (${newStock} ${item.unit} remaining).`,
          type: 'LOW_INVENTORY'
        }
      });
    }

    // Log movement
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: `STOCK_${action}`,
        details: `Adjusted ${item.name} stock level by ${action === 'IN' ? '+' : '-'}${qtyChange} ${item.unit}. New Stock: ${newStock}`
      }
    });

    return res.json(updatedItem);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// List unique suppliers
router.get('/suppliers', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      select: { supplier: true },
      where: { supplier: { not: null } }
    });
    const suppliers = Array.from(new Set(items.map(i => i.supplier).filter(Boolean)));
    return res.json(suppliers);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;
