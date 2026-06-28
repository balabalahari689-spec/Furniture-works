import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import {
  Bell,
  Sun,
  Moon,
  Search,
  Check,
  CheckCheck,
  Menu,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Boxes
} from 'lucide-react';

interface NavbarProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarCollapsed, toggleSidebar }) => {
  const { user, theme, toggleTheme, token } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch all orders for search
  const fetchAllOrders = async () => {
    if (!token) return;
    setSearchLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders for search:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllOrders();
    }
  }, [token]);

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter orders instantly when search query or database changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders([]);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase().trim();
    const filtered = allOrders.filter(order => {
      const matchesOrderNumber = order.orderNumber?.toLowerCase().includes(lowerQuery);
      const matchesCustomer = order.customer?.name?.toLowerCase().includes(lowerQuery);
      const matchesFurniture = order.furnitureType?.toLowerCase().includes(lowerQuery);
      const matchesDesigner = order.designer?.toLowerCase().includes(lowerQuery);
      const matchesCarpenter = order.assignedCarpenter?.toLowerCase().includes(lowerQuery);
      
      // Production Stage matching: status underscore formatted or exact matching
      const matchesStatus = order.status?.toLowerCase().replace(/_/g, ' ').includes(lowerQuery);
      
      // Also match individual stage names in workflow stages
      const matchesStages = order.stages?.some((stage: any) => 
        stage.stageName?.toLowerCase().includes(lowerQuery)
      );

      return (
        matchesOrderNumber ||
        matchesCustomer ||
        matchesFurniture ||
        matchesDesigner ||
        matchesCarpenter ||
        matchesStatus ||
        matchesStages
      );
    });
    setFilteredOrders(filtered);
  }, [searchQuery, allOrders]);

  const handleSearchFocus = () => {
    setShowSearchResults(true);
    fetchAllOrders(); // Refresh in background
  };

  const getStatusBadgeStyles = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'DESIGN_APPROVED':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'READY':
      case 'READY_FOR_DISPATCH':
        return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';
      case 'QC_PENDING':
      case 'QUALITY_CHECK':
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      default:
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    return (status || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  // Get active tab title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard Hub';
    if (path.startsWith('/orders/new')) return 'Register New Order';
    if (path.startsWith('/orders/')) return 'Order Details Specification';
    if (path.startsWith('/orders')) return 'Production Orders Registry';
    if (path.startsWith('/workflow')) return 'Live Workflow Tracker';
    if (path.startsWith('/materials')) return 'Raw Material Inventory';
    if (path.startsWith('/quality')) return 'Quality Assurance Inspection';
    if (path.startsWith('/dispatch')) return 'Dispatch & Logistics Control';
    if (path.startsWith('/reports')) return 'Business Operations Reports';
    if (path.startsWith('/analytics')) return 'Advanced Insights & Heatmaps';
    if (path.startsWith('/employees')) return 'Employee Resource Directory';
    if (path.startsWith('/customers')) return 'Customer Accounts Index';
    if (path.startsWith('/settings')) return 'System Settings Panel';
    return 'Enterprise Console';
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000); // Poll every 12 seconds
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    if (type === 'LOW_INVENTORY') return <Boxes size={16} className="text-amber-500" />;
    if (type === 'LATE_ORDER') return <AlertTriangle size={16} className="text-red-500" />;
    if (type === 'QC_FAILED') return <AlertTriangle size={16} className="text-rose-500" />;
    if (type === 'QC_PASSED' || type === 'ORDER_COMPLETED') return <ShieldCheck size={16} className="text-emerald-500" />;
    return <Calendar size={16} className="text-blue-500" />;
  };

  return (
    <header className="sticky top-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between z-20 transition-colors duration-300">
      {/* Page Title & Menu Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 select-none">
          {getPageTitle()}
        </h2>
      </div>

      {/* Actions: Search, Theme, Notifications, Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <div ref={searchRef} className="relative hidden md:block w-64">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={handleSearchFocus}
            placeholder="Search orders, customers, workers..."
            className="w-full text-xs py-2 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 dark:text-slate-100 transition-colors"
          />

          {showSearchResults && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 mt-2 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 transition-all">
              <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Matching Orders ({filteredOrders.length})</span>
                {searchLoading && <span className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></span>}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching orders found
                </div>
              ) : (
                filteredOrders.map(order => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="p-3 text-xs block hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {order.orderNumber}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getStatusBadgeStyles(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="mt-1 font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {order.furnitureType}
                    </div>

                    <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="font-medium text-slate-400">Client:</span> {order.customer?.name}
                      </div>
                      {(order.designer || order.assignedCarpenter) && (
                        <div className="flex flex-wrap gap-x-2">
                          {order.designer && (
                            <span>
                              <span className="font-medium text-slate-400">Designer:</span> {order.designer}
                            </span>
                          )}
                          {order.assignedCarpenter && (
                            <span>
                              <span className="font-medium text-slate-400">Carpenter:</span> {order.assignedCarpenter}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] text-white font-extrabold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-40 transition-all">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">System Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 text-xs flex gap-3 transition-colors ${
                        item.read ? 'opacity-75 hover:bg-slate-50 dark:hover:bg-slate-800/20' : 'bg-blue-50/20 dark:bg-blue-900/10 hover:bg-blue-50/40 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <div className="mt-0.5">{getNotificationIcon(item.type)}</div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</h4>
                          {!item.read && (
                            <button
                              onClick={() => markAsRead(item.id)}
                              className="text-[10px] text-blue-500 font-semibold hover:underline"
                            >
                              <Check size={12} />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed break-words">
                          {item.message}
                        </p>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatars */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 select-none">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
              alt="Profile"
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800"
            />
            <div className="hidden lg:block text-left">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{user.name}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 block capitalize">{user.role.toLowerCase().replace(/_/g, ' ')}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
