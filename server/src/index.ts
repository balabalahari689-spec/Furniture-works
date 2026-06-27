import express from "express";
import cors from "cors";
import * as http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { authenticateJWT, authorizeRoles, JWT_SECRET, AuthRequest } from "./middleware/auth";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// WebSocket connection handling
const clients = new Set<WebSocket>();
wss.on("connection", (ws: WebSocket) => {
  clients.add(ws);
  console.log(`WebSocket client connected. Total clients: ${clients.size}`);
  
  ws.on("close", () => {
    clients.delete(ws);
    console.log(`WebSocket client disconnected. Total clients: ${clients.size}`);
  });
});

// Upgrade HTTP request to WebSocket
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Helper to broadcast WebSocket messages
const broadcast = (data: any) => {
  const payload = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

// Log helper to write audit logs and broadcast changes
const logActivity = async (userId: string | null, email: string | null, action: string, details: string) => {
  try {
    const log = await prisma.auditLog.create({
      data: { userId, userEmail: email, action, details },
    });
    broadcast({ type: "AUDIT_LOG", data: log });
    return log;
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

// Create a Notification and broadcast
const createNotification = async (title: string, message: string, nType: string, role?: string, userId?: string) => {
  try {
    const notification = await prisma.notification.create({
      data: { title, message, type: nType, role, userId },
    });
    broadcast({ type: "NOTIFICATION", data: notification });
    return notification;
  } catch (err) {
    console.error("Notification creation error:", err);
  }
};

// ----------------------------------------------------
// AUTHENTICATION ROUTE
// ----------------------------------------------------
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password, role, name, department } = req.body;
  if (!username || !email || !password || !role || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        name,
      },
    });

    if (role !== "ADMIN" && role !== "SALES_TEAM") {
      await prisma.employee.create({
        data: {
          userId: user.id,
          department: department || "Carpentry",
          productivity: 90.0,
        },
      });
    }

    await logActivity(user.id, user.email, "USER_REGISTRATION", `Registered user ${user.username} as ${user.role}`);

    res.status(201).json({ message: "User registered successfully", userId: user.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to register user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    await logActivity(user.id, user.email, "USER_LOGIN", `User ${user.username} logged in successfully`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

app.get("/api/auth/me", authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user: req.user });
});

