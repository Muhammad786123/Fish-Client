/**
 * DUMMY AUTHENTICATION PLACEHOLDER
 * ================================
 * NOTE: This component implements a dummy client-side authentication flow intended solely
 * for development, role testing, and UI demoing.
 *
 * CRITICAL WARNING FOR PRODUCTION:
 * - Passwords are matched in plain text on seed data for demo purposes.
 * - No secure session tokens or backend API authentication are established here.
 * - Before deploying to production, replace this component with real authentication
 *   (e.g., hashed passwords via bcrypt, HTTPS-only secure cookies or JWTs, server-side validation).
 */

import { useState } from "react";
import { useApp } from "../../store";
import { Field, Input, Btn } from "../../components/common/ui";
import { Fish, Shield, Lock, User, AlertCircle, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { POWERED_BY } from "../../constants/appConfig";
import { sanitizeErrorMessage } from "../../utils/errorMessages";

export default function Login() {
  const { login, users } = useApp();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await login(username, password);
      if (res && !res.success) {
        setError(sanitizeErrorMessage(res.message, "Invalid username or password."));
      }
    } catch (err) {
      setError(sanitizeErrorMessage(err, "Failed to log in. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (u) => {
    const defaultPassword = `${u.username}123`;
    const targetPass = (u.password && !u.password.startsWith("$2a$") && !u.password.startsWith("$2b$")) ? u.password : defaultPassword;
    setUsername(u.username);
    setPassword(targetPass);
    setError("");
    setIsSubmitting(true);

    try {
      const res = await login(u.username, targetPass);
      if (res && !res.success) {
        setError(sanitizeErrorMessage(res.message, "Invalid username or password."));
      }
    } catch (err) {
      setError(sanitizeErrorMessage(err, "Failed to log in. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-2 bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-white">
      <div className="w-full max-w-md space-y-3">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center rounded-2xl   ">
            <img src="/logo.png" alt="Royalion Logo" className="w-62 h-20 object-contain rounded-xl" />
          </div>
          {/* <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white" style={{ fontFamily: "Outfit" }}>
            Royalion
          </h1>
          <p className="text-sm text-slate-400">
            Cold Storage & ERP Management System
          </p> */}
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60  sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100" style={{ fontFamily: "Outfit" }}>
                Account Sign In
              </h2>
              <p className="text-xs text-slate-400">
                Enter your credentials to access the ERP dashboard
              </p>
            </div>

          </div>

          {error && (
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Username or Email" required>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  placeholder="e.g. admin or sales@royalion.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Cards */}
          <div className="pt-4 border-t border-slate-700/60">
            <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-0.5">
              <KeyRound size={13} className="text-teal-400" />
              <span>Quick Role-Based Login Presets:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDemoLogin(u)}
                  className="p-2.5 rounded-xl border border-slate-700/60 bg-slate-900/40 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-all group"
                >
                  <div className="font-bold text-xs text-slate-200 group-hover:text-teal-300 transition-colors">
                    {u.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {u.role}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Development Disclaimer Footer */}
        {/* <p className="text-[11px] text-slate-500 text-center leading-relaxed px-4">
          🔒 <strong>Development Dummy Authentication:</strong> Passwords are accepted for testing.
          Must be upgraded to real server token authentication (e.g. JWT/OAuth) before production release.
        </p> */}

        {/* Footer Credit Line */}
        <p className="text-xs text-slate-400 text-center font-medium ">
          {POWERED_BY}
        </p>
      </div>
    </div>
  );
}
