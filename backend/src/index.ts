import express from 'express';
import cors from 'cors';
import { config } from './config';

// Import routers
import authRouter from './routes/auth';
import ordersRouter from './routes/orders';
import workflowRouter from './routes/workflow';
import inventoryRouter from './routes/inventory';
import employeesRouter from './routes/employees';
import customersRouter from './routes/customers';
import reportsRouter from './routes/reports';
import analyticsRouter from './routes/analytics';
import notificationsRouter from './routes/notifications';
import { initScheduler } from './services/scheduler';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes Mounts
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date() });
});

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error occurred' });
});

// Start Server
app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(` SVS Furniture Works Production Tracker Server Running  `);
  console.log(` Port: ${config.port} | Mode: ${config.nodeEnv} `);
  console.log(`=======================================================`);
  
  // Initialize Daily Scheduler
  initScheduler();
});
