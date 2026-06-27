import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/Toast";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { CommandPalette } from "./components/CommandPalette";

// Pages
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Dashboard } from "./pages/Dashboard";
import { Orders } from "./pages/Orders";
import { CreateOrder } from "./pages/CreateOrder";
import { OrderDetail } from "./pages/OrderDetail";
import { WorkflowTracker } from "./pages/WorkflowTracker";
import { Carpentry } from "./pages/Carpentry";
import { Finishing } from "./pages/Finishing";
import { QualityCheck } from "./pages/QualityCheck";
import { Dispatch } from "./pages/Dispatch";
import { Inventory } from "./pages/Inventory";
import { Customers } from "./pages/Customers";
import { Employees } from "./pages/Employees";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";

// Authenticated Layout Wrapper
const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Keyboard shortcut Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-semibold text-sm">
        Verifying security clearance credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex transition-colors duration-200">
      {/* Collapsible Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Search Overlay */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

// Main Router App
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Private Routes Wrapper */}
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/new" element={<CreateOrder />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/workflow" element={<WorkflowTracker />} />
                
                {/* Departmental consoles */}
                <Route path="/departments/carpentry" element={<Carpentry />} />
                <Route path="/departments/finishing" element={<Finishing />} />
                <Route path="/quality" element={<QualityCheck />} />
                <Route path="/dispatch" element={<Dispatch />} />
                
                {/* Master registries */}
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
