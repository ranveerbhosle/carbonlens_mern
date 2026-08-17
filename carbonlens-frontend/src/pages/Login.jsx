import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Page from '../components/Page';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, showToast } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login({ email, password });
      showToast('Welcome back. Your dashboard is ready.');
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Login" subtitle="Sign in to track bills and earn Green Coins.">
      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <div style={{ color: 'var(--warning)', fontSize: '0.9rem' }}>{error}</div>
            ) : null}
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy ? 'Signing in…' : 'Login'}
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              New here? <Link to="/register">Create an account</Link>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
}