// ----------------------------------------------------
// DASHBOARD & ANALYTICS SUMMARY
// ----------------------------------------------------
app.get("/api/dashboard/summary", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const totalOrders = await prisma.order.count();
    const todayOrdersCount = await prisma.order.count({
      where: { createdAt: { gte: startOfToday } },
    });
    const pendingOrdersCount = await prisma.order.count({
      where: { currentStage: { notIn: ["DELIVERED"] } },
    });
    const completedOrdersCount = await prisma.order.count({
      where: { currentStage: "DELIVERED" },
    });
    const inProductionCount = await prisma.order.count({
      where: { currentStage: { in: ["CARPENTRY", "ASSEMBLY", "FINISHING", "POLISHING"] } },
    });
    const qcPendingCount = await prisma.order.count({
      where: { currentStage: "QUALITY_CHECK" },
    });
    const readyDispatchCount = await prisma.order.count({
      where: { currentStage: "READY_FOR_DISPATCH" },
    });

    // Sum of estimated cost for revenue or sum of final cost for completed orders
    const completedOrders = await prisma.order.findMany({
      where: { currentStage: "DELIVERED" },
      select: { finalCost: true, estimatedCost: true },
    });
    const revenue = completedOrders.reduce((sum, o) => sum + (o.finalCost || o.estimatedCost || 0), 0);

    // Count of low stock inventory items
    const inventoryItems = await prisma.inventory.findMany();
    const lowStockCount = inventoryItems.filter(item => item.currentStock <= item.minStockAlert).length;

    // Recent activities (Audit Logs)
    const recentActivity = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Upcoming deadlines (deliveryDate is in the future, order is not delivered)
    const upcomingDeadlines = await prisma.order.findMany({
      where: {
        currentStage: { not: "DELIVERED" },
        deliveryDate: { gte: new Date() },
      },
      orderBy: { deliveryDate: "asc" },
      take: 5,
      include: { customer: true },
    });

    // Notifications
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Performance Metrics (Employee Productivity)
    const employees = await prisma.employee.findMany({
      include: { user: true },
    });
    const performanceMetrics = employees.map(emp => ({
      name: emp.user.name,
      department: emp.department,
      productivity: emp.productivity,
      status: emp.status,
    }));

    // Recharts Data
    // 1. Stage Distribution (Production Status)
    const stages = [
      "DESIGN_APPROVED", "MATERIAL_SOURCED", "CARPENTRY", "ASSEMBLY", 
      "FINISHING", "POLISHING", "QUALITY_CHECK", "PACKAGING", 
      "READY_FOR_DISPATCH", "DELIVERED"
    ];
    const productionStatus = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.order.count({ where: { currentStage: stage } });
        return { name: stage.replace("_", " "), count };
      })
    );

    // 2. Inventory Stock levels
    const inventoryUsage = inventoryItems.map(item => ({
      name: item.itemName.substring(0, 15) + "...",
      stock: item.currentStock,
      min: item.minStockAlert,
    }));

    // 3. Top Products Categories
    const ordersList = await prisma.order.findMany({ select: { category: true, furnitureType: true } });
    const categoryCounts: Record<string, number> = {};
    ordersList.forEach(o => {
      categoryCounts[o.category] = (categoryCounts[o.category] || 0) + 1;
    });
    const topProducts = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      value: categoryCounts[cat],
    }));

    // 4. Monthly Production Completion & Revenue
    // Hardcoded realistic mock historical chart data for Recharts, combined with actual DB data
    const monthlyStats = [
      { month: "Jan", orders: 3, revenue: 320000 },
      { month: "Feb", orders: 4, revenue: 450000 },
      { month: "Mar", orders: 2, revenue: 210000 },
      { month: "Apr", orders: 6, revenue: 580000 },
      { month: "May", orders: 5, revenue: 490000 },
      { month: "Jun", orders: completedOrdersCount, revenue: revenue },
    ];

    // Delayed Orders
    const delayedOrdersCount = await prisma.workflowStage.count({
      where: { delayIndicator: true },
    });

    res.json({
      metrics: {
        totalOrders,
        todayOrders: todayOrdersCount,
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
        inProduction: inProductionCount,
        qcPending: qcPendingCount,
        readyForDispatch: readyDispatchCount,
        revenue,
        lowStockItems: lowStockCount,
        delayedOrders: delayedOrdersCount,
      },
      charts: {
        productionStatus,
        inventoryUsage,
        topProducts,
        monthlyStats,
        employeeProductivity: performanceMetrics,
      },
      recentActivity,
      upcomingDeadlines,
      notifications,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch dashboard data" });
  }
});

// ----------------------------------------------------
// ORDERS CRUD API
// ----------------------------------------------------
app.get("/api/orders", authenticateJWT, async (req, res) => {
  const { search, status, priority, category } = req.query;

  try {
    const whereClause: any = {};

    if (status) whereClause.currentStage = status as string;
    if (priority) whereClause.priority = priority as string;
    if (category) whereClause.category = category as string;

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search as string } },
        { furnitureType: { contains: search as string } },
        { customer: { name: { contains: search as string } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: true,
        designer: { select: { id: true, name: true, role: true } },
        carpenter: { select: { id: true, name: true, role: true } },
        workflowStages: true,
        qcReport: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch orders" });
  }
});

