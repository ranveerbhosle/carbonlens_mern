import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Page from '../components/Page';
import ProgressBar from '../components/ProgressBar';
import { api } from '../lib/api';
import { getNextTier, progressToNextTierPct } from '../lib/rewards';
import { useAuth } from '../context/AuthContext';

const COLOR_BY_TYPE = {
  Electricity: '#00e676',
  Petrol: '#69f0ae',
  Diesel: '#ff6d00',
  LPG: '#26c6da',
  Restaurant: '#ab47bc',
  PublicTransport: '#448aff',
};

const LABEL_BY_TYPE = {
  PublicTransport: 'Public transport',
  Restaurant: 'Restaurant',
  Electricity: 'Electricity',
  Petrol: 'Petrol',
  Diesel: 'Diesel',
  LPG: 'LPG',
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(17, 26, 20, 0.96)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0, 230, 118, 0.28)',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{Number(payload[0].value).toFixed(2)} kg CO₂</div>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const net = Number(row.value);
  const kind = row.kind ?? (net < 0 ? 'avoidance' : 'emission');
  const label = row.displayName || LABEL_BY_TYPE[row.name] || row.name;
  return (
    <div
      style={{
        background: 'rgba(17, 26, 20, 0.96)',
        border: '1px solid rgba(0, 230, 118, 0.28)',
        borderRadius: 12,
        padding: '10px 14px',
      }}
    >
      <div style={{ fontWeight: 700 }}>{label}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        {net.toFixed(2)} kg CO₂e
        {kind === 'avoidance' ? ' (avoided vs driving)' : ''}
      </div>
    </div>
  );
};

function StatSkeleton() {
  return (
    <div className="card" style={{ padding: '1.35rem' }}>
      <div className="dash-skel" style={{ width: '45%', height: 12, marginBottom: 14 }} />
      <div className="dash-skel" style={{ width: '65%', height: 28, marginBottom: 10 }} />
      <div className="dash-skel" style={{ width: '38%', height: 22 }} />
    </div>
  );
}

