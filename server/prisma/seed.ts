import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.qCReport.deleteMany();
  await prisma.workflowStage.deleteMany();
  await prisma.order.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.supplier.deleteMany();

  // 1. Create Suppliers
  const s1 = await prisma.supplier.create({
    data: {
      name: "Deccan Timber Traders",
      contactName: "Raghavendra Rao",
      phone: "+91 98480 22338",
      email: "contact@deccantimber.com",
      address: "Miyapur Industrial Area, Hyderabad",
    },
  });

  const s2 = await prisma.supplier.create({
    data: {
      name: "Sri Balaji Plywoods & Hardwares",
      contactName: "Narendra Kumar",
      phone: "+91 91770 44552",
      email: "balajiply@gmail.com",
      address: "Kukatpally Housing Board, Hyderabad",
    },
  });

  const s3 = await prisma.supplier.create({
    data: {
      name: "Asian Paints & Polishes Depot",
      contactName: "Srinivas Rao",
      phone: "+91 93910 11223",
      email: "srinivas@paintsdepot.com",
      address: "Secunderabad Commercial Zone, Hyderabad",
    },
  });

  // 2. Create Inventory Items
  const wood = await prisma.inventory.create({
    data: {
      itemName: "Premium Teak Wood Logs (Grade A)",
      category: "Wood",
      supplierId: s1.id,
      cost: 45000,
      currentStock: 120, // cubic feet
      minStockAlert: 30,
      unit: "cft",
    },
  });

  const plywood = await prisma.inventory.create({
    data: {
      itemName: "18mm Waterproof Plywood (8x4 ft)",
      category: "Plywood",
      supplierId: s2.id,
      cost: 1600,
      currentStock: 250, // sheets
      minStockAlert: 50,
      unit: "sheets",
    },
  });

  const hardware = await prisma.inventory.create({
    data: {
      itemName: "Antique Brass Door Handles (6 inch)",
      category: "Hardware",
      supplierId: s2.id,
      cost: 350,
      currentStock: 45, // pcs (LOW STOCK ALERT!)
      minStockAlert: 50,
      unit: "pcs",
    },
  });

  const hinges = await prisma.inventory.create({
    data: {
      itemName: "Soft-Close Hydraulic Cabinet Hinges",
      category: "Hardware",
      supplierId: s2.id,
      cost: 120,
      currentStock: 600,
      minStockAlert: 100,
      unit: "pcs",
    },
  });

  const paint = await prisma.inventory.create({
    data: {
      itemName: "Melamine Wood Polish Glossy",
      category: "Polish",
      supplierId: s3.id,
      cost: 450,
      currentStock: 80, // liters
      minStockAlert: 20,
      unit: "liters",
    },
  });

  const glue = await prisma.inventory.create({
    data: {
      itemName: "Fevicol SH Wood Adhesive (50kg)",
      category: "Accessories",
      supplierId: s2.id,
      cost: 6500,
      currentStock: 8, // tubs (LOW STOCK ALERT!)
      minStockAlert: 10,
      unit: "tubs",
    },
  });

  // 3. Create Users & Employee Profiles
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@svsfurniture.com",
      password: hashedPassword,
      role: "ADMIN",
      name: "S. V. Sai Prasad (Owner)",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      username: "manager",
      email: "manager@svsfurniture.com",
      password: hashedPassword,
      role: "PRODUCTION_MANAGER",
      name: "K. Venkatesh",
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      username: "sales",
      email: "sales@svsfurniture.com",
      password: hashedPassword,
      role: "SALES_TEAM",
      name: "M. Anuradha",
    },
  });

  const supervisorUser = await prisma.user.create({
    data: {
      username: "supervisor",
      email: "supervisor@svsfurniture.com",
      password: hashedPassword,
      role: "SUPERVISOR",
      name: "P. Ranganath",
    },
  });

  const inspectorUser = await prisma.user.create({
    data: {
      username: "inspector",
      email: "inspector@svsfurniture.com",
      password: hashedPassword,
      role: "QUALITY_INSPECTOR",
      name: "T. Satish Kumar",
    },
  });

  // Workers
  const worker1 = await prisma.user.create({
    data: {
      username: "carpenter1",
      email: "ramesh@svsfurniture.com",
      password: hashedPassword,
      role: "WORKER",
      name: "Ramesh Achari",
    },
  });

  const worker2 = await prisma.user.create({
    data: {
      username: "carpenter2",
      email: "somesh@svsfurniture.com",
      password: hashedPassword,
      role: "WORKER",
      name: "Somesh Varma",
    },
  });

  const worker3 = await prisma.user.create({
    data: {
      username: "finisher1",
      email: "naidu@svsfurniture.com",
      password: hashedPassword,
      role: "WORKER",
      name: "Krishna Naidu",
    },
  });

  // Associate Employees
  await prisma.employee.create({
    data: { userId: managerUser.id, department: "Management", productivity: 98 },
  });
  await prisma.employee.create({
    data: { userId: supervisorUser.id, department: "Supervision", productivity: 95 },
  });
  await prisma.employee.create({
    data: { userId: inspectorUser.id, department: "Quality", productivity: 92 },
  });
  await prisma.employee.create({
    data: { userId: worker1.id, department: "Carpentry", productivity: 88 },
  });
  await prisma.employee.create({
    data: { userId: worker2.id, department: "Carpentry", productivity: 91 },
  });
  await prisma.employee.create({
    data: { userId: worker3.id, department: "Finishing", productivity: 85 },
  });

  // 4. Create Customers
  const c1 = await prisma.customer.create({
    data: {
      name: "Hyderabad Elite Homes (Pvt Ltd)",
      phone: "+91 90001 55667",
      email: "procurement@hyderabadelite.com",
      address: "Banjara Hills, Road No. 4, Hyderabad",
    },
  });

  const c2 = await prisma.customer.create({
    data: {
      name: "Dr. Srinivas Reddy",
      phone: "+91 94405 88221",
      email: "srinivasreddy@gachibowli.org",
      address: "Villa 42, Jayabheri Pine Valley, Gachibowli, Hyderabad",
    },
  });

  const c3 = await prisma.customer.create({
    data: {
      name: "Aurobindo IT Center",
      phone: "+91 99880 77112",
      email: "facility@aurobindo.it",
      address: "HITEC City, Phase 2, Hyderabad",
    },
  });

  // 5. Create Orders & Stage Workflows
  const stagesList = [
    "DESIGN_APPROVED",
    "MATERIAL_SOURCED",
    "CARPENTRY",
    "ASSEMBLY",
    "FINISHING",
    "POLISHING",
    "QUALITY_CHECK",
    "PACKAGING",
    "READY_FOR_DISPATCH",
    "DELIVERED",
  ];

  // Helper to generate stages for an order
  const generateStages = (
    orderId: string,
    currentStageIdx: number,
    completionOfCurrent: number,
    carpenterId: string,
    finisherId: string
  ) => {
    return stagesList.map((stageName, idx) => {
      let status = "PENDING";
      let completionPercent = 0;
      let assignedToId: string | null = null;
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (idx < currentStageIdx) {
        status = "COMPLETED";
        completionPercent = 100;
        startDate = new Date(Date.now() - (currentStageIdx - idx) * 3 * 24 * 60 * 60 * 1000);
        endDate = new Date(Date.now() - (currentStageIdx - idx - 0.8) * 3 * 24 * 60 * 60 * 1000);
      } else if (idx === currentStageIdx) {
        status = "IN_PROGRESS";
        completionPercent = completionOfCurrent;
        startDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      }

      if (stageName === "DESIGN_APPROVED") {
        assignedToId = designerId();
      } else if (["CARPENTRY", "ASSEMBLY"].includes(stageName)) {
        assignedToId = carpenterId;
      } else if (["FINISHING", "POLISHING", "PACKAGING"].includes(stageName)) {
        assignedToId = finisherId;
      } else if (stageName === "QUALITY_CHECK") {
        assignedToId = inspectorUser.id;
      }

      return {
        orderId,
        stageName,
        status,
        assignedToId,
        completionPercent,
        startDate,
        endDate,
        expectedCompletion: status === "IN_PROGRESS" ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : null,
      };
    });
  };

  const designerId = () => adminUser.id;

  // Order 1: Delivered Teak Wood Dining Set
  const o1 = await prisma.order.create({
    data: {
      orderNumber: "SVS-2026-0001",
      customerId: c1.id,
      furnitureType: "10-Seater Royal Teak Wood Dining Table",
      category: "Dining Room",
      woodType: "Teak Wood",
      dimensions: "10ft x 4ft x 2.5ft",
      quantity: 1,
      designerId: adminUser.id,
      carpenterId: worker1.id,
      currentStage: "DELIVERED",
      priority: "HIGH",
      estimatedCost: 185000,
      finalCost: 185000,
      deliveryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: "Carving on borders matches royal heritage style.",
    },
  });
  for (const stage of generateStages(o1.id, 10, 100, worker1.id, worker3.id)) {
    await prisma.workflowStage.create({ data: stage });
  }

  // Order 2: In Finishing Stage - Premium Wardrobe
  const o2 = await prisma.order.create({
    data: {
      orderNumber: "SVS-2026-0002",
      customerId: c2.id,
      furnitureType: "6-Door Premium Sliding Wardrobe",
      category: "Bedroom",
      woodType: "Plywood",
      dimensions: "8ft x 7ft x 2ft",
      quantity: 1,
      designerId: adminUser.id,
      carpenterId: worker2.id,
      currentStage: "FINISHING",
      priority: "MEDIUM",
      estimatedCost: 95000,
      deliveryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      notes: "Needs glass paneling in the center doors.",
    },
  });
  for (const stage of generateStages(o2.id, 4, 75, worker2.id, worker3.id)) {
    await prisma.workflowStage.create({ data: stage });
  }

  // Order 3: In Carpentry (DELAYED) - Office Desks
  const o3 = await prisma.order.create({
    data: {
      orderNumber: "SVS-2026-0003",
      customerId: c3.id,
      furnitureType: "Custom Modular L-Shaped Executive Desks",
      category: "Office",
      woodType: "Plywood",
      dimensions: "5ft x 5ft x 2.5ft",
      quantity: 5,
      designerId: adminUser.id,
      carpenterId: worker1.id,
      currentStage: "CARPENTRY",
      priority: "CRITICAL",
      estimatedCost: 240000,
      deliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // PAST DUE DATE!
      notes: "Sleek wire-cutouts, laminate finishes in Charcoal Grey.",
    },
  });
  const o3stages = generateStages(o3.id, 2, 40, worker1.id, worker3.id);
  // Mark carpentry stage as delayed
  o3stages[2].delayIndicator = true;
  o3stages[2].comments = "Sourcing of charcoal grey laminate took longer than planned.";
  for (const stage of o3stages) {
    await prisma.workflowStage.create({ data: stage });
  }

  // Order 4: QC Pending Stage - Designer Bed
  const o4 = await prisma.order.create({
    data: {
      orderNumber: "SVS-2026-0004",
      customerId: c2.id,
      furnitureType: "King-Size Bed with Hydraulic Storage",
      category: "Bedroom",
      woodType: "Mahogany",
      dimensions: "6.5ft x 6ft x 3ft",
      quantity: 1,
      designerId: adminUser.id,
      carpenterId: worker2.id,
      currentStage: "QUALITY_CHECK",
      priority: "HIGH",
      estimatedCost: 115000,
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: "Wingback headboard in light beige velvet upholstery.",
    },
  });
  for (const stage of generateStages(o4.id, 6, 20, worker2.id, worker3.id)) {
    await prisma.workflowStage.create({ data: stage });
  }

  // Order 5: Design Approved Stage - Living Room Sofa
  const o5 = await prisma.order.create({
    data: {
      orderNumber: "SVS-2026-0005",
      customerId: c1.id,
      furnitureType: "Luxury L-Shape Sofa Set",
      category: "Living Room",
      woodType: "Teak Wood",
      dimensions: "9ft x 6ft x 3ft",
      quantity: 1,
      designerId: adminUser.id,
      currentStage: "DESIGN_APPROVED",
      priority: "MEDIUM",
      estimatedCost: 145000,
      deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      notes: "3D CAD design completed. Customer approved the velvet fabric swatch.",
    },
  });
  for (const stage of generateStages(o5.id, 0, 100, worker1.id, worker3.id)) {
    await prisma.workflowStage.create({ data: stage });
  }

  // 6. Create QC Report (Failed inspection on a historical order, or current order history)
  await prisma.qCReport.create({
    data: {
      orderId: o4.id,
      status: "FAILED",
      reason: "Hydraulic storage alignment is off by 5mm. Scratches on side panels.",
      inspectorName: "T. Satish Kumar",
      remarks: "Returned to Somesh (carpenter) and Krishna (finisher) for rework.",
    },
  });

  // 7. Create Notifications
  await prisma.notification.create({
    data: {
      title: "Late Order Warning",
      message: "Order SVS-2026-0003 for Aurobindo IT Center is past its delivery deadline!",
      type: "LATE_ORDER",
      role: "PRODUCTION_MANAGER",
    },
  });

  await prisma.notification.create({
    data: {
      title: "Low Inventory Alert",
      message: "Fevicol SH Wood Adhesive stock is low (8 tubs left, threshold 10).",
      type: "LOW_INVENTORY",
      role: "SUPERVISOR",
    },
  });

  await prisma.notification.create({
    data: {
      title: "Low Inventory Alert",
      message: "Antique Brass Door Handles stock is low (45 pcs left, threshold 50).",
      type: "LOW_INVENTORY",
      role: "SUPERVISOR",
    },
  });

  await prisma.notification.create({
    data: {
      title: "QC Check Failed",
      message: "Order SVS-2026-0004 failed quality check due to alignment and cosmetic scratches.",
      type: "QC_FAILED",
      role: "PRODUCTION_MANAGER",
    },
  });

  // 8. Create Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: managerUser.id,
      userEmail: managerUser.email,
      action: "STAGE_TRANSITION",
      details: "Moved Order SVS-2026-0004 to QUALITY_CHECK",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: inspectorUser.id,
      userEmail: inspectorUser.email,
      action: "QC_INSPECTION",
      details: "Inspected Order SVS-2026-0004, marked as FAILED with remarks.",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: salesUser.id,
      userEmail: salesUser.email,
      action: "ORDER_CREATION",
      details: "Created Order SVS-2026-0005 for Hyderabad Elite Homes",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
