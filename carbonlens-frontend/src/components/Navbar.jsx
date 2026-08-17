import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const styles = {
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    background: 'rgba(10, 15, 13, 0.55)',
    borderBottom: '1px solid rgba(0, 230, 118, 0.12)',
  },
  inner: {
    maxWidth: 1520,
    margin: '0 auto',
    padding: '0.9rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  left: { display: 'flex', alignItems: 'center', gap: '1rem' },
  brand: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #00e676, #69f0ae)',
    boxShadow: '0 10px 30px rgba(0, 230, 118, 0.18)',
  },
  brandText: { fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' },
  nav: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  link: ({ isActive }) => ({
    padding: '0.55rem 0.8rem',
    borderRadius: 12,
    border: `1px solid ${isActive ? 'rgba(0,230,118,0.45)' : 'rgba(0,230,118,0.14)'}`,
    color: isActive ? 'var(--accent)' : 'var(--text)',
    background: isActive ? 'rgba(0, 230, 118, 0.08)' : 'transparent',
    fontSize: '0.9rem',
    fontWeight: 600,
  }),
  right: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  user: { color: 'var(--text-muted)', fontSize: '0.9rem' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={styles.bar}>
      <div style={styles.inner}>
        <div style={styles.left}>
          <Link to="/" style={styles.brand} aria-label="CarbonLens Home">
            <motion.div style={styles.logo} whileHover={{ scale: 1.05 }} />
            <div style={styles.brandText}>CarbonLens</div>
          </Link>

          {user ? (
            <nav style={styles.nav}>
              <NavLink to="/dashboard" style={styles.link}>
                Dashboard
              </NavLink>
              <NavLink to="/upload" style={styles.link}>
                Upload
              </NavLink>
              <NavLink to="/history" style={styles.link}>
                History
              </NavLink>
              <NavLink to="/rewards" style={styles.link}>
                Rewards
              </NavLink>
              <NavLink to="/leaderboard" style={styles.link}>
                Leaderboard
              </NavLink>
            </nav>
          ) : null}
        </div>

        <div style={styles.right}>
          {user ? (
            <>
              <div style={styles.user}>
                {user.name?.split(' ')?.[0]} • {user.badge} • {user.greenCoins ?? 0} 🪙
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-ghost">
                Login
              </NavLink>
              <NavLink to="/register" className="btn btn-primary">
                Get Started
              </NavLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

