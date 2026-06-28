import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, User, Briefcase, Loader2, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Authentication Mode Toggle
  const [isLogin, setIsLogin] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('WORKER');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = (roleEmail: string) => {
    setIsLogin(true);
    setEmail(roleEmail);
    setPassword('password123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
    } else {
      if (!email || !password || !name || !role) {
        setError('Please fill in all fields');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password } 
        : { email, password, name, role };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the backend server. Please verify it is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@svs.com' },
    { label: 'Production Mgr', email: 'pm@svs.com' },
    { label: 'Sales Team', email: 'sales@svs.com' },
    { label: 'Supervisor', email: 'supervisor@svs.com' },
    { label: 'Inspector', email: 'inspector@svs.com' },
    { label: 'Worker', email: 'worker@svs.com' }
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden select-none">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-[120px] animate-pulse" />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Brand Presentation Hero */}
        <div className="lg:col-span-6 text-left space-y-6 hidden lg:block pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Shield size={14} /> Enterprise Operations Hub
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            Furniture Production <br />
            <span className="text-blue-500">Workflow & Stage Tracker</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            Custom engineered for **Sri Venkata Sai Furniture Works**, facilitating real-time monitoring of raw material sourcing, carpentry, assembly, finishing, quality checking, and delivery logistics.
          </p>

          {/* Micro stats banner */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-800/80 pt-6 max-w-sm">
            <div>
              <span className="text-2xl font-bold text-slate-100 block">10</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Stages</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-100 block">100%</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Traceability</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-100 block">6+</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Staff Roles</span>
            </div>
          </div>
        </div>

        {/* Right Side: Premium Glassmorphic Auth Form Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto glass-login p-8 rounded-[24px] shadow-2xl shadow-blue-950/20 text-left">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {isLogin ? 'System Login' : 'Create Account'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
              {isLogin ? 'Authenticate to access SVS production networks.' : 'Register new worker profile on SVS network.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Conditional name input (Signup mode) */}
            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Swamy Reddy"
                    className="w-full text-sm py-2.5 pl-10 pr-4 bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@svs.com"
                  className="w-full text-sm py-2.5 pl-10 pr-4 bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex justify-between">
                Password *
                {isLogin && <span className="text-[10px] text-blue-500 font-semibold hover:underline cursor-pointer">Forgot?</span>}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm py-2.5 pl-10 pr-4 bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-all"
                />
              </div>
            </div>

            {/* Conditional role selector (Signup mode) */}
            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Company Role *</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full text-sm py-2.5 pl-10 pr-4 bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100 cursor-pointer appearance-none"
                  >
                    <option value="WORKER">Worker (Carpenter / Finisher)</option>
                    <option value="INSPECTOR">Quality Inspector</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="SALES">Sales Team</option>
                    <option value="PRODUCTION_MANAGER">Production Manager</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 btn-primary flex items-center justify-center gap-2 group font-semibold text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  {isLogin ? 'Enter Workstation' : 'Register Profile'}{' '}
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between login / registration */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-xs text-blue-500 font-bold hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
            </button>
          </div>

          {/* Quick Demo Logins Selection Section */}
          {isLogin && (
            <div className="mt-6 border-t border-slate-200 dark:border-slate-850 pt-5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-3">Evaluate Demo Accounts</span>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map(account => (
                  <button
                    key={account.label}
                    onClick={() => handleDemoLogin(account.email)}
                    className="px-3 py-2 text-[10px] font-bold text-left rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-blue-600/10 hover:text-blue-500 text-slate-600 dark:text-slate-400 border border-transparent hover:border-blue-500/20 transition-all truncate"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
