import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Boxes, Minus, Plus } from 'lucide-react';
import Modal from './Modal.jsx';
import api, { getApiError } from '../api/client.js';
import { notifySuccess, showApiError } from '../utils/alerts.js';

export default function StockModal({ open, onClose, product, direction = 'in', onSaved }) {
  const [amount, setAmount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isIn = direction === 'in';
  const current = Number(product?.quantity) || 0;
  const next = isIn ? current + (Number(amount) || 0) : current - (Number(amount) || 0);

  useEffect(() => {
    if (!open) return;
    setAmount(1);
    setError('');
  }, [open, product, direction]);

  function changeAmount(value) {
    const parsed = Number(value);
    setAmount(Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0);
  }

  async function submit(event) {
    event.preventDefault();
    const value = Number(amount);

    if (!Number.isInteger(value) || value <= 0) {
      setError('Enter a whole number above zero.');
      return;
    }

    if (!isIn && value > current) {
      setError(`Only ${current} units are available to remove.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { data } = await api.post(`/stock/${direction}`, {
        productId: product._id,
        amount: value
      });
      notifySuccess(
        isIn ? 'Stock added' : 'Stock removed',
        data.message || `${product.name} stock updated.`
      );
      onSaved(data.product);
      onClose();
    } catch (requestError) {
      const text = getApiError(requestError);
      setError(text);
      showApiError(text);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={isIn ? 'Receive inventory' : 'Release inventory'}
      title={`${isIn ? 'Add stock' : 'Remove stock'}`}
      subtitle={`${product?.name || 'Product'} currently has ${current} units available.`}
      footer={
        <>
          <button type="button" className="button ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            form="stock-form"
            className={`button ${isIn ? 'primary' : 'danger'}`}
            disabled={saving || (!isIn && current === 0)}
          >
            {isIn ? <ArrowDownToLine size={17} /> : <ArrowUpFromLine size={17} />}
            {saving ? 'Updating…' : isIn ? 'Add to stock' : 'Remove from stock'}
          </button>
        </>
      }
    >
      <form id="stock-form" className="form-stack" onSubmit={submit}>
        {error ? <div className="form-error">{error}</div> : null}

        <div className={`stock-hero ${isIn ? 'is-in' : 'is-out'}`}>
          <span className="stock-hero-icon">
            {isIn ? <ArrowDownToLine size={24} /> : <ArrowUpFromLine size={24} />}
          </span>
          <div>
            <span>How many units?</span>
            <strong>{product?.name}</strong>
          </div>
          <Boxes size={30} className="stock-hero-watermark" />
        </div>

        <div className="stepper">
          <button type="button" onClick={() => changeAmount(amount - 1)} aria-label="Decrease amount">
            <Minus size={19} />
          </button>
          <input
            autoFocus
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(event) => changeAmount(event.target.value)}
            aria-label="Stock amount"
          />
          <button type="button" onClick={() => changeAmount(amount + 1)} aria-label="Increase amount">
            <Plus size={19} />
          </button>
        </div>

        <div className="quick-amounts">
          {[1, 5, 10, 25].map((value) => (
            <button
              key={value}
              type="button"
              className={Number(amount) === value ? 'active' : ''}
              onClick={() => setAmount(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="stock-summary">
          <div>
            <span>Current</span>
            <strong>{current}</strong>
          </div>
          <span className="stock-summary-arrow">→</span>
          <div>
            <span>New balance</span>
            <strong className={next < 0 ? 'text-danger' : isIn ? 'text-success' : 'text-warning'}>
              {next < 0 ? 0 : next}
            </strong>
          </div>
        </div>
      </form>
    </Modal>
  );
}
