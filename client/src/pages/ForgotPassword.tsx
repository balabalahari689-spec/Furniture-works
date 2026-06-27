import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../components/Toast";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const ForgotPassword: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast("Error", "Please enter your email", "error");
      return;
    }
    setSent(true);
    toast("Reset Email Sent", `Instructions sent to ${email}`, "success");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/50 rounded-[24px] border border-slate-800/80 shadow-2xl glass-panel p-8 z-10">
        <Link to="/login" className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-400 uppercase tracking-wider mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Recover Operator Password</h2>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your registered operator email address. We will verify your ID and send a secure token link to reset your credentials.
            </p>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="operator@svsfurniture.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 text-white text-xs border border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/10"
            >
              Send Secure Recovery Code
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-slate-950/45 rounded-xl border border-slate-800/60 text-center">
              <span className="text-xs text-emerald-400 font-semibold block">Email Sent Successfully!</span>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                A secure login link was dispatched to <strong className="text-white">{email}</strong>. This link is active for 15 minutes. Check your junk folder if it doesn't arrive soon.
              </p>
            </div>
            <button
              onClick={() => setSent(false)}
              className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/50 text-white text-xs font-semibold rounded-xl transition-all"
            >
              Try another email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
