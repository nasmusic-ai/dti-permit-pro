import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, FileText, User, LayoutDashboard, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ApplicationForm from './pages/ApplicationForm';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-safe pt-12">
      {/* Top Navbar */}
      <header className="bg-blue-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <div className="font-bold text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-white text-blue-900 rounded-full flex items-center justify-center font-black">
                DTI
              </div>
              Business Portal
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            {user ? (
              <>
                <span className="text-blue-200">Welcome, {user.email}</span>
                <button onClick={handleLogout} className="hover:text-blue-200 transition-colors">Logout</button>
              </>
            ) : (
              <Link to="/login" className="hover:text-blue-200 transition-colors">Login / Register</Link>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 bg-blue-900 text-white flex justify-between items-center pt-safe">
                <span className="font-bold text-lg">Menu</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-blue-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
                <SidebarLink to="/" icon={<Home size={20} />} label="Home" />
                
                {user?.role === 'admin' ? (
                  <>
                    <div className="mt-4 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</div>
                    <SidebarLink to="/admin/dashboard" icon={<Settings size={20} />} label="Admin Dashboard" />
                  </>
                ) : user ? (
                  <>
                    <div className="mt-4 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">My Account</div>
                    <SidebarLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="My Dashboard" />
                    <SidebarLink to="/apply" icon={<FileText size={20} />} label="New Application" />
                  </>
                ) : (
                  <>
                    <div className="mt-4 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</div>
                    <SidebarLink to="/login" icon={<User size={20} />} label="User Login / Register" />
                    <SidebarLink to="/admin/login" icon={<Settings size={20} />} label="CMS / Admin Login" />
                  </>
                )}
              </nav>
              {user && (
                <div className="p-4 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
        isActive 
          ? "bg-blue-50 text-blue-700" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