app.post("/api/orders", authenticateJWT, async (req: AuthRequest, res) => {
  const {
    customerId,
    furnitureType,
    category,
    woodType,
    dimensions,
    quantity,
    priority,
    estimatedCost,
    deliveryDate,
    notes,
    designerId,
    carpenterId,
  } = req.body;

  if (!customerId || !furnitureType || !category || !woodType || !dimensions || !estimatedCost || !deliveryDate) {
    return res.status(400).json({ error: "Missing required order fields" });
  }

  try {
    // Generate order number
    const count = await prisma.order.count();
    const orderNumber = `SVS-2026-${String(count + 1).padStart(4, "0")}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        furnitureType,
        category,
        woodType,
        dimensions,
        quantity: quantity ? parseInt(quantity) : 1,
        priority: priority || "MEDIUM",
        estimatedCost: parseFloat(estimatedCost),
        deliveryDate: new Date(deliveryDate),
        notes,
        designerId,
        carpenterId,
        currentStage: "DESIGN_APPROVED",
      },
    });

    // Auto-create all 10 stages in workflow
    const stagesList = [
      "DESIGN_APPROVED", "MATERIAL_SOURCED", "CARPENTRY", "ASSEMBLY", 
      "FINISHING", "POLISHING", "QUALITY_CHECK", "PACKAGING", 
      "READY_FOR_DISPATCH", "DELIVERED"
    ];

    const stagesData = stagesList.map((stageName, idx) => {
      let status = "PENDING";
      let completionPercent = 0.0;
      let assignedToId: string | null = null;

      if (idx === 0) {
        status = "COMPLETED"; // Design Approved starts as completed
        completionPercent = 100.0;
        assignedToId = designerId || req.user?.id || null;
      } else if (idx === 1) {
        status = "IN_PROGRESS"; // Sourcing materials starts automatically in progress
        assignedToId = req.user?.id || null;
      } else if (["CARPENTRY", "ASSEMBLY"].includes(stageName)) {
        assignedToId = carpenterId || null;
      }

      return {
        orderId: order.id,
        stageName,
        status,
        completionPercent,
        assignedToId,
        startDate: idx === 1 ? new Date() : idx === 0 ? new Date() : null,
        endDate: idx === 0 ? new Date() : null,
      };
    });

    for (const stage of stagesData) {
      await prisma.workflowStage.create({ data: stage });
    }

    await logActivity(
      req.user?.id || null,
      req.user?.email || null,
      "ORDER_CREATION",
      `Created order ${orderNumber} for ${furnitureType}`
    );

    await createNotification(
      "New Order Placed",
      `Order ${orderNumber} for ${furnitureType} has been successfully created.`,
      "ORDER_COMPLETED",
      "PRODUCTION_MANAGER"
    );

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create order" });
  }
});

app.get("/api/orders/:id", authenticateJWT, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        designer: { select: { id: true, name: true, role: true, email: true } },
        carpenter: { select: { id: true, name: true, role: true, email: true } },
        workflowStages: { orderBy: { updatedAt: "asc" } },
        qcReport: true,
      },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch order details" });
  }
});

app.put("/api/orders/:id", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { carpenterId, designerId, priority, notes, deliveryDate, estimatedCost, finalCost } = req.body;
    
    const updateData: any = {};
    if (carpenterId) updateData.carpenterId = carpenterId;
    if (designerId) updateData.designerId = designerId;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (deliveryDate) updateData.deliveryDate = new Date(deliveryDate);
    if (estimatedCost) updateData.estimatedCost = parseFloat(estimatedCost);
    if (finalCost) updateData.finalCost = parseFloat(finalCost);

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await logActivity(
      req.user?.id || null,
      req.user?.email || null,
      "ORDER_UPDATE",
      `Updated parameters of order ${order.orderNumber}`
    );

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update order" });
  }
});

app.delete("/api/orders/:id", authenticateJWT, authorizeRoles(["ADMIN"]), async (req: AuthRequest, res) => {
  try {
    const order = await prisma.order.delete({ where: { id: req.params.id } });
    
    await logActivity(
      req.user?.id || null,
      req.user?.email || null,
      "ORDER_DELETION",
      `Deleted order ${order.orderNumber}`
    );

    res.json({ message: `Order ${order.orderNumber} successfully deleted.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete order" });
  }
});

