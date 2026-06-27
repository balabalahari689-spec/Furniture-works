import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../components/Toast";
import { api } from "../services/api";
import { UserPlus, UserCheck, ShieldCheck } from "lucide-react";

export const Signup: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("WORKER");
  const [department, setDepartment] = useState("Carpentry");
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !username || !password) {
      toast("Error", "Please fill in all fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/register", { name, email, username, password, role, department });
      toast("Profile Created", "Operator account created successfully. Please login.", "success");
      navigate("/login");
    } catch (err: any) {
      toast("Signup Failed", err.message || "Failed to create account", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/50 rounded-[24px] border border-slate-800/80 shadow-2xl overflow-hidden glass-panel p-8 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            SVS
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Register Operations Account</h2>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Create an operator, inspector, or manager profile for Sri Venkata Sai Furniture Works.
        </p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 text-white text-xs border border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="ramesh@svs.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 text-white text-xs border border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="ramesh1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 text-white text-xs border border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 text-white text-xs border border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                System Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950/60 text-white text-xs border border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-colors"
              >
                <option value="WORKER">Worker (Carpenter/Finisher)</option>
                <option value="QUALITY_INSPECTOR">Quality Inspector</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="PRODUCTION_MANAGER">Production Manager</option>
                <option value="SALES_TEAM">Sales Team</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950/60 text-white text-xs border border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-colors"
              >
                <option value="Carpentry">Carpentry Dept</option>
                <option value="Finishing">Finishing & Polishing</option>
                <option value="Design">Design Studio</option>
                <option value="Quality">Quality Control</option>
                <option value="Dispatch">Logistics & Dispatch</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            {submitting ? "Creating Profile..." : "Register Operator Profile"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-[11px] text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign In
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};
