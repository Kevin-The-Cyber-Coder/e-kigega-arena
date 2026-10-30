import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownUp,
  CircleAlert,
  Grid2X2,
  List,
  Package,
  PackagePlus,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Layers3,
  Wallet
} from 'lucide-react';
import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProductModal from '../components/ProductModal.jsx';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { StockBadge } from '../components/Badge.jsx';
import { CardSkeleton } from '../components/Skeleton.jsx';
import { confirmAction, notifySuccess, showApiError } from '../utils/alerts.js';
import {
  classNames,
  formatCurrency,
  formatNumber,
  stockState,
  timeAgo
} from '../utils/format.js';

export default function Products() {
  const { permissions } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name-asc');
  const [view, setView] = useState('grid');
  const [modal, setModal] = useState({ open: false, product: null });

  async function load(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
      setError('');
    } catch (requestError) {
      const message = getApiError(requestError, 'Could not load products.');
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

  useEffect(() => {
    if (location.state?.create) {
      setModal({ open: true, product: null });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.addedByName || '').toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (filter === 'all') return true;
      return stockState(product) === filter;
    });

    return [...list].sort((a, b) => {
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'quantity-asc') return a.quantity - b.quantity;
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return a.name.localeCompare(b.name);
    });
  }, [products, search, filter, sort]);

  const totals = useMemo(
    () => ({
      units: products.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      value: products.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
      low: products.filter((item) => stockState(item) !== 'healthy').length
    }),
    [products]
  );

  async function removeProduct(product) {
    const confirmed = await confirmAction({
      title: `Delete ${product.name}?`,
      text: 'This removes the product permanently. Stock history will remain in the activity log.',
      confirmText: 'Delete product',
      danger: true,
      icon: 'warning'
    });
    if (!confirmed) return;

    try {
      await api.delete(`/products/${product._id}`);
      setProducts((current) => current.filter((item) => item._id !== product._id));
      notifySuccess('Product deleted', `${product.name} was removed from inventory.`);
    } catch (requestError) {
      showApiError(getApiError(requestError));
    }
  }

  function handleSaved() {
    load(true);
  }

  const hasFilters = search || filter !== 'all';

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <span className="eyebrow">
            <Package size={15} />
            {formatNumber(products.length)} products tracked
          </span>
          <h2>Your inventory, always in view</h2>
          <p>Search, filter and see exactly who added or last edited every product.</p>
        </div>
        <div className="intro-actions">
          <button type="button" className="button ghost" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {permissions.addProducts ? (
            <button type="button" className="button primary" onClick={() => setModal({ open: true, product: null })}>
              <PackagePlus size={17} />
              Add product
            </button>
          ) : null}
        </div>
      </section>

      <section className="mini-stats">
        <article>
          <span className="mini-icon violet">
            <Package size={18} />
          </span>
          <div>
            <small>Products</small>
            <strong>{formatNumber(products.length)}</strong>
          </div>
        </article>
        <article>
          <span className="mini-icon teal">
            <Layers3 size={18} />
          </span>
          <div>
            <small>Units on hand</small>
            <strong>{formatNumber(totals.units)}</strong>
          </div>
        </article>
        <article>
          <span className="mini-icon green">
            <Wallet size={18} />
          </span>
          <div>
            <small>Stock value</small>
            <strong>{formatCurrency(totals.value)}</strong>
          </div>
        </article>
        <article>
          <span className={classNames('mini-icon', totals.low ? 'rose' : 'green')}>
            <CircleAlert size={18} />
          </span>
          <div>
            <small>Need attention</small>
            <strong>{formatNumber(totals.low)}</strong>
          </div>
        </article>
      </section>

      <section className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products or the person who added them…"
          />
          {search ? (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
              ×
            </button>
          ) : null}
        </label>

        <div className="toolbar-controls">
          <label className="select-box">
            <ArrowDownUp size={16} />
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All stock</option>
              <option value="healthy">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </label>

          <label className="select-box">
            <ArrowDownUp size={16} />
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="price-desc">Highest price</option>
              <option value="quantity-asc">Lowest quantity</option>
              <option value="newest">Newest first</option>
            </select>
          </label>

          <div className="view-switch">
            <button
              type="button"
              className={view === 'grid' ? 'active' : ''}
              onClick={() => setView('grid')}
              aria-label="Grid view"
            >
              <Grid2X2 size={17} />
            </button>
            <button
              type="button"
              className={view === 'list' ? 'active' : ''}
              onClick={() => setView('list')}
              aria-label="List view"
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="panel error-panel">
          <CircleAlert size={30} />
          <h2>Products unavailable</h2>
          <p>{error}</p>
          <button type="button" className="button primary" onClick={() => load()}>
            <RefreshCw size={17} /> Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={hasFilters ? 'No products match your filters' : 'Your inventory is empty'}
          text={
            hasFilters
              ? 'Try another search or clear the stock filter to see everything.'
              : 'Add your first product and it will appear here with your name attached.'
          }
          action={
            hasFilters ? (
              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                }}
              >
                Clear filters
              </button>
            ) : (
              <button type="button" className="button primary" onClick={() => setModal({ open: true, product: null })}>
                <PackagePlus size={17} /> Add first product
              </button>
            )
          }
        />
      ) : view === 'grid' ? (
        <div className="product-grid">
          {filtered.map((product, index) => {
            const state = stockState(product);
            const addedName = product.addedBy?.name || product.addedByName || 'Unknown';
            const fill = Math.min(100, Math.round((Number(product.quantity) / Math.max(1, Number(product.minStock) * 3)) * 100));
            return (
              <article
                className="product-card"
                key={product._id}
                style={{ animationDelay: `${Math.min(index * 45, 300)}ms` }}
              >
                <div className="product-card-top">
                  <span className={`product-glyph tone-${state}`}>
                    {product.name.slice(0, 1).toUpperCase()}
                  </span>
                  <StockBadge state={state} />
                </div>
                <h3>{product.name}</h3>
                <span className="product-price">{formatCurrency(product.price)}</span>

                <div className="product-stock">
                  <div>
                    <span>Available</span>
                    <strong>{formatNumber(product.quantity)} units</strong>
                  </div>
                  <small>min {product.minStock}</small>
                </div>
                <div className={`stock-meter tone-${state}`}>
                  <i style={{ width: `${Math.max(4, fill)}%` }} />
                </div>

                <div className="product-owner">
                  <Avatar name={addedName} size="xs" />
                  <span>
                    Added by <strong>{addedName}</strong>
                  </span>
                  <small>{timeAgo(product.createdAt)}</small>
                </div>

                <div className="product-footer">
                  <span className="product-editor">
                    {product.updatedByName ? `Edited by ${product.updatedByName}` : 'Not edited yet'}
                  </span>
                  <div className="row-actions">
                    {permissions.editProducts ? (
                      <button
                        type="button"
                        className="icon-button soft"
                        title="Edit product"
                        onClick={() => setModal({ open: true, product })}
                      >
                        <Pencil size={16} />
                      </button>
                    ) : null}
                    {permissions.deleteProducts ? (
                      <button
                        type="button"
                        className="icon-button soft danger"
                        title="Delete product"
                        onClick={() => removeProduct(product)}
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Added by</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const state = stockState(product);
                const addedName = product.addedBy?.name || product.addedByName || 'Unknown';
                return (
                  <tr key={product._id}>
                    <td>
                      <div className="table-product">
                        <span className={`product-glyph small tone-${state}`}>
                          {product.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <strong>{product.name}</strong>
                          <small>min stock {product.minStock}</small>
                        </div>
                      </div>
                    </td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{formatNumber(product.quantity)}</td>
                    <td>
                      <StockBadge state={state} />
                    </td>
                    <td>
                      <div className="table-owner">
                        <Avatar name={addedName} size="xs" />
                        <span>{addedName}</span>
                      </div>
                    </td>
                    <td>{timeAgo(product.updatedAt || product.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        {permissions.editProducts ? (
                          <button
                            type="button"
                            className="icon-button soft"
                            title="Edit product"
                            onClick={() => setModal({ open: true, product })}
                          >
                            <Pencil size={16} />
                          </button>
                        ) : null}
                        {permissions.deleteProducts ? (
                          <button
                            type="button"
                            className="icon-button soft danger"
                            title="Delete product"
                            onClick={() => removeProduct(product)}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProductModal
        open={modal.open}
        product={modal.product}
        onClose={() => setModal({ open: false, product: null })}
        onSaved={handleSaved}
      />
    </div>
  );
}
