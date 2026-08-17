import React, { useMemo, useState } from 'react';
import Page from '../components/Page';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Upload() {
  const { updateCoins, showToast } = useAuth();
  const [billType, setBillType] = useState('Electricity');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(() => !!file && !!billType && !busy, [file, billType, busy]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('billType', billType);
      fd.append('bill', file);

      const { data } = await api.post('/bills/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(data);
      updateCoins({ greenCoins: data.totalCoins, badge: data.badge });

      const parts = [];
      if (data.penaltyMessage) parts.push(data.penaltyMessage);
      if (data.bonusMessage) parts.push(data.bonusMessage);
      if (!parts.length) {
        parts.push(
          data.coinsEarned >= 0
            ? `+${data.coinsEarned} 🪙 this upload`
            : `${data.coinsEarned} 🪙 this upload (net change)`
        );
      }
      parts.push(`Total balance: ${data.totalCoins} 🪙`);
      showToast(parts.join(' '));
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Upload Bill" subtitle="Upload a clear image of your bill. We will extract consumption via OCR.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', maxWidth: 820 }}>
        <div className="card">
          <form onSubmit={onSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Bill type</label>
                <select className="input" value={billType} onChange={(e) => setBillType(e.target.value)}>
                  <option value="Electricity">Electricity</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="LPG">LPG</option>
                  <option value="Restaurant">Restaurant (dining / meat footprint)</option>
                  <option value="PublicTransport">Public transport (avoided driving)</option>
                </select>
                {billType === 'Restaurant' ? (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    Use bills with a <strong style={{ color: 'var(--text)' }}>Veg</strong> and{' '}
                    <strong style={{ color: 'var(--text)' }}>Non-veg</strong> section (or subtotals). More non-veg spend
                    increases estimated CO₂.
                  </p>
                ) : null}
              </div>
              <div>
                <label className="label">Bill image</label>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {error ? <div style={{ marginTop: 12, color: 'var(--warning)' }}>{error}</div> : null}

            <div style={{ marginTop: 14, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" disabled={!canSubmit} type="submit">
                {busy ? 'Scanning…' : 'Upload & Scan'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setFile(null);
                  setError(null);
                  setResult(null);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {result ? (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Scan Result</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {new Date(result.bill?.billDate || Date.now()).toLocaleDateString()}
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Consumption</div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>
                  {result.bill?.consumptionValue} {result.bill?.consumptionUnit}
                </div>
                {result.bill?.billType === 'Restaurant' &&
                result.bill?.restaurantSplitMethod &&
                result.bill.restaurantSplitMethod !== 'blended_total' ? (
                  <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    <div>
                      Veg (est.): ₹{Number(result.bill?.vegSpendInr ?? 0).toFixed(0)} @ low factor
                    </div>
                    <div>
                      Non-veg (est.): ₹{Number(result.bill?.nonVegSpendInr ?? 0).toFixed(0)} @ higher factor
                    </div>
                  </div>
                ) : null}
                {result.bill?.billType === 'Restaurant' && result.bill?.restaurantSplitMethod === 'blended_total' ? (
                  <div style={{ marginTop: 10, color: 'var(--warning)', fontSize: '0.85rem' }}>
                    Could not read separate Veg / Non-Veg blocks — using a single blended rate on bill total. Use clear
                    section headers or subtotals for a veg/non-veg split.
                  </div>
                ) : null}
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>CO₂ emitted</div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{result.bill?.co2Emitted} kg</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Emission level</div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{result.bill?.emissionLevel}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Green Coins (this upload)</div>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    color: result.coinsEarned < 0 ? 'var(--warning)' : 'var(--accent)',
                  }}
                >
                  {result.coinsEarned >= 0 ? '+' : ''}
                  {result.coinsEarned} 🪙 net change
                </div>
                {result.penaltyMessage ? (
                  <div style={{ marginTop: 6, color: 'var(--warning)', fontWeight: 700 }}>
                    {result.penaltyMessage}
                  </div>
                ) : null}
                {result.bonusMessage ? (
                  <div style={{ marginTop: 6, color: 'var(--accent-2)', fontWeight: 700 }}>
                    {result.bonusMessage}
                  </div>
                ) : null}
                <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>
                  Total: <span style={{ color: 'var(--text)', fontWeight: 800 }}>{result.totalCoins} 🪙</span> • Badge:{' '}
                  <span style={{ color: 'var(--text)', fontWeight: 800 }}>{result.badge}</span>
                </div>
              </div>
            </div>

            {result.bill?.tip ? (
              <div style={{ marginTop: 12, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                <span style={{ color: 'var(--text)', fontWeight: 800 }}>Tip:</span> {result.bill.tip}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Page>
  );
}

