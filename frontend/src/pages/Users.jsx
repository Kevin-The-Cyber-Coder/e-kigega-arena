import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CircleAlert,
  Mail,
  Moon,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  UserPlus,
  UsersRound
} from 'lucide-react';
import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import UserModal from '../components/UserModal.jsx';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { RoleBadge, ShiftBadge } from '../components/Badge.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { confirmAction, notifySuccess, showApiError } from '../utils/alerts.js';
import { formatDate, formatNumber } from '../utils/format.js';

const tabs = [
  { id: 'all', label: 'Everyone' },
  { id: 'admin', label: 'Sub admins' },
  { id: 'manager', label: 'Managers' },
  { id: 'day', label: 'Day staff' },
  { id: 'night', label: 'Night staff' }
];

function UsersSkeleton() {
  return (
    <div className="page-stack">
      <Skeleton className="skeleton-block skeleton-intro" />
      <div className="mini-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="skeleton-block skeleton-mini" />
        ))}
      </div>
      <div className="user-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="skeleton-block skeleton-user" />
        ))}
      </div>
    </div>
  );
}

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState({ open: false, target: null, defaultRole: 'staff' });

  async function load(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.users || []);
      setError('');
    } catch (requestError) {
      const message = getApiError(requestError, 'Could not load the team.');
      setError(message);
      showApiError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function canManageTarget(target) {
    if (!target || target.role === 'super_admin' || target._id === user._id) return false;
    if (user.role === 'super_admin') return true;
    return ['manager', 'staff'].includes(target.role);
  }

  const counts = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((item) => item.role === 'admin').length,
      day: users.filter((item) => item.role === 'staff' && item.shift === 'day').length,
      night: users.filter((item) => item.role === 'staff' && item.shift === 'night').length
    }),
    [users]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((item) => {
      const matchesTab =
        tab === 'all' ||
        (['admin', 'manager'].includes(tab) && item.role === tab) ||
        (['day', 'night'].includes(tab) && item.role === 'staff' && item.shift === tab);
      if (!matchesTab) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        (item.createdByName || '').toLowerCase().includes(term)
      );
    });
  }, [users, tab, search]);

  async function removeUser(target) {
    const confirmed = await confirmAction({
      title: `Remove ${target.name}?`,
      text: 'Their account will be deleted. This cannot be undone.',
      confirmText: 'Remove account',
      danger: true,
      icon: 'warning'
    });
    if (!confirmed) return;

    try {
      await api.delete(`/users/${target._id}`);
      setUsers((current) => current.filter((item) => item._id !== target._id));
      notifySuccess('Team member removed', `${target.name} no longer has access.`);
    } catch (requestError) {
      showApiError(getApiError(requestError));
    }
  }

  function openCreate(defaultRole = 'staff') {
    setModal({ open: true, target: null, defaultRole });
  }

  if (loading) return <UsersSkeleton />;

  if (error) {
    return (
      <div className="panel error-panel">
        <CircleAlert size={30} />
        <h2>Team page unavailable</h2>
        <p>{error}</p>
        <button type="button" className="button primary" onClick={() => load()}>
          <RefreshCw size={17} /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <span className="eyebrow">
            <UsersRound size={15} />
            {formatNumber(users.length)} people with access
          </span>
          <h2>Team & roles</h2>
          <p>Create sub admins, assign managers and keep day and night staff covered.</p>
        </div>
        <div className="intro-actions">
          <button type="button" className="button ghost" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {user.role === 'super_admin' ? (
            <button type="button" className="button ghost" onClick={() => openCreate('admin')}>
              <ShieldCheck size={17} />
              Add sub admin
            </button>
          ) : null}
          <button type="button" className="button primary" onClick={() => openCreate('staff')}>
            <UserPlus size={17} />
            Add member
          </button>
        </div>
      </section>

      <section className="mini-stats">
        <article>
          <span className="mini-icon violet">
            <UsersRound size={18} />
          </span>
          <div>
            <small>Team members</small>
            <strong>{formatNumber(counts.total)}</strong>
          </div>
        </article>
        <article>
          <span className="mini-icon blue">
            <ShieldCheck size={18} />
          </span>
          <div>
            <small>Sub admins</small>
            <strong>{formatNumber(counts.admins)}</strong>
          </div>
        </article>
        <article>
          <span className="mini-icon amber">
            <Sun size={18} />
          </span>
          <div>
            <small>Day staff</small>
            <strong>{formatNumber(counts.day)}</strong>
          </div>
        </article>
        <article>
          <span className="mini-icon night">
            <Moon size={18} />
          </span>
          <div>
            <small>Night staff</small>
            <strong>{formatNumber(counts.night)}</strong>
          </div>
        </article>
      </section>

      <section className="toolbar user-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email or who created the account…"
          />
          {search ? (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
              ×
            </button>
          ) : null}
        </label>
        <div className="tab-row">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'active' : ''}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {visible.length ? (
        <div className="user-grid">
          {visible.map((member, index) => {
            const manageable = canManageTarget(member);
            const isSelf = member._id === user._id;
            return (
              <article
                className="user-card"
                key={member._id}
                style={{ animationDelay: `${Math.min(index * 45, 300)}ms` }}
              >
                <div className="user-card-top">
                  <Avatar
                    name={member.name}
                    size="lg"
                    status={member.role === 'staff' ? member.shift : 'online'}
                  />
                  <div className="user-card-identity">
                    <div>
                      <h3>{member.name}</h3>
                      {isSelf ? <span className="you-pill">You</span> : null}
                    </div>
                    <span className="user-email">
                      <Mail size={13} /> {member.email}
                    </span>
                  </div>
                  <div className="row-actions">
                    {manageable ? (
                      <>
                        <button
                          type="button"
                          className="icon-button soft"
                          title="Edit member"
                          onClick={() => setModal({ open: true, target: member, defaultRole: member.role })}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button soft danger"
                          title="Remove member"
                          onClick={() => removeUser(member)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <span className="locked-note">
                        <ShieldCheck size={14} /> Protected
                      </span>
                    )}
                  </div>
                </div>

                <div className="user-badges">
                  <RoleBadge role={member.role} />
                  {member.role === 'staff' ? <ShiftBadge shift={member.shift} /> : null}
                </div>

                <div className="user-meta">
                  <span>
                    <CalendarDays size={14} /> Joined {formatDate(member.createdAt)}
                  </span>
                  <span>Created by {member.createdByName || 'System'}</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={UsersRound}
          title={users.length ? 'No team members match' : 'No team members yet'}
          text={
            users.length
              ? 'Try another tab or clear the search to see the full team.'
              : 'Add your first team member and assign the right role and shift.'
          }
          action={
            users.length ? (
              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setSearch('');
                  setTab('all');
                }}
              >
                Clear filters
              </button>
            ) : (
              <button type="button" className="button primary" onClick={() => openCreate('staff')}>
                <UserPlus size={17} /> Add first member
              </button>
            )
          }
        />
      )}

      <UserModal
        open={modal.open}
        target={modal.target}
        defaultRole={modal.defaultRole}
        onClose={() => setModal({ open: false, target: null, defaultRole: 'staff' })}
        onSaved={() => load(true)}
      />
    </div>
  );
}
