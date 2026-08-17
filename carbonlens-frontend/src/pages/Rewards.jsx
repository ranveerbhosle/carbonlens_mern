import React, { useEffect, useMemo, useState } from 'react';
import Page from '../components/Page';
import ProgressBar from '../components/ProgressBar';
import { api } from '../lib/api';
import { BADGE_TIERS, getTierForCoins, getNextTier, progressToNextTierPct } from '../lib/rewards';
import { useAuth } from '../context/AuthContext';

export default function Rewards() {
  const { user, updateCoins } = useAuth();
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, h] = await Promise.all([api.get('/dashboard/summary'), api.get('/bills/history')]);
        if (!alive) return;
        setSummary(s.data);
        setBills(h.data);
        updateCoins({ greenCoins: s.data.greenCoins, badge: s.data.badge });
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || 'Failed to load rewards');
      }
    })();
    return () => {
      alive = false;
    };
  }, [updateCoins]);

  const coins = summary?.greenCoins ?? user?.greenCoins ?? 0;
  const tier = useMemo(() => getTierForCoins(coins), [coins]);
  const next = useMemo(() => getNextTier(coins), [coins]);
  const pct = useMemo(() => progressToNextTierPct(coins), [coins]);
  const coinsToNext = next ? Math.max(0, next.min - coins) : 0;

  return (
    <Page title="Rewards" subtitle="Badges, progress, and your coin history per bill.">
      {error ? <div style={{ color: 'var(--warning)' }}>{error}</div> : null}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Your current badge</div>
            <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>
              {tier.badge} <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>({coins} 🪙)</span>
            </div>
          </div>
          <div style={{ minWidth: 320, flex: 1, maxWidth: 520 }}>
            <ProgressBar value={pct} />
            <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {next ? `${coinsToNext} coins to unlock ${next.badge}` : 'Top badge unlocked.'}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {BADGE_TIERS.map((t) => {
          const unlocked = coins >= t.min;
          const isCurrent = t.badge === (summary?.badge ?? user?.badge);
          return (
            <div
              key={t.badge}
              className="card"
              style={{
                opacity: unlocked ? 1 : 0.45,
                borderColor: isCurrent ? 'rgba(0,230,118,0.55)' : 'rgba(0,230,118,0.18)',
                boxShadow: isCurrent ? '0 10px 40px rgba(0, 230, 118, 0.14)' : undefined,
              }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: 8 }}>{t.badge}</div>
              <div style={{ fontWeight: 900 }}>{t.label}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>
                {t.max === Infinity ? `${t.min}+ coins` : `${t.min}–${t.max} coins`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div style={{ fontWeight: 900, marginBottom: 12 }}>Coin history</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Emission level</th>
                <th>Coins earned</th>
              </tr>
            </thead>
            <tbody>
              {bills.length ? (
                bills.map((b) => (
                  <tr key={b._id}>
                    <td>{new Date(b.billDate || b.createdAt).toLocaleDateString()}</td>
                    <td>{b.billType}</td>
                    <td>{b.emissionLevel}</td>
                    <td
                      style={{
                        color: b.coinsEarned < 0 ? 'var(--warning)' : 'var(--accent)',
                        fontWeight: 900,
                      }}
                    >
                      {b.coinsEarned >= 0 ? '+' : ''}
                      {b.coinsEarned} 🪙
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--text-muted)' }}>
                    No bills yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}

