import React, { useId } from "react";

// Gatitos kawaii en SVG (cabeza grande, ojos enormes con brillos).
// Las poses se animan desde index.css con las clases .kitty-* / .is-<acción>.

export type CoatId = "corazon" | "noche" | "nube";
export type Pose = "stand" | "sit" | "loaf";

export interface Coat {
  name: string;
  description: string;
  fur: string;
  line: string;
  /** Color de boca, bigotes y ojos cerrados */
  feature: string;
  iris: string;
  innerEar: string;
  /** Zonas blancas (hocico, pecho, patitas, punta de la cola) */
  white?: string;
  /** Manchas atigradas: color base y rayas */
  tabby?: { base: string; stripe: string };
  /** Tono de voz del maullido (1 = normal) */
  pitch: number;
}

export const COATS: Record<CoatId, Coat> = {
  corazon: {
    name: "Corazón",
    description: "gatita blanca con una mancha atigrada en forma de corazón",
    fur: "#fffdf8",
    line: "#dcc6b4",
    feature: "#b08f7a",
    iris: "#5aa9f5",
    innerEar: "#ffc2d6",
    tabby: { base: "#f2a65a", stripe: "#c7742b" },
    pitch: 1.18,
  },
  noche: {
    name: "Noche",
    description: "gato negro",
    fur: "#2d2838",
    line: "#17131f",
    feature: "#9a8fb5",
    iris: "#f8c537",
    innerEar: "#f4a3c0",
    pitch: 1,
  },
  nube: {
    name: "Nube",
    description: "gato gris con blanco",
    fur: "#a3aab6",
    line: "#7a8292",
    feature: "#5b6272",
    iris: "#7ccf5a",
    innerEar: "#ffc2d6",
    white: "#ffffff",
    pitch: 0.86,
  },
};

const PUPIL = "#150f24";
const BLUSH = "#ff9ebb";
const NOSE = "#ff8fab";

const Eye: React.FC<{ cx: number; cy: number; r: number; iris: string }> = ({
  cx,
  cy,
  r,
  iris,
}) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={PUPIL} />
    <ellipse cx={cx} cy={cy + r * 0.38} rx={r * 0.78} ry={r * 0.5} fill={iris} />
    <circle cx={cx} cy={cy - r * 0.05} r={r * 0.5} fill={PUPIL} />
    <circle cx={cx - r * 0.34} cy={cy - r * 0.36} r={r * 0.34} fill="#fff" />
    <circle cx={cx + r * 0.36} cy={cy + r * 0.3} r={r * 0.15} fill="#fff" />
  </g>
);

const HEART =
  "M0 3 C0 -1 -6 -3 -7.5 1.5 C-8.8 5.8 -3.5 9 0 12 C3.5 9 8.8 5.8 7.5 1.5 C6 -3 0 -1 0 3 Z";

/** Mancha atigrada en forma de corazón (con rayitas). */
const TabbyHeart: React.FC<{
  x: number;
  y: number;
  scale: number;
  tabby: NonNullable<Coat["tabby"]>;
  clipId: string;
}> = ({ x, y, scale, tabby, clipId }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <clipPath id={clipId}>
      <path d={HEART} />
    </clipPath>
    <path d={HEART} fill={tabby.base} />
    <g clipPath={`url(#${clipId})`} stroke={tabby.stripe} strokeWidth="1.4" strokeLinecap="round">
      <path d="M-9 0 Q-5 2 -9 5" fill="none" />
      <path d="M-3 -2 Q1 2 -3 6" fill="none" />
      <path d="M3 -2 Q7 2 3 6" fill="none" />
      <path d="M-5 8 Q0 6 5 8" fill="none" />
    </g>
  </g>
);

