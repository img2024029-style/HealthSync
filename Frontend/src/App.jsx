import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import HospitalDashboard from "./pages/HospitalDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

/*
  Flow (best practice):
  Landing (/) -> Login (/login, role toggle: Patient | Hospital)
              -> Signup (/signup, same toggle)
  Login <-> Signup link to each other.
  On success -> /dashboard/patient or /dashboard/hospital (JWT-protected)
*/
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
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
    </Routes>
  );
}
