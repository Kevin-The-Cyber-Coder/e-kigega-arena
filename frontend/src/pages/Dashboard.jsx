import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  CircleAlert,
  Moon,
  Package,
  PackagePlus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  TriangleAlert,
  UsersRound,
  Wallet
} from 'lucide-react';
import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatCard from '../components/StatCard.jsx';
import ActivityItem from '../components/ActivityItem.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { RoleBadge, ShiftBadge, StockBadge } from '../components/Badge.jsx';
import { formatCurrency, formatNumber, greeting, stockState } from '../utils/format.js';
import { showApiError } from '../utils/alerts.js';

function DashboardSkeleton() {
  return (
    <div className="page-stack">
      <Skeleton className="skeleton-block skeleton-hero" />
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="skeleton-block skeleton-stat" />
        ))}
      </div>
      <div className="content-grid">
        <Skeleton className="skeleton-block skeleton-panel" />
        <Skeleton className="skeleton-block skeleton-panel" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
      setError('');
    } catch (requestError) {
      const message = getApiError(requestError, 'Could not load your dashboard.');
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

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="panel error-panel">
        <CircleAlert size={30} />
        <h2>Dashboard unavailable</h2>
        <p>{error || 'The dashboard data could not be loaded.'}</p>
        <button type="button" className="button primary" onClick={() => load()}>
          <RefreshCw size={17} /> Try again
        </button>
      </div>
    );
  }

  const isStaff = user.role === 'staff';
  const lowStock = data.lowStockProducts || [];
  const recentChanges = data.recentChanges || [];
  const firstName = user.name?.split(' ')[0] || 'there';
  const productCount = data.productCount || 0;
  const health = productCount
    ? Math.max(0, Math.round(((productCount - lowStock.length) / productCount) * 100))
    : 100;
  const canSeeTeam = ['super_admin', 'admin'].includes(user.role);

  const quickActions = [
    {
      title: 'Add a product',
      text: 'Save a new item with your name attached.',
      icon: PackagePlus,
      tone: 'violet',
      onClick: () => navigate('/products', { state: { create: true } })
    },
    {
      title: 'Move stock',
      text: 'Receive or release units in seconds.',
      icon: ArrowDownToLine,
      tone: 'teal',
      onClick: () => navigate('/stock')
    },
    permissions.manageUsers
      ? {
          title: 'Manage the team',
          text: 'Assign roles and day or night shifts.',
          icon: ShieldCheck,
          tone: 'amber',
          onClick: () => navigate('/users')
        }
      : {
          title: 'Review product list',
          text: 'See who added and edited each item.',
          icon: Package,
          tone: 'amber',
          onClick: () => navigate('/products')
        }
  ];

  return (
    <div className="page-stack">
      <section className="hero-banner">
        <div className="hero-copy">
          <div className="hero-tags">
            <span className="eyebrow">
              <Sparkles size={15} />
              {greeting()}, {firstName}
            </span>
            <RoleBadge role={user.role} />
            {user.shift ? <ShiftBadge shift={user.shift} /> : null}
          </div>
          <h2>
            {isStaff
              ? `Your ${user.shift || 'team'} shift is in good hands.`
              : 'Your arena inventory, beautifully organized.'}
          </h2>
          <p>
            {isStaff
              ? 'Track the stock you moved today and keep the next shift informed.'
              : 'Review stock health, recent team activity and the products that need attention.'}
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="button primary"
              onClick={() => navigate('/products', { state: { create: true } })}
            >
              <PackagePlus size={17} />
              Add product
            </button>
            <button type="button" className="button ghost" onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-ring" />
          <div className="hero-art-center">
            <Boxes size={48} strokeWidth={1.5} />
          </div>
          <span className="floating-tile tile-one">
            <Package size={18} />
            {formatNumber(productCount || data.stockAdded || 0)} {isStaff ? 'moved' : 'items'}
          </span>
          <span className="floating-tile tile-two">
            {user.shift === 'night' ? <Moon size={18} /> : <Sun size={18} />}
            {user.shift ? `${user.shift} shift` : 'Live stock'}
          </span>
          <span className="floating-tile tile-three">
            <Activity size={18} />
            {formatNumber(recentChanges.length)} updates
          </span>
        </div>
      </section>

      <section className="stats-grid">
        {isStaff ? (
          <>
            <StatCard icon={ArrowDownToLine} label="Stock added" value={data.stockAdded || 0} hint="Units received by you" tone="green" delay={50} />
            <StatCard icon={ArrowUpFromLine} label="Stock removed" value={data.stockRemoved || 0} hint="Units released by you" tone="amber" delay={100} />
            <StatCard
              icon={user.shift === 'night' ? Moon : Sun}
              label="Current shift"
              value={user.shift ? `${user.shift[0].toUpperCase()}${user.shift.slice(1)}` : '—'}
              hint={user.shift ? `${user.shift} team member` : 'No shift assigned'}
              tone="violet"
              delay={150}
            />
            <StatCard icon={Activity} label="Recent actions" value={recentChanges.length} hint="Saved in your activity log" tone="teal" delay={200} />
          </>
        ) : (
          <>
            <StatCard icon={Package} label="Total products" value={productCount} hint={`${health}% inventory health`} tone="violet" delay={50} />
            <StatCard icon={Wallet} label="Stock value" value={data.totalStockValue || 0} hint="Current value on hand" tone="green" formatter={formatCurrency} delay={100} />
            <StatCard icon={TriangleAlert} label="Low stock" value={lowStock.length} hint={lowStock.length ? 'Needs your attention' : 'Everything looks healthy'} tone={lowStock.length ? 'rose' : 'teal'} delay={150} />
            <StatCard
              icon={UsersRound}
              label={canSeeTeam ? 'Team members' : 'Healthy products'}
              value={canSeeTeam ? data.userCount || 0 : Math.max(0, productCount - lowStock.length)}
              hint={canSeeTeam ? 'Across every role' : 'Above minimum stock'}
              tone="amber"
              delay={200}
            />
          </>
        )}
      </section>

      <section className="quick-grid">
        {quickActions.map((action) => (
          <button key={action.title} type="button" className={`quick-action tone-${action.tone}`} onClick={action.onClick}>
            <span className="quick-icon">
              <action.icon size={21} />
            </span>
            <span>
              <strong>{action.title}</strong>
              <small>{action.text}</small>
            </span>
            <ArrowRight size={18} className="quick-arrow" />
          </button>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Attention</span>
              <h3>{isStaff ? 'Your shift snapshot' : 'Low stock products'}</h3>
            </div>
            {!isStaff ? (
              <button type="button" className="text-button" onClick={() => navigate('/stock')}>
                Open stock room <ArrowRight size={15} />
              </button>
            ) : null}
          </div>

          {isStaff ? (
            <div className="shift-spotlight">
              <span className={`shift-big-icon ${user.shift === 'night' ? 'night' : 'day'}`}>
                {user.shift === 'night' ? <Moon size={32} /> : <Sun size={32} />}
              </span>
              <div>
                <strong>{user.shift ? `${user.shift[0].toUpperCase()}${user.shift.slice(1)} shift` : 'No shift'}</strong>
                <p>
                  {user.shift
                    ? `You are responsible for stock movement during the ${user.shift} shift.`
                    : 'Ask an admin to assign you a day or night shift.'}
                </p>
              </div>
              <div className="shift-numbers">
                <span>
                  <b>+{formatNumber(data.stockAdded || 0)}</b> in
                </span>
                <span>
                  <b>-{formatNumber(data.stockRemoved || 0)}</b> out
                </span>
              </div>
            </div>
          ) : lowStock.length ? (
            <div className="low-stock-list">
              {lowStock.slice(0, 5).map((product) => (
                <article key={product._id} className="low-stock-item">
                  <span className="product-letter">{product.name.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{product.name}</strong>
                    <small>
                      {product.quantity} left · minimum {product.minStock}
                    </small>
                  </div>
                  <StockBadge state={stockState(product)} />
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="All stock levels are healthy"
              text="No product has reached its minimum stock level."
            />
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Live log</span>
              <h3>Recent activity</h3>
            </div>
            <span className="count-pill">{recentChanges.length}</span>
          </div>

          {recentChanges.length ? (
            <div className="activity-list">
              {recentChanges.slice(0, 6).map((activity) => (
                <ActivityItem key={activity._id} activity={activity} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              text="Product and stock changes will appear here automatically."
            />
          )}
        </div>
      </section>

      {canSeeTeam ? (
        <section className="panel team-snapshot">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Team pulse</span>
              <h3>Shift coverage</h3>
            </div>
            <button type="button" className="text-button" onClick={() => navigate('/users')}>
              Manage team <ArrowRight size={15} />
            </button>
          </div>
          <div className="coverage-grid">
            <div className="coverage-item">
              <span className="coverage-icon day">
                <Sun size={20} />
              </span>
              <div>
                <span>Day staff</span>
                <strong>{data.dayStaffCount || 0}</strong>
              </div>
              <i style={{ width: `${Math.min(100, (data.dayStaffCount || 0) * 18)}%` }} />
            </div>
            <div className="coverage-item">
              <span className="coverage-icon night">
                <Moon size={20} />
              </span>
              <div>
                <span>Night staff</span>
                <strong>{data.nightStaffCount || 0}</strong>
              </div>
              <i style={{ width: `${Math.min(100, (data.nightStaffCount || 0) * 18)}%` }} />
            </div>
            <div className="coverage-item">
              <span className="coverage-icon admin">
                <ShieldCheck size={20} />
              </span>
              <div>
                <span>Sub admins</span>
                <strong>{data.adminCount || 0}</strong>
              </div>
              <i style={{ width: `${Math.min(100, (data.adminCount || 0) * 25)}%` }} />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
