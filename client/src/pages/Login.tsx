import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { api } from "../services/api";
import { KeyRound, ShieldAlert, Sparkles, UserCheck } from "lucide-react";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast("Error", "Please fill in all credentials", "error");
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post("/auth/login", { username, password });
      login(data.token, data.user);
      toast("Welcome Back!", `Logged in as ${data.user.name}`, "success");
      navigate("/");
    } catch (err: any) {
      toast("Login Failed", err.message || "Invalid credentials", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Preset login helper for testing ease
  const handleQuickLogin = async (roleName: string, userKey: string) => {
    setSubmitting(true);
    try {
      const data = await api.post("/auth/login", { username: userKey, password: "password123" });
      login(data.token, data.user);
      toast("Quick Login Active", `Logged in as ${data.user.name} (${roleName})`, "success");
      navigate("/");
    } catch (err: any) {
      toast("Quick Login Failed", "Please ensure database is seeded.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const presets = [
    { label: "Admin / Owner", username: "admin", color: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "Production Manager", username: "manager", color: "bg-slate-800 hover:bg-slate-900 text-white" },
    { label: "Quality Inspector", username: "inspector", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    { label: "Sales Team", username: "sales", color: "bg-amber-500 hover:bg-amber-600 text-white" },
    { label: "Carpenter (Worker)", username: "carpenter1", color: "bg-indigo-600 hover:bg-indigo-700 text-white" },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-slate-900/50 rounded-[24px] border border-slate-800/80 shadow-2xl overflow-hidden glass-panel z-10">
        {/* Left Side: Brand & Quick logins */}
        <div className="p-8 flex flex-col justify-between bg-slate-950/40 border-r border-slate-800/50">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/35">
                SVS
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white leading-none">
                  Sri Venkata Sai
                </span>
                <span className="text-[10px] text-slate-500 font-semibold mt-1">
                  FURNITURE WORKS
                </span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mt-8 tracking-tight">
              Production Workflow & Stage Tracker
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Enterprise SaaS platform for real-time tracking, inventory intelligence, custom workflow routing, and quality assurance auditing.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Role presets (Single-Click Access)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.username}
                  onClick={() => handleQuickLogin(preset.label, preset.username)}
                  className={`w-full py-2 px-4 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all duration-200 border border-slate-700/30 ${preset.color}`}
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 opacity-80" />
                    {preset.label}
                  </span>
                  <span className="text-[9px] opacity-60 font-mono">Auto Login</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 flex flex-col justify-center bg-slate-900/10">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-500" />
            Account Sign-In
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Access your manufacturing and operations console.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/60 text-white text-xs border border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/60 text-white text-xs border border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? "Signing In..." : "Sign In to Console"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[11px] text-slate-500">
              Don't have an operator profile?{" "}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
                Request Signup
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
