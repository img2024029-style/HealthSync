import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import { authApi } from "../lib/api.js";

/**
 * Landing page for the verification link sent by email:
 *   {CLIENT_URL}/verify-email?token=...
 * POSTs the token to /api/auth/verify-email and shows the result.
 */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState(token ? "verifying" : "missing");
  const [message, setMessage] = useState("");
  const firedRef = useRef(false); // guard against double-fire (React StrictMode)

  useEffect(() => {
    if (!token || firedRef.current) return;
    firedRef.current = true;

    authApi
      .verifyEmail(token)
      .then((res) => {
        setMessage(res?.message || "Email verified successfully. You can now log in.");
        setStatus("success");
      })
      .catch((err) => {
        setMessage(err.message || "Verification failed. The link may be invalid or expired.");
        setStatus("error");
      });
  }, [token]);

  return (
    <AuthLayout
      title="Email verification"
      subtitle="Confirming your HealthSync account."
      showRoleToggle={false}
    >
      <div className="mt-6 space-y-4 text-center">
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-3 py-6 text-slate-500">
            <Loader2 size={36} className="animate-spin text-brand-600" />
            <p className="text-sm">Verifying your email…</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 size={40} className="text-green-500" />
            <p className="text-sm text-slate-600">{message}</p>
            <Link
              to="/login"
              className="mt-2 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-700"
            >
              Continue to login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <XCircle size={40} className="text-red-500" />
            <p className="text-sm text-red-600">{message}</p>
            <p className="text-xs text-slate-500">
              You can request a new link from the login page.
            </p>
            <Link
              to="/login"
              className="mt-2 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-700"
            >
              Back to login
            </Link>
          </div>
        )}

        {status === "missing" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <XCircle size={40} className="text-red-500" />
            <p className="text-sm text-red-600">
              No verification token found. Please use the link from your email.
            </p>
            <Link
              to="/login"
              className="mt-2 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-700"
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
