import React, { useEffect, useState } from 'react';
import Page from '../components/Page';
import { api } from '../lib/api';

export default function History() {
  const [bills, setBills] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState('');

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      const params = {};
      if (type) params.type = type;
      const { data } = await api.get('/bills/history', { params });
      setBills(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load history');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return (
    <Page title="Bill History" subtitle="Every upload, its CO₂, and the coins you earned.">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'end', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 240 }}>
            <label className="label">Filter by type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All</option>
              <option value="Electricity">Electricity</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="LPG">LPG</option>
              <option value="Restaurant">Restaurant</option>
              <option value="PublicTransport">Public transport</option>
            </select>
          </div>
          <button className="btn btn-ghost" onClick={load} disabled={busy}>
            {busy ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        {error ? <div style={{ marginTop: 10, color: 'var(--warning)' }}>{error}</div> : null}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Consumption</th>
                <th>CO₂ (kg)</th>
                <th>Level</th>
                <th>Coins</th>
              </tr>
            </thead>
            <tbody>
              {bills.length ? (
                bills.map((b) => (
                  <tr key={b._id}>
                    <td>{new Date(b.billDate || b.createdAt).toLocaleDateString()}</td>
                    <td>{b.billType}</td>
                    <td>
                      {b.consumptionValue} {b.consumptionUnit}
                    </td>
                    <td>{b.co2Emitted}</td>
                    <td>{b.emissionLevel}</td>
                    <td
                      style={{
                        color: b.coinsEarned < 0 ? 'var(--warning)' : 'var(--accent)',
                        fontWeight: 800,
                      }}
                    >
                      {b.coinsEarned >= 0 ? '+' : ''}
                      {b.coinsEarned} 🪙
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--text-muted)' }}>
                    {busy ? 'Loading…' : 'No bills yet.'}
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

