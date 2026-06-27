import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

async function main() {
  console.log('Seeding SVS database...');

  // 1. Clean existing records
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.qualityInspection.deleteMany({});
  await prisma.workflowStage.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared database tables.');

  // 2. Create Users
  const roles = [
    { name: 'SVS Admin', email: 'admin@svs.com', role: 'ADMIN' },
    { name: 'SVS Production Manager', email: 'pm@svs.com', role: 'PRODUCTION_MANAGER' },
    { name: 'SVS Sales Agent', email: 'sales@svs.com', role: 'SALES' },
    { name: 'SVS Supervisor', email: 'supervisor@svs.com', role: 'SUPERVISOR' },
    { name: 'SVS Quality Inspector', email: 'inspector@svs.com', role: 'INSPECTOR' },
    { name: 'SVS Carpenter Worker', email: 'worker@svs.com', role: 'WORKER' }
  ];

  const passwordHash = await bcrypt.hash('password123', 10);
  
  const createdUsers = [];
  for (const user of roles) {
    const u = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
      }
    });
    createdUsers.push(u);
  }
  console.log(`Created ${createdUsers.length} users with password 'password123'.`);

  // 3. Create Customers
  const customerData = [
    { name: 'Ramachandra Murthy', email: 'ram.murthy@gmail.com', phone: '9848022338', address: 'Plot 45, Jubilee Hills, Hyderabad' },
    { name: 'Anitha Reddy', email: 'anitha.r@yahoo.com', phone: '9988776655', address: 'Flat 302, Gachibowli, Hyderabad' },
    { name: 'Srikanth Verma', email: 'srikanth.v@outlook.com', phone: '9440552211', address: 'Phase 2, Madhapur, Hyderabad' },
    { name: 'Venkata Swamy', email: 'v.swamy@gmail.com', phone: '9123456789', address: 'Miyapur Main Road, Hyderabad' }
  ];

  const createdCustomers = [];
  for (const cust of customerData) {
    const c = await prisma.customer.create({ data: cust });
    createdCustomers.push(c);
  }
  console.log(`Created ${createdCustomers.length} customers.`);

  // 4. Create Employees
  const employeeData = [
    { name: 'Ravi Kumar', email: 'ravi.carpenter@svs.com', phone: '9000112233', role: 'Carpenter', attendanceStatus: 'PRESENT', performanceScore: 94.5 },
    { name: 'Madhav Swamy', email: 'madhav.assembly@svs.com', phone: '9000445566', role: 'Assembler', attendanceStatus: 'PRESENT', performanceScore: 88.0 },
    { name: 'Suresh Babu', email: 'suresh.finisher@svs.com', phone: '9000778899', role: 'Finisher', attendanceStatus: 'PRESENT', performanceScore: 95.0 },
    { name: 'Gopal Raju', email: 'gopal.polisher@svs.com', phone: '9111222333', role: 'Polisher', attendanceStatus: 'ON_LEAVE', performanceScore: 90.0 },
    { name: 'Srinivas Murthy', email: 'srinivas.inspector@svs.com', phone: '9222333444', role: 'Inspector', attendanceStatus: 'PRESENT', performanceScore: 98.0 },
    { name: 'Praveen Rao', email: 'praveen.designer@svs.com', phone: '9333444555', role: 'Designer', attendanceStatus: 'PRESENT', performanceScore: 92.0 }
  ];

  const createdEmployees = [];
  for (const emp of employeeData) {
    const e = await prisma.employee.create({ data: emp });
    createdEmployees.push(e);
  }
  console.log(`Created ${createdEmployees.length} employees.`);

  // 5. Create InventoryItems
  const inventoryData = [
    { name: 'Teak Wood Logs', category: 'Wood', woodType: 'Teak', currentStock: 120.0, lowStockThreshold: 30.0, unit: 'CFT', costPerUnit: 1800.0, supplier: 'Bhavani Timber Traders' },
    { name: 'Rosewood Planks', category: 'Wood', woodType: 'Rosewood', currentStock: 45.0, lowStockThreshold: 15.0, unit: 'CFT', costPerUnit: 2500.0, supplier: 'Malabar Wood Suppliers' },
    { name: 'Premium Plywood 18mm', category: 'Plywood', currentStock: 80.0, lowStockThreshold: 20.0, unit: 'Sheets', costPerUnit: 1200.0, supplier: 'Duraply Industries' },
    { name: 'Brass Screws 1.5 inch', category: 'Hardware', currentStock: 15.0, lowStockThreshold: 10.0, unit: 'Boxes', costPerUnit: 350.0, supplier: 'Kishore Hardware Emporium' },
    { name: 'Polyurethane Wood Polish', category: 'Polish', currentStock: 8.0, lowStockThreshold: 12.0, unit: 'Litres', costPerUnit: 480.0, supplier: 'Asian Paints Depot' }, // triggering low stock alert
    { name: 'Matte Finishing Clear Paint', category: 'Paint', currentStock: 25.0, lowStockThreshold: 10.0, unit: 'Litres', costPerUnit: 520.0, supplier: 'Berger Paints Store' },
    { name: 'Heavy Duty Drawer Slides', category: 'Accessories', currentStock: 40.0, lowStockThreshold: 15.0, unit: 'Pairs', costPerUnit: 250.0, supplier: 'Link Locks & Slides' }
  ];

  for (const item of inventoryData) {
    await prisma.inventoryItem.create({
      data: {
        ...item,
        purchaseDate: new Date()
      }
    });
  }
  console.log('Created inventory registry and materials.');

  // 6. Create Orders and Stage Histories
  const orderItems = [
    {
      orderNumber: 'SVS-2026-1001',
      customerIdx: 0,
      furnitureType: 'Royal Teakwood Dining Table',
      category: 'Dining Room',
      woodType: 'Teak',
      dimensions: '8ft x 4ft',
      quantity: 1,
      designer: 'Praveen Rao',
      assignedCarpenter: 'Ravi Kumar',
      status: 'DELIVERED',
      progressPercentage: 100,
      estimatedCost: 85000,
      finalCost: 87000,
      completedStagesCount: 10
    },
    {
      orderNumber: 'SVS-2026-1002',
      customerIdx: 1,
      furnitureType: 'Luxury Velvet Sofa Set',
      category: 'Living Room',
      woodType: 'Mahogany',
      dimensions: '3 Seater + 2 Seater',
      quantity: 1,
      designer: 'Praveen Rao',
      assignedCarpenter: 'Madhav Swamy',
      status: 'FINISHING',
      progressPercentage: 60,
      estimatedCost: 120000,
      completedStagesCount: 6
    },
    {
      orderNumber: 'SVS-2026-1003',
      customerIdx: 2,
      furnitureType: 'Modern Wardrobe with Mirror',
      category: 'Bedroom',
      woodType: 'Teak',
      dimensions: '7ft x 6ft x 2ft',
      quantity: 2,
      designer: 'Praveen Rao',
      assignedCarpenter: 'Ravi Kumar',
      status: 'CARPENTRY',
      progressPercentage: 30,
      estimatedCost: 150000,
      completedStagesCount: 3
    },
    {
      orderNumber: 'SVS-2026-1004',
      customerIdx: 3,
      furnitureType: 'Classic Rosewood Office Desk',
      category: 'Office',
      woodType: 'Rosewood',
      dimensions: '5ft x 3ft',
      quantity: 1,
      designer: 'Praveen Rao',
      assignedCarpenter: 'Ravi Kumar',
      status: 'QUALITY_CHECK',
      progressPercentage: 80,
      estimatedCost: 65000,
      completedStagesCount: 8
    },
    {
      orderNumber: 'SVS-2026-1005',
      customerIdx: 0,
      furnitureType: 'Teak TV Console Stand',
      category: 'Living Room',
      woodType: 'Teak',
      dimensions: '6ft x 1.5ft',
      quantity: 1,
      designer: 'Praveen Rao',
      assignedCarpenter: 'Madhav Swamy',
      status: 'DESIGN_APPROVED',
      progressPercentage: 10,
      estimatedCost: 45000,
      completedStagesCount: 1
    }
  ];

  for (const o of orderItems) {
    const order = await prisma.order.create({
      data: {
        orderNumber: o.orderNumber,
        customerId: createdCustomers[o.customerIdx].id,
        furnitureType: o.furnitureType,
        category: o.category,
        woodType: o.woodType,
        dimensions: o.dimensions,
        quantity: o.quantity,
        designer: o.designer,
        assignedCarpenter: o.assignedCarpenter,
        status: o.status,
        progressPercentage: o.progressPercentage,
        estimatedCost: o.estimatedCost,
        finalCost: o.finalCost || null,
        estimatedDeliveryDate: new Date(Date.now() + 15 * 24 * 3600 * 1000), // 15 days out
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${o.orderNumber}`
      }
    });

    // Create workflow stages
    const daysPerStage = 2;
    for (let index = 0; index < STAGES_LIST.length; index++) {
      const stageName = STAGES_LIST[index];
      const isCompleted = index < o.completedStagesCount;
      const isInProgress = index === o.completedStagesCount && index < STAGES_LIST.length;
      
      let status = 'PENDING';
      let completion = 0;
      if (isCompleted) {
        status = 'COMPLETED';
        completion = 100;
      } else if (isInProgress) {
        status = 'IN_PROGRESS';
        completion = 30;
      }

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + (index - o.completedStagesCount) * daysPerStage);

      let assignedEmployeeId = null;
      if (stageName === 'Carpentry') {
        assignedEmployeeId = createdEmployees[0].id; // Ravi
      } else if (stageName === 'Assembly') {
        assignedEmployeeId = createdEmployees[1].id; // Madhav
      } else if (stageName === 'Finishing') {
        assignedEmployeeId = createdEmployees[2].id; // Suresh
      } else if (stageName === 'Polishing') {
        assignedEmployeeId = createdEmployees[3].id; // Gopal
      } else if (stageName === 'Quality Check') {
        assignedEmployeeId = createdEmployees[4].id; // Srinivas
      }

      await prisma.workflowStage.create({
        data: {
          orderId: order.id,
          stageName,
          status,
          completionPercentage: completion,
          expectedCompletionDate: expectedDate,
          actualCompletionDate: isCompleted ? new Date() : null,
          assignedEmployeeId,
          comments: isCompleted ? `Stage completed by assigned team. Verified.` : null
        }
      });
    }
  }

  console.log('Created sample orders and stage progression lists.');

  // 7. Create low stock notifications & audit logs
  await prisma.notification.createMany({
    data: [
      { title: 'Low Inventory Limit reached', message: 'Asian Paints Depot - Polyurethane Wood Polish is below the low stock threshold (8 Litres remaining).', type: 'LOW_INVENTORY' },
      { title: 'Wood Polish arrival', message: 'Sourcing of Matte Clear Paints has completed successfully.', type: 'MATERIAL_ARRIVAL' }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      { action: 'SEED', details: 'Database cleared and initialized with enterprise demo datasets.' }
    ]
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
