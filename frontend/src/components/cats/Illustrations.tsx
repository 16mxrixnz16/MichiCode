import React from "react";

// Ilustraciones de apoyo (sin gatos): ovillo de lana y caja de cartón.

/** Ovillo de lana. */
export const YarnBall: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
    <circle cx="20" cy="20" r="17" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" />
    <g stroke="#fbcfe8" strokeWidth="2" fill="none" strokeLinecap="round">
      <path d="M6 14 Q20 22 34 12" />
      <path d="M5 22 Q20 30 35 20" />
      <path d="M10 32 Q22 14 26 4" />
      <path d="M16 36 Q30 22 32 8" />
    </g>
  </svg>
);

/** Caja de cartón vacía (el lugar favorito de cualquier gato) para los historiales vacíos. */
export const EmptyBox: React.FC<{ size?: number; label: string }> = ({ size = 130, label }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 160 120" role="img" aria-label={label}>
    <ellipse cx="80" cy="112" rx="62" ry="6" fill="#ede9fe" />
    <path d="M30 50 L130 50 L124 108 L36 108 Z" fill="#e7b98a" stroke="#c48b57" strokeWidth="2" strokeLinejoin="round" />
    <path d="M30 50 L12 32 L64 32 L80 50 Z" fill="#f0c89c" stroke="#c48b57" strokeWidth="2" strokeLinejoin="round" />
    <path d="M130 50 L148 32 L96 32 L80 50 Z" fill="#f0c89c" stroke="#c48b57" strokeWidth="2" strokeLinejoin="round" />
    <g fill="#c48b57" opacity=".55" transform="translate(80 82)">
      <ellipse cx="0" cy="6" rx="8" ry="6.5" />
      <ellipse cx="-9" cy="-4" rx="3" ry="4" />
      <ellipse cx="-3" cy="-9" rx="3" ry="4" />
      <ellipse cx="4" cy="-9" rx="3" ry="4" />
      <ellipse cx="10" cy="-4" rx="3" ry="4" />
    </g>
  </svg>
);
