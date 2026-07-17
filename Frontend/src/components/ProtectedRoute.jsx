import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Guards a route behind a valid session (and optionally a specific role).
 * - Not authenticated -> bounce to /login (preserving intended role via query param)
 * - Authenticated but wrong role -> bounce to that role's own dashboard
 */
export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, role: currentRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (role === "admin") {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to={`/login${role ? `?role=${role}` : ""}`} replace />;
  }

  if (role && currentRole !== role) {
    return <Navigate to={`/dashboard/${currentRole}`} replace />;
  }

  return children;
}
