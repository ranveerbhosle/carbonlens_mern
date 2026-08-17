import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page from '../components/Page';

export default function Landing() {
  return (
    <Page
      title="See your emissions. Earn Green Coins."
      subtitle="Upload utility, fuel, LPG, restaurant, or public-transport receipts. CarbonLens extracts numbers with OCR, estimates CO₂ (including avoided driving from PT), and turns it into Green Coins."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        <motion.div className="card" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Smart OCR Uploads</div>
          <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Upload a bill image and we attempt to extract the consumption value automatically.
          </div>
        </motion.div>
        <motion.div className="card" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>CO₂ Breakdown</div>
          <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Track emissions by month and by bill type in a dashboard-style view.
          </div>
        </motion.div>
        <motion.div className="card" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Green Coins & Badges</div>
          <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Low emissions earn more coins. Unlock badges and climb the leaderboard.
          </div>
        </motion.div>
      </div>

      <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link to="/register" className="btn btn-primary">
          Create account
        </Link>
        <Link to="/login" className="btn btn-ghost">
          Sign in
        </Link>
      </div>
    </Page>
  );
}

