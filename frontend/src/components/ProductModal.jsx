import { useEffect, useState } from 'react';
import { BadgeCheck, Box, Coins, Layers3, Save } from 'lucide-react';
import Modal from './Modal.jsx';
import api, { getApiError } from '../api/client.js';
import { notifySuccess, showApiError } from '../utils/alerts.js';
import { formatCurrency, stockState } from '../utils/format.js';
import { StockBadge } from './Badge.jsx';

const emptyForm = { name: '', price: '', quantity: '', minStock: 5 };

export default function ProductModal({ open, onClose, product, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editing = Boolean(product);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (product) {
      setForm({
        name: product.name || '',
        price: product.price ?? '',
        quantity: product.quantity ?? '',
        minStock: product.minStock ?? 5
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, product]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate() {
    if (!form.name.trim()) return 'Give this product a name.';
    if (form.name.trim().length > 80) return 'Product name must be 80 characters or fewer.';
    if (form.price === '' || Number(form.price) < 0) return 'Price must be zero or more.';
    if (form.quantity === '' || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) {
      return 'Quantity must be a whole number of zero or more.';
    }
    if (form.minStock === '' || !Number.isInteger(Number(form.minStock)) || Number(form.minStock) < 0) {
      return 'Minimum stock must be a whole number of zero or more.';
    }
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
      minStock: Number(form.minStock)
    };

    setSaving(true);
    setError('');
    try {
      const response = editing
        ? await api.put(`/products/${product._id}`, payload)
        : await api.post('/products', payload);

      notifySuccess(
        editing ? 'Product updated' : 'Product added',
        editing
          ? `${payload.name} has been updated successfully.`
          : `${payload.name} was added by you and saved to inventory.`
      );
      onSaved(response.data.product);
      onClose();
    } catch (requestError) {
      const text = getApiError(requestError);
      setError(text);
      showApiError(text);
    } finally {
      setSaving(false);
    }
  }

  const preview = {
    quantity: Number(form.quantity) || 0,
    minStock: Number(form.minStock) || 0
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={editing ? 'Inventory update' : 'New inventory item'}
      title={editing ? 'Edit product' : 'Add a product'}
      subtitle={
        editing
          ? 'Update the details below. Your name is saved as the last editor.'
          : 'Your name will be saved as the person who added this product.'
      }
      footer={
        <>
          <button type="button" className="button ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="product-form" className="button primary" disabled={saving}>
            <Save size={17} />
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
          </button>
        </>
      }
    >
      <form id="product-form" className="form-stack" onSubmit={handleSubmit}>
        {error ? <div className="form-error">{error}</div> : null}

        <label className="field">
          <span>
            <Box size={15} /> Product name
          </span>
          <input
            autoFocus
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="e.g. Competition basketball"
            maxLength={80}
          />
        </label>

        <div className="form-grid two">
          <label className="field">
            <span>
              <Coins size={15} /> Unit price (RWF)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => update('price', event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="field">
            <span>
              <Layers3 size={15} /> Quantity
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={(event) => update('quantity', event.target.value)}
              placeholder="0"
            />
          </label>
        </div>

        <label className="field">
          <span>
            <BadgeCheck size={15} /> Minimum stock alert
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.minStock}
            onChange={(event) => update('minStock', event.target.value)}
            placeholder="5"
          />
          <small>You will see a low stock warning when quantity reaches this number.</small>
        </label>

        <div className="form-preview">
          <div>
            <span>Live preview</span>
            <strong>{form.name.trim() || 'Untitled product'}</strong>
          </div>
          <div className="form-preview-side">
            <StockBadge state={stockState(preview)} />
            <b>{formatCurrency(Number(form.price) || 0)}</b>
          </div>
        </div>
      </form>
    </Modal>
  );
}
