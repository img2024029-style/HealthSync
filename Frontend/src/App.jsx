import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import HospitalDashboard from "./pages/HospitalDashboard.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

/*
  Flow (best practice):
  Landing (/) -> Login (/login, role toggle: Patient | Hospital)
              -> Signup (/signup, same toggle)
  Login <-> Signup link to each other.
  On success -> /dashboard/patient or /dashboard/hospital (JWT-protected)

  Admin is a separate, unadvertised flow (/admin/login) — no signup page,
  no role toggle. Admin accounts are provisioned via Backend/scripts/seedAdmin.js,
  not through the public API.
*/
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/dashboard/patient"
        element={
          <ProtectedRoute role="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/hospital"
        element={
          <ProtectedRoute role="hospital">
            <HospitalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
