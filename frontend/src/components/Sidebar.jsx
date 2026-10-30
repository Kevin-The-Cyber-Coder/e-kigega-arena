import { NavLink } from 'react-router-dom';
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  Sparkles,
  UsersRound,
  Warehouse,
  X
} from 'lucide-react';
import Avatar from './Avatar.jsx';
import { RoleBadge, ShiftBadge } from './Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { classNames } from '../utils/format.js';

const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/stock', label: 'Stock room', icon: Warehouse },
  { to: '/users', label: 'Team & roles', icon: UsersRound, managerOnly: true }
];

export default function Sidebar({ open, onClose, onLogout }) {
  const { user, permissions } = useAuth();

  return (
    <>
      <div
        className={classNames('sidebar-overlay', open && 'is-visible')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={classNames('sidebar', open && 'is-open')}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <Boxes size={23} strokeWidth={2.2} />
          </span>
          <div>
            <strong>E-Kigega</strong>
            <span>Arena inventory</span>
          </div>
          <button type="button" className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-chip">
          <Sparkles size={15} />
          <span>Smart stock control</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="sidebar-label">Workspace</span>
          {navigation
            .filter((item) => !item.managerOnly || permissions.manageUsers)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => classNames('nav-item', isActive && 'active')}
                onClick={onClose}
              >
                <item.icon size={19} strokeWidth={2} />
                <span>{item.label}</span>
                <i className="nav-dot" />
              </NavLink>
            ))}
        </nav>

        <div className="sidebar-account">
          <span className="sidebar-label">Signed in as</span>
          <div className="account-card">
            <Avatar name={user?.name} size="sm" status="online" />
            <div className="account-copy">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <div className="account-badges">
            <RoleBadge role={user?.role} />
            {user?.shift ? <ShiftBadge shift={user.shift} /> : null}
          </div>
          <button type="button" className="logout-button" onClick={onLogout}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
