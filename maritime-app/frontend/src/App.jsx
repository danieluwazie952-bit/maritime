import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect }                    from 'react';
import { AuthProvider, useAuth }                  from './contexts/AuthContext';

import Login          from './pages/auth/Login';
import Signup         from './pages/auth/Signup';
import VerifyEmail    from './pages/auth/VerifyEmail';
import StudentDash    from './pages/student/Dashboard';
import AdminLogin     from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDetail  from './pages/admin/StudentDetail';
import SuperAdmin     from './pages/SuperAdmin';

// ── Ship Steering Wheel SVG ───────────────────────────────────────────────────
export const SteeringWheel = ({ size = 60, color = 'currentColor', spin = false }) => {
  const R = 43;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 * Math.PI) / 180;
    return { x: 50 + R * Math.sin(a), y: 50 - R * Math.cos(a) };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
         className={spin ? 'spin-slow' : ''} style={{ color, flexShrink: 0 }}>
      <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="5" />
      {pts.map((p, i) => (
        <line key={i} x1="50" y1="50" x2={p.x} y2={p.y}
              stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      ))}
      <circle cx="50" cy="50" r="9" fill="currentColor" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill="currentColor" />)}
    </svg>
  );
};

// ── Full-screen Loading Screen ────────────────────────────────────────────────
export const LoadingScreen = () => (
  <div className="fixed inset-0 bg-blue-800 flex flex-col items-center justify-center z-50 gap-8 px-6">
    <SteeringWheel size={110} color="white" spin />
    <div className="text-center">
      <h1 className="text-white text-2xl md:text-3xl font-bold leading-snug max-w-md">
        Department of Maritime Transport and Logistics
      </h1>
      <p className="text-blue-200 text-sm mt-3 tracking-widest uppercase">Loading…</p>
    </div>
  </div>
);

// ── Protected Route ───────────────────────────────────────────────────────────
const Protected = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)                              return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 2000); return () => clearTimeout(t); }, []);
  if (!ready) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/"                    element={<Navigate to="/login" replace />} />
      <Route path="/login"               element={<Login />} />
      <Route path="/signup"              element={<Signup />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/admin"               element={<AdminLogin />} />
      <Route path="/super-dev-access"    element={<SuperAdmin />} />

      <Route path="/dashboard" element={
        <Protected roles={['student']}><StudentDash /></Protected>
      } />
      <Route path="/admin/dashboard" element={
        <Protected roles={['admin']}><AdminDashboard /></Protected>
      } />
      <Route path="/admin/students/:id" element={
        <Protected roles={['admin']}><StudentDetail /></Protected>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
