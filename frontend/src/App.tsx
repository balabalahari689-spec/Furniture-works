import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { CreateOrder } from './pages/CreateOrder';
import { OrderDetails } from './pages/OrderDetails';
import { Kanban } from './pages/Kanban';
import { RawMaterial } from './pages/RawMaterial';
import { QualityInspector } from './pages/QualityInspector';
import { Employees } from './pages/Employees';
import { Customers } from './pages/Customers';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

// Auth Route Guard
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Workstation...</span>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Main Workspace Layout Offset Wrapper
const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'pl-20' : 'pl-20 md:pl-64'
        }`}
      >
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <main className="flex-1 bg-slate-50/50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth page */}
        <Route path="/login" element={<Login />} />

        {/* Protected workspace routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<CreateOrder />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/workflow" element={<Kanban />} />
            <Route path="/materials" element={<RawMaterial />} />
            <Route path="/quality" element={<QualityInspector />} />
            <Route path="/dispatch" element={<Orders />} /> {/* Maps to Orders lists with ready status */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/analytics" element={<Dashboard />} /> {/* Fallback or dashboard summaries */}
            <Route path="/employees" element={<Employees />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
