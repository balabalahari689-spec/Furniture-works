import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Columns,
  Boxes,
  Hammer,
  Paintbrush,
  ShieldCheck,
  Truck,
  FileBarChart,
  TrendingUp,
  Users,
  UserCheck,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'SALES', 'SUPERVISOR', 'INSPECTOR', 'WORKER']
    },
    {
      title: 'Production Orders',
      path: '/orders',
      icon: ClipboardList,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'SALES', 'SUPERVISOR', 'INSPECTOR']
    },
    {
      title: 'Create New Order',
      path: '/orders/new',
      icon: PlusCircle,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'SALES']
    },
    {
      title: 'Workflow Tracker',
      path: '/workflow',
      icon: Columns,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR', 'WORKER']
    },
    {
      title: 'Raw Material',
      path: '/materials',
      icon: Boxes,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR']
    },
    {
      title: 'Quality Check',
      path: '/quality',
      icon: ShieldCheck,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'INSPECTOR']
    },
    {
      title: 'Dispatch Board',
      path: '/dispatch',
      icon: Truck,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR', 'INSPECTOR']
    },
    {
      title: 'Reports Registry',
      path: '/reports',
      icon: FileBarChart,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'SALES', 'INSPECTOR']
    },
    {
      title: 'Advanced Analytics',
      path: '/analytics',
      icon: TrendingUp,
      roles: ['ADMIN', 'PRODUCTION_MANAGER']
    },
    {
      title: 'Employees Directory',
      path: '/employees',
      icon: Users,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR']
    },
    {
      title: 'Customer Directory',
      path: '/customers',
      icon: UserCheck,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'SALES']
    },
    {
      title: 'System Settings',
      path: '/settings',
      icon: SettingsIcon,
      roles: ['ADMIN', 'PRODUCTION_MANAGER', 'SALES', 'SUPERVISOR', 'INSPECTOR', 'WORKER']
    }
  ];

  const filteredMenu = menuItems.filter(item => hasRole(item.roles));

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 z-30 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed ? (
            <div className="flex flex-col select-none">
              <span className="font-extrabold text-lg text-blue-500 tracking-wider">SVS WORKS</span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Furniture Tracker</span>
            </div>
          ) : (
            <span className="font-extrabold text-xl text-blue-500 mx-auto">SVS</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors hidden md:block text-slate-300"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* User profile snippet */}
        {!collapsed && user && (
          <div className="p-4 mx-3 my-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
              alt="Avatar"
              className="w-10 h-10 rounded-full border border-blue-500 bg-slate-700"
            />
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm text-slate-200 truncate">{user.name}</h4>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider block w-fit mt-1">
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menu Links */}
        <nav className="mt-4 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
          {filteredMenu.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.title}
                to={item.path}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Action Footer */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium text-sm"
        >
          <LogOut size={20} />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );
};
