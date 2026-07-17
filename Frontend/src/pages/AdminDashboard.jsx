import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-brand-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
              <ShieldCheck size={20} />
            </span>
            <span className="font-display text-xl font-bold text-white">
              HealthSync Admin
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-brand-900">
          Welcome{user?.fullName?.firstName ? `, ${user.fullName.firstName}` : ""}
        </h1>
        <p className="mt-2 text-slate-500">
          User, hospital and audit-log management tools are coming soon.
        </p>
      </main>
    </div>
  );
}
