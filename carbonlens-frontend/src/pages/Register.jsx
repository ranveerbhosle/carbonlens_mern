import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Page from '../components/Page';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, showToast } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ name, email, password });
      showToast('Account created. You can upload bills from the dashboard.');
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Register" subtitle="Create your CarbonLens account in under a minute.">
      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="label">Full name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
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
              {busy ? 'Creating…' : 'Create account'}
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
}

