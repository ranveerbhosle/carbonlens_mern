import React, { useEffect, useState } from 'react';
import Page from '../components/Page';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const medalForRank = (rank) => {
  if (rank === 1) return { bg: 'rgba(255, 215, 0, 0.12)', border: 'rgba(255, 215, 0, 0.45)' };
  if (rank === 2) return { bg: 'rgba(192, 192, 192, 0.12)', border: 'rgba(192, 192, 192, 0.45)' };
  if (rank === 3) return { bg: 'rgba(205, 127, 50, 0.12)', border: 'rgba(205, 127, 50, 0.55)' };
  return null;
};

export default function Leaderboard() {
  const { user, refreshUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      await refreshUser();
      const { data } = await api.get('/dashboard/leaderboard');
      setRows(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Page
      title="Leaderboard"
      subtitle="Top 10 users ranked by Green Coins (from the database). Your row shows your full name; others show first name only. Refresh syncs your navbar balance."
    >
      <div className="card" style={{ marginBottom: '1rem' }}>
        <button className="btn btn-ghost" onClick={load} disabled={busy}>
          {busy ? 'Refreshing…' : 'Refresh'}
        </button>
        {error ? <div style={{ marginTop: 10, color: 'var(--warning)' }}>{error}</div> : null}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Badge</th>
                <th>Green Coins</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r) => {
                  const isMe = r.isYou === true || (user?._id && String(r.userId) === String(user._id));
                  const medal = medalForRank(r.rank);
                  return (
                    <tr
                      key={r.userId || r.rank}
                      style={{
                        background: isMe ? 'rgba(0, 230, 118, 0.08)' : medal ? medal.bg : undefined,
                        outline: isMe
                          ? '1px solid rgba(0, 230, 118, 0.32)'
                          : medal
                            ? `1px solid ${medal.border}`
                            : undefined,
                      }}
                    >
                      <td style={{ fontWeight: 900 }}>{r.rank}</td>
                      <td>{r.name}</td>
                      <td>{r.badge}</td>
                      <td style={{ fontWeight: 900, color: 'var(--accent)' }}>{r.greenCoins} 🪙</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--text-muted)' }}>
                    {busy ? 'Loading…' : 'No users yet.'}
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

