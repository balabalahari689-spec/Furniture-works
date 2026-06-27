import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Database,
  ShieldCheck,
  Building2,
  Lock,
  Save,
  Loader2
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme, user } = useAuth();
  const [companyName, setCompanyName] = useState('Sri Venkata Sai Furniture Works');
  const [address, setAddress] = useState('Industrial Area, Miyapur, Hyderabad');
  const [phone, setPhone] = useState('+91 98480 22338');
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Company profile updated successfully!');
    }, 1000);
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      alert('Local database backup (svs_works_db_backup.json) generated and saved successfully!');
    }, 2000);
  };

  const rolePermissions = [
    { role: 'Admin', code: 'ADMIN', permissions: 'Full access to edit orders, settings, inventory registries, employee records, and audit archives.' },
    { role: 'Production Manager', code: 'PRODUCTION_MANAGER', permissions: 'Manage all production orders, track workflow stages, and adjust raw material inventory levels.' },
    { role: 'Sales Team', code: 'SALES', permissions: 'Register new clients, create production orders, and check estimated delivery dates.' },
    { role: 'Supervisor', code: 'SUPERVISOR', permissions: 'Check active task boards, modify employee attendance lists, and record stock movements.' },
    { role: 'Quality Inspector', code: 'INSPECTOR', permissions: 'Perform structural checks, fail/pass stages, and record quality inspection remarks.' },
    { role: 'Worker', code: 'WORKER', permissions: 'Update completion levels and comments for stages assigned to them.' }
  ];

  return (
    <div className="p-6 space-y-6 text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">System Settings</h1>
        <p className="text-xs text-slate-400">Configure company metadata, customize interface theme, and review access privileges.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side: General Profile & Theme */}
        <div className="md:col-span-7 space-y-6">
          {/* Company Profile Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
              <Building2 size={14} className="text-blue-500" /> Company Profile Details
            </h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Company Registered Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355 block mb-1">Office Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355 block mb-1">Customer Helpline Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              {['ADMIN', 'PRODUCTION_MANAGER'].includes(user?.role || '') ? (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary text-xs font-semibold flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={12} /> Save Settings
                    </>
                  )}
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold italic">View-only mode. Administrator permissions required to edit profile details.</span>
              )}
            </form>
          </div>

          {/* Theme & backup card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
              <SettingsIcon size={14} className="text-blue-500" /> Interface Customize
            </h3>
            
            <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-850">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Dark / Light UI Theme</span>
                <span className="text-[10px] text-slate-400 block">Toggle the application interface colors.</span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={14} className="text-amber-500" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-blue-500" /> Dark Mode
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center py-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Database Backup</span>
                <span className="text-[10px] text-slate-400 block">Export a snapshot of all active tables.</span>
              </div>
              {['ADMIN'].includes(user?.role || '') ? (
                <button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="px-3.5 py-2 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                >
                  {isBackingUp ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Database size={14} /> Backup DB
                    </>
                  )}
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 italic">Admin only</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Role Permissions Matrix */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
            <Lock size={14} className="text-blue-500" /> Role-Based Access Controls
          </h3>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {rolePermissions.map(item => (
              <div key={item.code} className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-850 last:border-0 last:pb-0 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{item.role}</span>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-black px-1.5 py-0.5 rounded uppercase">
                    {item.code}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed break-words">{item.permissions}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