// ----------------------------------------------------
// WORKFLOW STAGE PROGRESSION API
// ----------------------------------------------------
app.put("/api/workflow/:orderId/stage/:stageName", authenticateJWT, async (req: AuthRequest, res) => {
  const { orderId, stageName } = req.params;
  const { status, completionPercent, assignedToId, comments, delayIndicator, photos } = req.body;

  try {
    const currentStage = await prisma.workflowStage.findUnique({
      where: { orderId_stageName: { orderId, stageName } },
    });

    if (!currentStage) {
      return res.status(404).json({ error: "Workflow stage not found for this order" });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (completionPercent !== undefined) updateData.completionPercent = parseFloat(completionPercent);
    if (assignedToId) updateData.assignedToId = assignedToId;
    if (comments !== undefined) updateData.comments = comments;
    if (delayIndicator !== undefined) updateData.delayIndicator = delayIndicator;
    if (photos) updateData.photos = JSON.stringify(photos);

    if (status === "IN_PROGRESS" && !currentStage.startDate) {
      updateData.startDate = new Date();
    }
    if (status === "COMPLETED") {
      updateData.endDate = new Date();
      updateData.completionPercent = 100.0;
    }

    const updatedStage = await prisma.workflowStage.update({
      where: { id: currentStage.id },
      data: updateData,
    });

    // If a stage is COMPLETED, automatically transition the order's currentStage and start the next stage
    const stagesList = [
      "DESIGN_APPROVED", "MATERIAL_SOURCED", "CARPENTRY", "ASSEMBLY", 
      "FINISHING", "POLISHING", "QUALITY_CHECK", "PACKAGING", 
      "READY_FOR_DISPATCH", "DELIVERED"
    ];
    const currentIdx = stagesList.indexOf(stageName);

    if (status === "COMPLETED") {
      let nextStageName = stageName;
      if (currentIdx < stagesList.length - 1) {
        nextStageName = stagesList[currentIdx + 1];
        
        // Update next stage to IN_PROGRESS
        await prisma.workflowStage.update({
          where: { orderId_stageName: { orderId, stageName: nextStageName } },
          data: { status: "IN_PROGRESS", startDate: new Date() },
        });

        // Trigger notifications for worker assignments
        if (nextStageName === "QUALITY_CHECK") {
          await createNotification(
            "Quality Inspection Needed",
            `Order ready for quality check.`,
            "QC_FAILED",
            "QUALITY_INSPECTOR"
          );
        } else if (nextStageName === "READY_FOR_DISPATCH") {
          await createNotification(
            "Ready for Dispatch",
            `Order has passed quality check and packaging. Ready to dispatch.`,
            "DISPATCH_READY",
            "PRODUCTION_MANAGER"
          );
        }
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { currentStage: nextStageName },
      });
    } else {
      // Just update the order's currentStage to this one if it's active
      await prisma.order.update({
        where: { id: orderId },
        data: { currentStage: stageName },
      });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    await logActivity(
      req.user?.id || null,
      req.user?.email || null,
      "WORKFLOW_UPDATE",
      `Updated workflow stage ${stageName} of Order ${order?.orderNumber} to ${status}`
    );

    if (delayIndicator) {
      await createNotification(
        "Production Stage Delayed",
        `Order ${order?.orderNumber} is delayed at stage ${stageName}: ${comments || "No comments"}`,
        "LATE_ORDER",
        "PRODUCTION_MANAGER"
      );
    }

    res.json({ updatedStage, nextStage: status === "COMPLETED" ? stagesList[currentIdx + 1] : stageName });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update workflow" });
  }
});

// ----------------------------------------------------
// INVENTORY API
// ----------------------------------------------------
app.get("/api/inventory", authenticateJWT, async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { supplier: true },
      orderBy: { itemName: "asc" },
    });
    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch inventory" });
  }
});

app.post("/api/inventory", authenticateJWT, authorizeRoles(["ADMIN", "PRODUCTION_MANAGER"]), async (req: AuthRequest, res) => {
  const { itemName, category, supplierId, cost, currentStock, minStockAlert, unit } = req.body;

  if (!itemName || !category || !cost || currentStock === undefined) {
    return res.status(400).json({ error: "Missing inventory fields" });
  }

  try {
    const item = await prisma.inventory.create({
      data: {
        itemName,
        category,
        supplierId,
        cost: parseFloat(cost),
        currentStock: parseFloat(currentStock),
        minStockAlert: minStockAlert ? parseFloat(minStockAlert) : 10.0,
        unit: unit || "pcs",
      },
    });

    await logActivity(
      req.user?.id || null,
      req.user?.email || null,
      "INVENTORY_ADD",
      `Added inventory item ${itemName}`
    );

    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add inventory" });
  }
});

app.put("/api/inventory/:id", authenticateJWT, async (req: AuthRequest, res) => {
  const { currentStock, minStockAlert, cost } = req.body;

  try {
    const updateData: any = {};
    if (currentStock !== undefined) updateData.currentStock = parseFloat(currentStock);
    if (minStockAlert !== undefined) updateData.minStockAlert = parseFloat(minStockAlert);
    if (cost !== undefined) updateData.cost = parseFloat(cost);

    const item = await prisma.inventory.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await logActivity(
      req.user?.id || null,
      req.user?.email || null,
      "INVENTORY_STOCK_UPDATE",
      `Updated stock of item ${item.itemName} to ${item.currentStock}`
    );

    // Trigger alert if low stock
    if (item.currentStock <= item.minStockAlert) {
      await createNotification(
        "Low Stock Warning",
        `Material ${item.itemName} is running low (${item.currentStock} ${item.unit} left).`,
        "LOW_INVENTORY",
        "SUPERVISOR"
      );
    }

    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update inventory" });
  }
});

