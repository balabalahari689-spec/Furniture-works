import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/Toast";
import {
  Building,
  Key,
  Database,
  Moon,
  Sun,
  ShieldCheck,
  Download,
  Upload,
} from "lucide-react";

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [backingUp, setBackingUp] = useState(false);

  // Simulating company configuration details
  const [compName, setCompName] = useState("Sri Venkata Sai Furniture Works");
  const [compPhone, setCompPhone] = useState("+91 98480 22338");
  const [compAddr, setCompAddr] = useState("Miyapur Industrial Area, Near Metro Depot, Hyderabad");

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Settings Saved", "Company configuration updated successfully.", "success");
  };

  const handleBackup = () => {
    setBackingUp(true);
    toast("Backup Initiated", "Creating database SQL snapshot...", "info");

    setTimeout(() => {
      setBackingUp(false);
      // Simulate file download
      const element = document.createElement("a");
      const file = new Blob([JSON.stringify({
        company: compName,
        timestamp: new Date().toISOString(),
        description: "Sri Venkata Sai Furniture Works DB snapshot dump.",
        version: "1.0.0"
      }, null, 2)], { type: "application/json" });
      
      element.href = URL.createObjectURL(file);
      element.download = `SVS_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast("Backup Downloaded", "SQL schema database dump downloaded successfully.", "success");
    }, 2000);
  };

  const rolePermissions = [
    { role: "Admin", pages: "Full system control, order deletions, employee rates" },
    { role: "Production Manager", pages: "Order routing, workflow adjustments, inventory addition" },
    { role: "Sales Team", pages: "Order creation, customer CRM, settings view" },
    { role: "Supervisor", pages: "Kanban board updates, inventory tracking, worker logs" },
    { role: "Quality Inspector", pages: "Quality check inspection reports, fail/pass verdict logs" },
    { role: "Worker", pages: "View active assignments, update stage completion percents" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-xs text-app-text-muted mt-1">
          Configure workshop attributes, backup logs, and role permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company details form */}
          <form onSubmit={handleSaveCompany} className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Company profile
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={compPhone}
                  onChange={(e) => setCompPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Workshop / Office Address
              </label>
              <textarea
                rows={2}
                value={compAddr}
                onChange={(e) => setCompAddr(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10"
            >
              Update Settings
            </button>
          </form>

          {/* Role-based permissions matrix table */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Role Authorization Levels
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="text-app-text-muted border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 font-bold">Roster Role</th>
                    <th className="py-2.5 font-bold">Workspace Access permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {rolePermissions.map((item) => (
                    <tr key={item.role} className="border-b border-slate-100 dark:border-slate-850">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                        {item.role}
                      </td>
                      <td className="py-3 text-app-text-muted leading-relaxed">{item.pages}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: theme / backups */}
        <div className="space-y-6">
          {/* Style Customizer */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
              Console Appearance
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Theme Toggle
              </span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition-all text-slate-800 dark:text-white"
              >
                {theme === "dark" ? (
                  <>
                    <Moon className="w-4 h-4 text-slate-400" />
                    <span>Dark Console</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Console</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Database Backup console */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Backup Console
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Export customer CRM indices, inventory stock histories, and operations logs to an encrypted backup file.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={handleBackup}
                disabled={backingUp}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-950 dark:bg-slate-850 dark:hover:bg-slate-750 text-xs font-semibold text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                {backingUp ? "Exporting..." : "Backup DB"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
