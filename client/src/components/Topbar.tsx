import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "./Toast";
import { WS_URL, api } from "../services/api";
import {
  Bell,
  Sun,
  Moon,
  Search,
  LogOut,
  User as UserIcon,
  Settings,
  HelpCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

interface TopbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenCommandPalette: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenCommandPalette,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load initial notifications
  const fetchNotifications = async () => {
    try {
      const data = await api.get("/notifications");
      setNotifications(data);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Set up WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user) return;

    let ws: WebSocket;
    let reconnectTimeout: number;

    const connectWS = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setWsConnected(true);
        console.log("WebSocket connected to server");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === "NOTIFICATION") {
            const notif = payload.data;
            // Check if notification targets this user role
            if (!notif.role || notif.role === user.role) {
              setNotifications((prev) => [notif, ...prev]);
              toast(notif.title, notif.message, notif.type === "LATE_ORDER" || notif.type === "QC_FAILED" ? "error" : "info");
            }
          }
        } catch (err) {
          console.error("WS error parsing message", err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log("WebSocket connection closed. Attempting reconnect in 5s...");
        reconnectTimeout = window.setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user, toast]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    toast("Logged Out", "You have successfully logged out.", "info");
    navigate("/login");
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm px-6 flex items-center justify-between transition-colors no-print">
      {/* Left side: title / toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Search className="w-5 h-5 lg:hidden" />
          <svg
            className="w-5 h-5 hidden lg:block"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
        <span className="font-semibold text-slate-800 dark:text-white hidden md:inline-block">
          Furniture Production Workflow
        </span>

        {/* Real-time Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800">
          {wsConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Right side: actions */}
      <div className="flex items-center gap-3">
        {/* Command Search */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>Search or Ctrl+K...</span>
        </button>

        {/* Dark/Light mode */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-rose-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-30 animate-scale-up">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-950 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto division-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-950/40 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                        !n.isRead ? "bg-blue-50/30 dark:bg-blue-950/10 font-medium" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
              {user?.name.split(" ").map((n) => n[0]).join("")}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-30 animate-scale-up">
              {user && (
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-950 dark:text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user.email}</p>
                </div>
              )}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { setShowProfileMenu(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => { setShowProfileMenu(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>System Settings</span>
                </button>
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Help Docs</span>
                </a>
                <hr className="border-slate-200 dark:border-slate-800 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
