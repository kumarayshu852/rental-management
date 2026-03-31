import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/signup";
import Dashboard from "./pages/Dashboard";
import TenantDashboard from "./pages/tenantDashboard";
 
// Role-based Protected Route
function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
 
  if (!token) return <Navigate to="/" />;
  if (allowedRole && user.role !== allowedRole) {
    // Role match nahi — sahi dashboard pe bhejo
    if (user.role === "admin") return <Navigate to="/dashboard" />;
    if (user.role === "tenant") return <Navigate to="/my-dashboard" />;
    return <Navigate to="/" />;
  }
  return children;
}
 
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
 
        {/* Admin ka dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />
 
        {/* Tenant ka dashboard */}
        <Route
          path="/my-dashboard"
          element={
            <ProtectedRoute allowedRole="tenant">
              <TenantDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
 
export default App;
 