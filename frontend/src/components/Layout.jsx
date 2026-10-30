import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { confirmAction, notifySuccess } from '../utils/alerts.js';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  async function handleLogout() {
    const confirmed = await confirmAction({
      title: 'Sign out of your account?',
      text: 'Your session will end and you will return to the sign in screen.',
      confirmText: 'Sign out',
      icon: 'question',
      danger: true
    });

    if (!confirmed) return;

    await logout();
    notifySuccess('Signed out', 'Your inventory session has been closed safely.');
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <div className="ambient-blob ambient-one" aria-hidden="true" />
      <div className="ambient-blob ambient-two" aria-hidden="true" />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <div className="app-main">
        <Topbar onOpenMenu={() => setSidebarOpen(true)} />
        <main className="page-wrap">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