// ----------------------------------------------------
// EMPLOYEES & CUSTOMERS API
// ----------------------------------------------------
app.get("/api/employees", authenticateJWT, async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true, role: true },
        },
      },
    });
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch employees" });
  }
});

app.get("/api/customers", authenticateJWT, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { orders: true },
      orderBy: { name: "asc" },
    });
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch customers" });
  }
});

app.post("/api/customers", authenticateJWT, async (req: AuthRequest, res) => {
  const { name, email, phone, address } = req.body;
  if (!name || !phone || !address) {
    return res.status(400).json({ error: "Name, phone, and address are required" });
  }

  try {
    const customer = await prisma.customer.create({
      data: { name, email, phone, address },
    });

    await logActivity(
      req.user?.id || null,
      req.user?.email || null,
      "CUSTOMER_CREATION",
      `Registered customer ${name}`
    );

    res.status(201).json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add customer" });
  }
});

// ----------------------------------------------------
// QUALITY CHECK (QC) API
// ----------------------------------------------------
app.post("/api/qc/report", authenticateJWT, authorizeRoles(["ADMIN", "QUALITY_INSPECTOR"]), async (req: AuthRequest, res) => {
  const { orderId, status, reason, remarks, photos } = req.body;

  if (!orderId || !status) {
    return res.status(400).json({ error: "Order ID and status are required" });
  }

  try {
    const qcReport = await prisma.qCReport.upsert({
      where: { orderId },
      update: {
        status,
        reason,
        remarks,
        photos: photos ? JSON.stringify(photos) : undefined,
        inspectorName: req.user?.name || "Inspector",
      },
      create: {
        orderId,
        status,
        reason,
        remarks,
        photos: photos ? JSON.stringify(photos) : undefined,
        inspectorName: req.user?.name || "Inspector",
      },
    });

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (status === "PASSED") {
      // Progress to PACKAGING stage automatically
      await prisma.workflowStage.update({
        where: { orderId_stageName: { orderId, stageName: "QUALITY_CHECK" } },
        data: { status: "COMPLETED", endDate: new Date() },
      });

      await prisma.workflowStage.update({
        where: { orderId_stageName: { orderId, stageName: "PACKAGING" } },
        data: { status: "IN_PROGRESS", startDate: new Date() },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { currentStage: "PACKAGING" },
      });

      await logActivity(
        req.user?.id || null,
        req.user?.email || null,
        "QC_PASSED",
        `Order ${order?.orderNumber} passed Quality Check.`
      );
    } else {
      // Quality Check FAILED - move back to CARPENTRY/FINISHING or set delay
      await prisma.workflowStage.update({
        where: { orderId_stageName: { orderId, stageName: "QUALITY_CHECK" } },
        data: { status: "DELAYED", delayIndicator: true, comments: `QC Failed: ${reason}` },
      });

      await logActivity(
        req.user?.id || null,
        req.user?.email || null,
        "QC_FAILED",
        `Order ${order?.orderNumber} FAILED Quality Check: ${reason}`
      );

      await createNotification(
        "Order Failed QC Inspection",
        `Order ${order?.orderNumber} failed inspection: ${reason}`,
        "QC_FAILED",
        "PRODUCTION_MANAGER"
      );
    }

    res.json(qcReport);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to submit QC report" });
  }
});

// ----------------------------------------------------
// NOTIFICATIONS READ API
// ----------------------------------------------------
app.get("/api/notifications", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const list = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: req.user?.id },
          { role: req.user?.role },
          { userId: null, role: null }, // broadcast
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch notifications" });
  }
});

app.put("/api/notifications/:id/read", authenticateJWT, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update notification" });
  }
});

// Startup Server
server.listen(PORT, () => {
  console.log(`Express API Server running on port ${PORT}`);
  console.log(`WebSocket server connected at ws://localhost:${PORT}`);
});