export default function Dashboard() {
  const { user, updateCoins } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [error, setError] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setDashLoading(true);
      setError(null);
      try {
        const [s, t, b] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/trend'),
          api.get('/dashboard/breakdown'),
        ]);
        if (!alive) return;
        setSummary(s.data);
        setTrend(t.data);
        setBreakdown(b.data);
        updateCoins({ greenCoins: s.data.greenCoins, badge: s.data.badge });
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (alive) setDashLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [updateCoins]);

  const coins = summary?.greenCoins ?? user?.greenCoins ?? 0;
  const next = useMemo(() => getNextTier(coins), [coins]);
  const pct = useMemo(() => progressToNextTierPct(coins), [coins]);
  const coinsToNext = next ? Math.max(0, next.min - coins) : 0;

  const trendChartData = useMemo(() => {
    if (!trend?.labels?.length) return [];
    return trend.labels.map((month, i) => ({
      month,
      kg: Number(trend.data[i]) || 0,
    }));
  }, [trend]);

  const breakdownPie = useMemo(() => {
    if (!breakdown?.length) return [];
    return breakdown.map((row) => ({
      ...row,
      pieValue: Math.abs(Number(row.value) || 0),
      displayName: LABEL_BY_TYPE[row.name] || row.name,
    }));
  }, [breakdown]);

  const emissionChip = (level) => {
    const map = {
      Low: { bg: 'rgba(0, 230, 118, 0.12)', border: 'rgba(0, 230, 118, 0.45)', text: 'var(--accent)' },
      Medium: { bg: 'rgba(105, 240, 174, 0.10)', border: 'rgba(105, 240, 174, 0.40)', text: 'var(--accent-2)' },
      High: { bg: 'rgba(255, 109, 0, 0.12)', border: 'rgba(255, 109, 0, 0.55)', text: 'var(--warning)' },
    };
    const s = map[level] || map.Low;
    return (
      <span
        style={{
          padding: '0.35rem 0.65rem',
          borderRadius: 999,
          background: s.bg,
          border: `1px solid ${s.border}`,
          color: s.text,
          fontWeight: 700,
          fontSize: '0.8rem',
        }}
      >
        {level} emissions
      </span>
    );
  };

  const streak = summary?.consecutiveLowEmissions ?? 0;

  return (
    <Page
      title="Dashboard"
      subtitle="A quick snapshot of your monthly footprint, rewards, and progress."
    >
      {error ? (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(255,109,0,0.35)', color: 'var(--warning)' }}>
          {error}
        </div>
      ) : null}

      <div className="dashboard-stats">
        {dashLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <div className="card dash-stat-card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 6 }}>CO₂ this month</div>
              <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, lineHeight: 1.1 }}>
                {summary ? summary.totalCO2ThisMonth : '—'}{' '}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>kg</span>
              </div>
              <div style={{ marginTop: 12 }}>{summary ? emissionChip(summary.emissionStatus) : null}</div>
            </div>

            <div className="card dash-stat-card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 6 }}>Total bills</div>
              <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800 }}>{summary ? summary.totalBills : '—'}</div>
              <div style={{ marginTop: 14 }}>
                <Link className="btn btn-ghost" to="/upload">
                  Upload a bill
                </Link>
              </div>
            </div>

            <div className="card dash-stat-card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 6 }}>Green Coins</div>
              <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800 }}>
                {coins} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>🪙</span>
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700 }}>{summary?.badge ?? user?.badge ?? '—'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Low streak: {streak}/3
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <ProgressBar value={pct} />
                <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {next ? `${coinsToNext} coins to unlock ${next.badge}` : 'Top badge unlocked.'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-charts">
        <div className="card chart-card">
          <div style={{ fontWeight: 800, marginBottom: 4, fontSize: '1.05rem' }}>Monthly CO₂ trend</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
            Total emissions per calendar month from your uploads
          </div>
          {dashLoading ? (
            <div className="chart-inner dash-skel-block" />
          ) : trendChartData.length ? (
            <div className="chart-inner">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="co2Area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e676" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="rgba(0,230,118,0.12)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#a5d6a7', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(0,230,118,0.15)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#a5d6a7', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />
                  <RTooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="kg"
                    stroke="#00e676"
                    strokeWidth={2.5}
                    fill="url(#co2Area)"
                    dot={{ r: 3, fill: '#00e676', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#69f0ae' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-inner chart-empty">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>No data yet</div>
              <div style={{ color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.55 }}>
                Upload bills to build a month-by-month trend. Each bill is grouped by the month it was recorded.
              </div>
              <Link className="btn btn-primary" to="/upload" style={{ marginTop: 16 }}>
                Upload your first bill
              </Link>
            </div>
          )}
        </div>

        <div className="card chart-card">
          <div style={{ fontWeight: 800, marginBottom: 4, fontSize: '1.05rem' }}>Footprint by category</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
            Energy, fuels, dining (restaurant), and public transport (avoided driving). Slice size uses magnitude; list shows signed kg CO₂e.
          </div>
          {dashLoading ? (
            <div className="chart-inner dash-skel-block" />
          ) : breakdown?.length ? (
            <>
              <div className="chart-inner chart-inner-pie">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdownPie.filter((r) => r.pieValue > 0)}
                      dataKey="pieValue"
                      nameKey="displayName"
                      innerRadius="58%"
                      outerRadius="88%"
                      paddingAngle={3}
                      stroke="rgba(10,15,13,0.9)"
                      strokeWidth={2}
                    >
                      {breakdownPie
                        .filter((r) => r.pieValue > 0)
                        .map((entry) => (
                          <Cell key={entry.name} fill={COLOR_BY_TYPE[entry.name] || '#69f0ae'} />
                        ))}
                    </Pie>
                    <RTooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                {breakdown.map((row) => {
                  const kind = row.kind ?? (Number(row.value) < 0 ? 'avoidance' : 'emission');
                  return (
                    <div
                      key={row.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        padding: '0.45rem 0',
                        borderBottom: '1px solid rgba(0, 230, 118, 0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: COLOR_BY_TYPE[row.name] || '#69f0ae',
                            boxShadow: '0 0 12px rgba(0,230,118,0.25)',
                          }}
                        />
                        <span style={{ color: 'var(--text-muted)' }}>
                          {LABEL_BY_TYPE[row.name] || row.name}
                        </span>
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: kind === 'avoidance' ? 'var(--accent-2)' : 'var(--text)',
                        }}
                      >
                        {Number(row.value).toFixed(2)} kg
                        {kind === 'avoidance' ? ' avoided' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="chart-inner chart-empty">
              <div style={{ color: 'var(--text-muted)' }}>No bills yet.</div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
