import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Dedicated admin sign-in page.
 *
 * Deliberately separate from Login.jsx rather than a third tab on the
 * patient/hospital toggle: it has no "Sign up" link (admin accounts are
 * provisioned out-of-band — see Backend/scripts/seedAdmin.js, there is no
 * public admin registration endpoint) and keeping it off the shared login
 * screen means it isn't advertised to every visitor who lands on /login.
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email: form.email, password: form.password, appRole: "admin" });
      navigate("/dashboard/admin");
    } catch (err) {
      // Backend intentionally returns the same "Invalid email or password"
      // message whether the account doesn't exist or the password is wrong.
      setError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Admin sign in"
      subtitle="Restricted access. Authorized administrators only."
      showRoleToggle={false}
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="username"
            value={form.email}
            onChange={handleChange}
            placeholder="admin@healthsync.com"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              minLength={8}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-900 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-900/25 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in as Admin"}
        </button>
      </form>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <ShieldCheck size={14} />
        This sign-in is monitored and logged.
      </p>
    </AuthLayout>
  );
}
