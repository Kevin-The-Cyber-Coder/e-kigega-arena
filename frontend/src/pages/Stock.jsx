import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CircleAlert,
  Filter,
  Package,
  RefreshCw,
  Search,
  TriangleAlert,
  Warehouse
} from 'lucide-react';
import api, { getApiError } from '../api/client.js';
import StockModal from '../components/StockModal.jsx';
import ActivityItem from '../components/ActivityItem.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { StockBadge } from '../components/Badge.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { showApiError } from '../utils/alerts.js';
import { classNames, formatNumber, stockState } from '../utils/format.js';

function StockSkeleton() {
  return (
    <div className="page-stack">
      <Skeleton className="skeleton-block skeleton-intro" />
      <div className="mini-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="skeleton-block skeleton-mini" />
        ))}
      </div>
      <div className="stock-layout">
        <Skeleton className="skeleton-block skeleton-panel" />
        <Skeleton className="skeleton-block skeleton-panel" />
      </div>
    </div>
  );
}

export default function Stock() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [stockModal, setStockModal] = useState({ open: false, product: null, direction: 'in' });

  async function load(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get('/stock');
      setProducts(data.products || []);
      setMovements(data.movements || []);
      setError('');
    } catch (requestError) {
      const message = getApiError(requestError, 'Could not load stock data.');
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

  const totals = useMemo(
    () => ({
      units: products.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      low: products.filter((item) => stockState(item) !== 'healthy').length,
      out: products.filter((item) => Number(item.quantity) <= 0).length
    }),
    [products]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (term && !product.name.toLowerCase().includes(term)) return false;
      if (lowOnly && stockState(product) === 'healthy') return false;
      return true;
    });
  }, [products, search, lowOnly]);

  if (loading) return <StockSkeleton />;

  if (error) {
    return (
      <div className="panel error-panel">
        <CircleAlert size={30} />
        <h2>Stock room unavailable</h2>
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
            <Warehouse size={15} />
            Movement history updates instantly
          </span>
          <h2>Stock room</h2>
          <p>Receive new units or release stock while keeping a clear audit trail.</p>
        </div>
        <div className="intro-actions">
          <button type="button" className="button ghost" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" className="button primary" onClick={() => navigate('/products')}>
            <Package size={17} />
            View products
          </button>
        </div>
      </section>

      <section className="mini-stats">
        <article>
          <span className="mini-icon violet">
            <Boxes size={18} />
          </span>
          <div>
            <small>Products tracked</small>
            <strong>{formatNumber(products.length)}</strong>
          </div>
        </article>
        <article>
          <span className="mini-icon teal">
            <Warehouse size={18} />
          </span>
          <div>
            <small>Units on hand</small>
            <strong>{formatNumber(totals.units)}</strong>
          </div>
        </article>
        <article>
          <span className={classNames('mini-icon', totals.low ? 'amber' : 'green')}>
            <TriangleAlert size={18} />
          </span>
          <div>
            <small>Low stock</small>
            <strong>{formatNumber(totals.low)}</strong>
          </div>
        </article>
        <article>
          <span className="mini-icon rose">
            <Activity size={18} />
          </span>
          <div>
            <small>Recent movements</small>
            <strong>{formatNumber(movements.length)}</strong>
          </div>
        </article>
      </section>

      <section className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a product in the stock room…"
          />
          {search ? (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
              ×
            </button>
          ) : null}
        </label>
        <button
          type="button"
          className={classNames('filter-toggle', lowOnly && 'active')}
          onClick={() => setLowOnly((value) => !value)}
        >
          <Filter size={16} />
          Low stock only
        </button>
      </section>

      <div className="stock-layout">
        <section className="panel stock-products-panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">On hand</span>
              <h3>Products</h3>
            </div>
            <span className="count-pill">{visible.length}</span>
          </div>

          {visible.length ? (
            <div className="stock-product-list">
              {visible.map((product) => {
                const state = stockState(product);
                const fill = Math.min(
                  100,
                  Math.round((Number(product.quantity) / Math.max(1, Number(product.minStock) * 3)) * 100)
                );
                return (
                  <article className="stock-row" key={product._id}>
                    <span className={`product-glyph small tone-${state}`}>
                      {product.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="stock-row-copy">
                      <div>
                        <strong>{product.name}</strong>
                        <StockBadge state={state} />
                      </div>
                      <div className={`stock-meter tone-${state}`}>
                        <i style={{ width: `${Math.max(4, fill)}%` }} />
                      </div>
                      <small>Minimum alert at {product.minStock} units</small>
                    </div>
                    <div className="stock-row-number">
                      <strong>{formatNumber(product.quantity)}</strong>
                      <span>units</span>
                    </div>
                    <div className="stock-row-actions">
                      <button
                        type="button"
                        className="icon-button in"
                        title="Add stock"
                        onClick={() => setStockModal({ open: true, product, direction: 'in' })}
                      >
                        <ArrowDownToLine size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button out"
                        title="Remove stock"
                        disabled={Number(product.quantity) <= 0}
                        onClick={() => setStockModal({ open: true, product, direction: 'out' })}
                      >
                        <ArrowUpFromLine size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Warehouse}
              title={products.length ? 'No products match' : 'No products yet'}
              text={
                products.length
                  ? 'Try clearing the search or low stock filter.'
                  : 'Add products first, then stock movements will appear here.'
              }
            />
          )}
        </section>

        <section className="panel movements-panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Audit trail</span>
              <h3>Recent movements</h3>
            </div>
            <span className="count-pill">{movements.length}</span>
          </div>

          {movements.length ? (
            <div className="activity-list">
              {movements.map((movement) => (
                <ActivityItem key={movement._id} activity={movement} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No movements yet"
              text="Stock in and stock out actions will show up here with the person who did them."
            />
          )}
        </section>
      </div>

      <StockModal
        open={stockModal.open}
        product={stockModal.product}
        direction={stockModal.direction}
        onClose={() => setStockModal({ open: false, product: null, direction: 'in' })}
        onSaved={() => load(true)}
      />
    </div>
  );
}
