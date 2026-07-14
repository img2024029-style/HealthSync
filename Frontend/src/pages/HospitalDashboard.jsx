import { useNavigate } from "react-router-dom";
import { HeartPulse, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <HeartPulse size={20} />
            </span>
            <span className="font-display text-xl font-bold text-brand-900">
              HealthSync
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-brand-900">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-2 text-slate-500">
          Departments, patient queue, schedules and more coming soon.
        </p>
      </main>
    </div>
  );
}