/** Cabeza con orejas, ojos enormes, hocico y bigotes. `shift` mueve la cara hacia donde mira. */
const Head: React.FC<{
  coat: Coat;
  hx: number;
  hy: number;
  R: number;
  shift?: number;
  forceClosed?: boolean;
}> = ({ coat, hx, hy, R, shift = 0, forceClosed = false }) => {
  const fx = hx + shift;
  const eyeR = R * 0.4;
  const eyeY = hy + R * 0.02;
  const eyeL = fx - R * 0.47;
  const eyeRgt = fx + R * 0.47;
  const noseY = hy + R * 0.42;
  const ear = (dir: 1 | -1) => {
    const bx = hx + dir * R * 0.78;
    return {
      outer: `${bx},${hy - R * 0.35} ${hx + dir * R * 0.72},${hy - R * 1.18} ${hx + dir * R * 0.18},${hy - R * 0.82}`,
      inner: `${hx + dir * R * 0.66},${hy - R * 0.5} ${hx + dir * R * 0.66},${hy - R * 0.98} ${hx + dir * R * 0.32},${hy - R * 0.74}`,
    };
  };
  const left = ear(-1);
  const right = ear(1);
  const stroke = { stroke: coat.line, strokeWidth: 1.6, strokeLinejoin: "round" as const };

  return (
    <g className="kitty-head">
      <polygon points={left.outer} fill={coat.fur} {...stroke} />
      <polygon
        points={right.outer}
        fill={coat.tabby ? coat.tabby.base : coat.fur}
        {...stroke}
      />
      <polygon points={left.inner} fill={coat.innerEar} />
      <polygon points={right.inner} fill={coat.innerEar} />
      <ellipse cx={hx} cy={hy} rx={R * 1.08} ry={R * 0.95} fill={coat.fur} {...stroke} />
      {coat.tabby && (
        // manchita atigrada junto a la oreja
        <ellipse cx={hx + R * 0.55} cy={hy - R * 0.62} rx={R * 0.26} ry={R * 0.17} fill={coat.tabby.base} />
      )}
      {coat.white && (
        <ellipse cx={fx} cy={hy + R * 0.42} rx={R * 0.5} ry={R * 0.34} fill={coat.white} />
      )}

      <g className="kitty-eyes-open" style={forceClosed ? { display: "none" } : undefined}>
        <Eye cx={eyeL} cy={eyeY} r={eyeR} iris={coat.iris} />
        <Eye cx={eyeRgt} cy={eyeY} r={eyeR} iris={coat.iris} />
      </g>
      <g
        className="kitty-eyes-closed"
        style={forceClosed ? { display: "inline" } : undefined}
        stroke={coat.feature}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      >
        <path d={`M${eyeL - eyeR * 0.8} ${eyeY} Q${eyeL} ${eyeY + eyeR * 0.8} ${eyeL + eyeR * 0.8} ${eyeY}`} />
        <path d={`M${eyeRgt - eyeR * 0.8} ${eyeY} Q${eyeRgt} ${eyeY + eyeR * 0.8} ${eyeRgt + eyeR * 0.8} ${eyeY}`} />
      </g>

      <ellipse cx={eyeL - R * 0.12} cy={hy + R * 0.5} rx={R * 0.17} ry={R * 0.09} fill={BLUSH} opacity=".6" />
      <ellipse cx={eyeRgt + R * 0.12} cy={hy + R * 0.5} rx={R * 0.17} ry={R * 0.09} fill={BLUSH} opacity=".6" />
      <path
        d={`M${fx - R * 0.07} ${noseY - R * 0.04} h${R * 0.14} l${-R * 0.07} ${R * 0.08} z`}
        fill={NOSE}
        stroke={NOSE}
        strokeLinejoin="round"
      />
      <path
        className="kitty-mouth"
        d={`M${fx} ${noseY + R * 0.05} q${-R * 0.1} ${R * 0.15} ${-R * 0.2} ${R * 0.04} M${fx} ${noseY + R * 0.05} q${R * 0.1} ${R * 0.15} ${R * 0.2} ${R * 0.04}`}
        stroke={coat.feature}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse className="kitty-mouth-open" cx={fx} cy={noseY + R * 0.2} rx={R * 0.12} ry={R * 0.14} fill="#7a2842" />
      <ellipse className="kitty-tongue" cx={fx} cy={noseY + R * 0.24} rx={R * 0.08} ry={R * 0.1} fill={NOSE} />
      <g stroke={coat.feature} strokeWidth="1" strokeLinecap="round" opacity=".6">
        <line x1={fx - R * 0.62} y1={hy + R * 0.32} x2={fx - R * 1.12} y2={hy + R * 0.22} />
        <line x1={fx - R * 0.62} y1={hy + R * 0.42} x2={fx - R * 1.1} y2={hy + R * 0.48} />
        <line x1={fx + R * 0.62} y1={hy + R * 0.32} x2={fx + R * 1.12} y2={hy + R * 0.22} />
        <line x1={fx + R * 0.62} y1={hy + R * 0.42} x2={fx + R * 1.1} y2={hy + R * 0.48} />
      </g>
    </g>
  );
};

const Tail: React.FC<{ coat: Coat; d: string; className: string }> = ({ coat, d, className }) => (
  <g className={className}>
    <path d={d} stroke={coat.line} strokeWidth="9.5" strokeLinecap="round" fill="none" />
    <path d={d} stroke={coat.fur} strokeWidth="6.5" strokeLinecap="round" fill="none" />
    {(coat.white || coat.tabby) && (
      // punta de la cola blanca (Nube) o atigrada (Corazón)
      <path
        d={d}
        stroke={coat.white || coat.tabby!.base}
        strokeWidth="6.5"
        strokeLinecap="round"
        fill="none"
        pathLength={100}
        strokeDasharray="0 78 22"
      />
    )}
  </g>
);

const Leg: React.FC<{ coat: Coat; x: number; className: string }> = ({ coat, x, className }) => (
  <g className={`kitty-leg ${className}`}>
    <rect x={x} y={66} width={9} height={24} rx={4.5} fill={coat.fur} stroke={coat.line} strokeWidth="1.4" />
    {coat.white && <ellipse cx={x + 4.5} cy={87} rx={4.3} ry={3.2} fill={coat.white} />}
  </g>
);

interface KittyProps {
  coat: CoatId;
  pose?: Pose;
  /** Clase de acción (is-walk, is-lick…) que activa animaciones en index.css */
  action?: string;
  width?: number;
}

