import { useLocation } from 'react-router-dom';
import { Bell, CalendarDays, Menu } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { RoleBadge } from './Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { notifyInfo } from '../utils/alerts.js';

const pageMeta = {
  '/': {
    title: 'Dashboard',
    subtitle: 'A clear view of stock, activity and your team.'
  },
  '/products': {
    title: 'Products',
    subtitle: 'Create, search and keep every item in order.'
  },
  '/stock': {
    title: 'Stock room',
    subtitle: 'Move units in and out with a full movement history.'
  },
  '/users': {
    title: 'Team & roles',
    subtitle: 'Manage sub admins, managers and day or night staff.'
  }
};

export default function Topbar({ onOpenMenu }) {
  const { user } = useAuth();
  const location = useLocation();
  const meta = pageMeta[location.pathname] || {
    title: 'Workspace',
    subtitle: 'E-Kigega Arena inventory'
  };
  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(new Date());

  return (
    <header className="topbar">
      <div className="topbar-title">
        <button type="button" className="icon-button menu-button" onClick={onOpenMenu} aria-label="Open menu">
          <Menu size={21} />
        </button>
        <div>
          <div className="topbar-heading">
            <h1>{meta.title}</h1>
            <span className="live-pill">
              <i />
              Live
            </span>
          </div>
          <p>{meta.subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <span className="date-pill">
          <CalendarDays size={15} />
          {today}
        </span>
        <button
          type="button"
          className="icon-button notification-button"
          onClick={() =>
            notifyInfo('You are all caught up', 'New stock alerts will appear in your dashboard.')
          }
          aria-label="Notifications"
        >
          <Bell size={19} />
          <i className="notification-dot" />
        </button>
        <div className="topbar-user">
          <Avatar name={user?.name} size="sm" />
          <div>
            <strong>{user?.name}</strong>
            <RoleBadge role={user?.role} />
          </div>
        </div>
      </div>
    </header>
  );
}
