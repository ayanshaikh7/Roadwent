import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Components/Navbar';
import ProtectedRoute from './Components/ProtectedRoute';
import HomePage from './pages/Homepage.js';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import ClientDetailsPage from './pages/ClientDetailsPage';
import EstimatorPage from './pages/EstimatorPage';
import ReportPage from './pages/ReportPage';
import HelpPage from './pages/HelpPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider } from './Context/AuthContext';

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Pick up a toast message from navigation state, if any
  useEffect(() => {
    const msg = location.state && location.state.toast;
    if (msg) {
      setToast(msg);
      setToastVisible(true);
      // Remove state from URL so it doesn't re-trigger on refresh/back
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Auto-hide whenever a toast message is set
  useEffect(() => {
    if (!toast) return;
    setToastVisible(true);
    const hideTimer = setTimeout(() => setToastVisible(false), 3000);
    const clearTimer = setTimeout(() => setToast(''), 3400);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
    };
  }, [toast]);

  // Listen for app-wide toast events
  useEffect(() => {
    const handler = (e) => {
      const d = e?.detail;
      const msg = typeof d === 'string' ? d : (d && d.msg);
      if (msg) {
        // Force re-trigger even if same message by clearing first
        setToast('');
        setTimeout(() => setToast(msg), 0);
      }
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen font-sans">
      <Navbar />
      {toast ? (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={
              `bg-green-500 text-white px-4 py-2 rounded shadow transition transform duration-300 ease-out ` +
              (toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2')
            }
          >
            {toast}
          </div>
        </div>
      ) : null}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="project-details" element={<ProjectDetailsPage />} />
            <Route path="client-details" element={<ClientDetailsPage />} />
            <Route
              path="estimator"
              element={
                <ProtectedRoute>
                  <EstimatorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="report"
              element={
                <ProtectedRoute>
                  <ReportPage />
                </ProtectedRoute>
              }
            />
            <Route path="help" element={<HelpPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;