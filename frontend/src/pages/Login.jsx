import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError } from '../api/client.js';
import { notifyError, notifySuccess } from '../utils/alerts.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const remembered = localStorage.getItem('arena_email') || '';
  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(Boolean(remembered));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Sign in | E-Kigega Arena';
    return () => {
      document.title = 'E-Kigega Arena | Inventory';
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (remember) localStorage.setItem('arena_email', email.trim().toLowerCase());
      else localStorage.removeItem('arena_email');

      notifySuccess(`Welcome back, ${user.name.split(' ')[0]}`, 'Your inventory workspace is ready.');
      const destination = location.state?.from || '/';
      navigate(destination, { replace: true });
    } catch (requestError) {
      const message = getApiError(requestError, 'Could not sign you in.');
      setError(message);
      notifyError('Sign in failed', message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail('superadmin@example.com');
    setPassword('superadmin123');
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-orb orb-a" aria-hidden="true" />
      <div className="login-orb orb-b" aria-hidden="true" />

      <section className="login-visual">
        <div className="login-brand">
          <span className="brand-mark">
            <Boxes size={24} strokeWidth={2.2} />
          </span>
          <div>
            <strong>E-Kigega Arena</strong>
            <span>Inventory command center</span>
          </div>
        </div>

        <div className="login-hero">
          <span className="eyebrow">
            <Sparkles size={15} />
            Built for smooth arena operations
          </span>
          <h1>
            Every product.
            <br />
            Every shift.
            <br />
            <em>Under control.</em>
          </h1>
          <p>
            One polished workspace for products, stock movements and team roles — with day and
            night staff always in sync.
          </p>
          <ul className="login-features">
            <li>
              <CheckCircle2 size={18} />
              Product changes show exactly who added or edited them.
            </li>
            <li>
              <CheckCircle2 size={18} />
              Super admin, sub admin and shift-based staff permissions.
            </li>
            <li>
              <CheckCircle2 size={18} />
              Live low-stock alerts and a clean movement history.
            </li>
          </ul>
        </div>

        <div className="login-showcase">
          <div className="showcase-card">
            <span className="showcase-icon green">
              <Sun size={19} />
            </span>
            <div>
              <strong>Day shift</strong>
              <span>8 team members active</span>
            </div>
            <i className="showcase-pulse" />
          </div>
          <div className="showcase-card floating">
            <span className="showcase-icon violet">
              <Moon size={19} />
            </span>
            <div>
              <strong>Night shift</strong>
              <span>Stock handed over cleanly</span>
            </div>
            <i className="showcase-pulse" />
          </div>
        </div>

        <p className="login-copyright">Secure session · Role aware access · Built with care</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-mobile-brand">
            <span className="brand-mark">
              <Boxes size={21} />
            </span>
            <strong>E-Kigega Arena</strong>
          </div>

          <div className="login-heading">
            <span className="login-shield">
              <ShieldCheck size={20} />
            </span>
            <h2>Welcome back</h2>
            <p>Sign in to open your inventory workspace.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error ? <div className="form-error">{error}</div> : null}

            <label className="field">
              <span>
                <Mail size={15} /> Email address
              </span>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
              />
            </label>

            <label className="field">
              <span>
                <LockKeyhole size={15} /> Password
              </span>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="login-options">
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Remember my email</span>
              </label>
              <span className="session-note">8 hour session</span>
            </div>

            <button type="submit" className="button primary login-submit" disabled={loading}>
              {loading ? 'Signing you in…' : 'Sign in to workspace'}
              {!loading ? <ArrowRight size={18} /> : null}
            </button>
          </form>

          <div className="demo-card">
            <div>
              <span className="demo-label">Default super admin</span>
              <strong>superadmin@example.com</strong>
              <span>superadmin123</span>
            </div>
            <button type="button" className="button ghost small" onClick={fillDemo}>
              Use demo
            </button>
          </div>

          <p className="login-footnote">
            Your password is protected and your session cookie keeps this browser signed in.
          </p>
        </div>
      </section>
    </div>
  );
}
