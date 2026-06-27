import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  KanbanSquare,
  PackageCheck,
  Hammer,
  Sparkles,
  Truck,
  FileBarChart2,
  Users,
  Briefcase,
  Settings,
  Menu,
  ChevronLeft,
  Boxes,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      section: "Overview",
      items: [
        { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM", "SUPERVISOR", "QUALITY_INSPECTOR", "WORKER"] },
      ],
    },
    {
      section: "Production Management",
      items: [
        { name: "Create New Order", path: "/orders/new", icon: PlusCircle, roles: ["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM"] },
        { name: "Production Orders", path: "/orders", icon: ClipboardList, roles: ["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM", "SUPERVISOR", "QUALITY_INSPECTOR"] },
        { name: "Workflow Tracker", path: "/workflow", icon: KanbanSquare, roles: ["ADMIN", "PRODUCTION_MANAGER", "SUPERVISOR", "WORKER"] },
      ],
    },
    {
      section: "Workshop Departments",
      items: [
        { name: "Carpentry", path: "/departments/carpentry", icon: Hammer, roles: ["ADMIN", "PRODUCTION_MANAGER", "SUPERVISOR", "WORKER"] },
        { name: "Finishing & Polish", path: "/departments/finishing", icon: Sparkles, roles: ["ADMIN", "PRODUCTION_MANAGER", "SUPERVISOR", "WORKER"] },
        { name: "Quality Check", path: "/quality", icon: PackageCheck, roles: ["ADMIN", "PRODUCTION_MANAGER", "QUALITY_INSPECTOR"] },
        { name: "Dispatch", path: "/dispatch", icon: Truck, roles: ["ADMIN", "PRODUCTION_MANAGER", "SUPERVISOR"] },
      ],
    },
    {
      section: "Materials & Supply",
      items: [
        { name: "Inventory Management", path: "/inventory", icon: Boxes, roles: ["ADMIN", "PRODUCTION_MANAGER", "SUPERVISOR"] },
      ],
    },
    {
      section: "CRM & Staff",
      items: [
        { name: "Customers Database", path: "/customers", icon: Users, roles: ["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM"] },
        { name: "Employee Directory", path: "/employees", icon: Briefcase, roles: ["ADMIN", "PRODUCTION_MANAGER", "SUPERVISOR"] },
      ],
    },
    {
      section: "Business Intelligence",
      items: [
        { name: "Reports & Analytics", path: "/reports", icon: FileBarChart2, roles: ["ADMIN", "PRODUCTION_MANAGER"] },
        { name: "System Settings", path: "/settings", icon: Settings, roles: ["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM", "SUPERVISOR", "QUALITY_INSPECTOR"] },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-full bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 select-none flex flex-col ${
        collapsed ? "w-20" : "w-64"
      } no-print`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-blue-500/30">
            SVS
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="font-bold text-sm tracking-tight text-white leading-none">
                Sri Venkata Sai
              </span>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">
                FURNITURE WORKS
              </span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute left-6 top-20 p-1 bg-blue-600 rounded-full border-2 border-slate-900 text-white hover:bg-blue-700"
          >
            <Menu className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menuItems.map((section, sIdx) => {
          // Check if user has permission for any item in this section
          const hasVisibleItems = section.items.some(
            (item) => !user || item.roles.includes(user.role)
          );

          if (!hasVisibleItems) return null;

          return (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {section.section}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item, iIdx) => {
                  if (user && !item.roles.includes(user.role)) return null;

                  const isActive = location.pathname === item.path;
                  return (
                    <li key={iIdx}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "hover:bg-slate-800 hover:text-slate-100 text-slate-400"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* User Status Bar at the bottom */}
      {!collapsed && user && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/45 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-slate-700">
            {user.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white truncate">{user.name}</span>
            <span className="text-xs text-slate-500 truncate capitalize">
              {user.role.replace("_", " ")}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