/** Un gatito completo en la pose indicada, mirando a la derecha. */
const Kitty: React.FC<KittyProps> = ({ coat: coatId, pose = "sit", action = "", width = 100 }) => {
  const coat = COATS[coatId];
  const clipId = `heart-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const stroke = { stroke: coat.line, strokeWidth: 1.6 };

  return (
    <svg
      className={`kitty pose-${pose} ${action}`}
      width={width}
      height={(width * 100) / 120}
      viewBox="0 0 120 100"
      aria-hidden
      overflow="visible"
    >
      <ellipse cx="60" cy="94" rx={pose === "loaf" ? 40 : 30} ry="4" fill="#7c3aed" opacity=".1" />

      {pose === "stand" && (
        <g className="kitty-bob">
          <Tail coat={coat} className="kitty-tail" d="M34 62 C 22 60, 13 48, 18 32" />
          <Leg coat={coat} x={38} className="kitty-leg-b" />
          <Leg coat={coat} x={66} className="kitty-leg-a" />
          <ellipse cx="58" cy="64" rx="28" ry="17" fill={coat.fur} {...stroke} />
          {coat.white && <ellipse cx="64" cy="72" rx="16" ry="7" fill={coat.white} />}
          {coat.tabby && (
            <>
              <TabbyHeart x={50} y={56} scale={1.2} tabby={coat.tabby} clipId={clipId} />
              <ellipse cx="72" cy="56" rx="3.5" ry="2.5" fill={coat.tabby.base} />
              <ellipse cx="38" cy="70" rx="3" ry="2.2" fill={coat.tabby.base} />
            </>
          )}
          <Leg coat={coat} x={46} className="kitty-leg-a" />
          <g className="kitty-front">
            <Leg coat={coat} x={74} className="kitty-leg-b" />
          </g>
          <Head coat={coat} hx={88} hy={42} R={22} shift={4} />
        </g>
      )}

      {pose === "sit" && (
        <g>
          <Tail coat={coat} className="kitty-tail-sit" d="M74 88 C 96 92, 102 74, 94 60" />
          <ellipse cx="42" cy="83" rx="11" ry="9" fill={coat.fur} {...stroke} />
          <ellipse cx="74" cy="83" rx="11" ry="9" fill={coat.fur} {...stroke} />
          <ellipse cx="58" cy="70" rx="22" ry="22" fill={coat.fur} {...stroke} />
          {coat.white && <ellipse cx="58" cy="74" rx="12" ry="15" fill={coat.white} />}
          {coat.tabby && (
            <>
              <TabbyHeart x={65} y={66} scale={1.05} tabby={coat.tabby} clipId={clipId} />
              <ellipse cx="44" cy="80" rx="3" ry="2.2" fill={coat.tabby.base} />
            </>
          )}
          <g>
            <ellipse cx="51" cy="91" rx="6.5" ry="4.5" fill={coat.white || coat.fur} {...stroke} />
          </g>
          <g className="kitty-paw-r">
            <ellipse cx="65" cy="91" rx="6.5" ry="4.5" fill={coat.white || coat.fur} {...stroke} />
          </g>
          <Head coat={coat} hx={58} hy={38} R={24} />
          {/* Solo visibles al lamerse la cola / acicalarse (ver index.css) */}
          <Tail coat={coat} className="kitty-tail-front" d="M78 88 C 96 84, 92 66, 77 63" />
          <g className="kitty-paw-raised">
            <rect x="58" y="54" width="11" height="24" rx="5.5" fill={coat.white || coat.fur} {...stroke} />
            <ellipse cx="63.5" cy="56" rx="6.5" ry="5" fill={coat.white || coat.fur} {...stroke} />
            <ellipse cx="63.5" cy="56.5" rx="2.4" ry="1.8" fill={coat.innerEar} />
          </g>
        </g>
      )}

      {pose === "loaf" && (
        <g className="kitty-breathe">
          <ellipse cx="56" cy="78" rx="36" ry="16" fill={coat.fur} {...stroke} />
          {coat.tabby && (
            <>
              <TabbyHeart x={46} y={68} scale={1.2} tabby={coat.tabby} clipId={clipId} />
              <ellipse cx="30" cy="76" rx="3" ry="2.2" fill={coat.tabby.base} />
            </>
          )}
          <Tail coat={coat} className="kitty-tail-loaf" d="M22 84 C 20 98, 66 98, 82 92" />
          {coat.white && <ellipse cx="92" cy="90" rx="7" ry="4" fill={coat.white} />}
          <Head coat={coat} hx={86} hy={66} R={20} forceClosed />
          <g className="kitty-zzz" fill="#a78bfa" fontWeight="900" fontFamily="Nunito, sans-serif">
            <text x="100" y="40" fontSize="12">z</text>
            <text x="108" y="30" fontSize="9">z</text>
            <text x="114" y="22" fontSize="7">z</text>
          </g>
        </g>
      )}
    </svg>
  );
};

export default Kitty;
