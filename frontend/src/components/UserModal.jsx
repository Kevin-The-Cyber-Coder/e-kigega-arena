import { useEffect, useMemo, useState } from 'react';
import { LockKeyhole, Mail, Moon, ShieldCheck, Sun, UserPlus, UserRound } from 'lucide-react';
import Modal from './Modal.jsx';
import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { notifySuccess, showApiError } from '../utils/alerts.js';
import { ROLE_LABELS } from '../utils/format.js';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'staff',
  shift: 'day'
};

export default function UserModal({ open, onClose, target, defaultRole = 'staff', onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editing = Boolean(target);

  const roleOptions = useMemo(() => {
    const roles = user?.role === 'super_admin'
      ? ['admin', 'manager', 'staff']
      : ['manager', 'staff'];
    if (target?.role && !roles.includes(target.role)) roles.unshift(target.role);
    return roles;
  }, [user, target]);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (target) {
      setForm({
        name: target.name || '',
        email: target.email || '',
        password: '',
        role: target.role || 'staff',
        shift: target.shift || 'day'
      });
    } else {
      setForm({
        ...emptyForm,
        role: roleOptions.includes(defaultRole) ? defaultRole : roleOptions[roleOptions.length - 1]
      });
    }
  }, [open, target, defaultRole, roleOptions]);

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'role' && value !== 'staff') next.shift = 'day';
      return next;
    });
  }

  function validate() {
    if (!form.name.trim()) return 'Enter a full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
    if (!editing && form.password.length < 6) return 'Password must be at least 6 characters.';
    if (editing && form.password && form.password.length < 6) {
      return 'A new password must be at least 6 characters.';
    }
    if (!roleOptions.includes(form.role)) return 'Choose a valid role.';
    if (form.role === 'staff' && !['day', 'night'].includes(form.shift)) {
      return 'Choose a day or night shift for staff.';
    }
    return '';
  }

  async function submit(event) {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      shift: form.role === 'staff' ? form.shift : null
    };
    if (form.password) payload.password = form.password;

    setSaving(true);
    setError('');
    try {
      let data;
      if (editing) {
        const response = await api.put(`/users/${target._id}`, payload);
        data = response.data;
      } else if (form.role === 'admin') {
        const response = await api.post('/users/admins', {
          name: payload.name,
          email: payload.email,
          password: payload.password
        });
        data = response.data;
      } else if (form.role === 'staff') {
        const response = await api.post('/users/staff', {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          shift: payload.shift
        });
        data = response.data;
      } else {
        const response = await api.post('/users', payload);
        data = response.data;
      }

      notifySuccess(
        editing ? 'Team member updated' : 'Team member added',
        editing
          ? `${payload.name} has been updated.`
          : `${payload.name} joined as ${ROLE_LABELS[payload.role]}.`
      );
      onSaved(data.user);
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
      eyebrow={editing ? 'Account settings' : 'Grow the team'}
      title={editing ? 'Edit team member' : 'Add a team member'}
      subtitle={
        editing
          ? 'Update profile details, role or shift assignment.'
          : 'Create a secure account and choose exactly what this person can do.'
      }
      footer={
        <>
          <button type="button" className="button ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="user-form" className="button primary" disabled={saving}>
            {editing ? <ShieldCheck size={17} /> : <UserPlus size={17} />}
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
          </button>
        </>
      }
    >
      <form id="user-form" className="form-stack" onSubmit={submit}>
        {error ? <div className="form-error">{error}</div> : null}

        <label className="field">
          <span>
            <UserRound size={15} /> Full name
          </span>
          <input
            autoFocus
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="e.g. Sam Staff"
            maxLength={60}
          />
        </label>

        <label className="field">
          <span>
            <Mail size={15} /> Email address
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="name@example.com"
          />
        </label>

        <label className="field">
          <span>
            <LockKeyhole size={15} /> {editing ? 'New password (optional)' : 'Password'}
          </span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            placeholder={editing ? 'Leave blank to keep the current password' : 'At least 6 characters'}
          />
        </label>

        <div className="form-grid two">
          <label className="field">
            <span>
              <ShieldCheck size={15} /> Role
            </span>
            <select value={form.role} onChange={(event) => update('role', event.target.value)}>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] || role}
                </option>
              ))}
            </select>
          </label>

          {form.role === 'staff' ? (
            <label className="field">
              <span>
                {form.shift === 'day' ? <Sun size={15} /> : <Moon size={15} />} Shift
              </span>
              <select value={form.shift} onChange={(event) => update('shift', event.target.value)}>
                <option value="day">Day shift</option>
                <option value="night">Night shift</option>
              </select>
            </label>
          ) : (
            <div className="field field-note">
              <span>Access level</span>
              <p>
                {form.role === 'admin'
                  ? 'Can create and manage managers and staff.'
                  : 'Can add and edit products and move stock.'}
              </p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
