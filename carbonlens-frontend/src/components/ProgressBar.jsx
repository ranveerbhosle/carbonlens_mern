import React from 'react';

export default function ProgressBar({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        height: 10,
        borderRadius: 999,
        background: 'rgba(0, 230, 118, 0.10)',
        border: '1px solid rgba(0, 230, 118, 0.14)',
        overflow: 'hidden',
      }}
      aria-label="Progress"
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #00e676, #69f0ae)',
          boxShadow: '0 0 16px rgba(0, 230, 118, 0.35)',
        }}
      />
    </div>
  );
}

