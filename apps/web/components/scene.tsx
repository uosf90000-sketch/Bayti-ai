"use client";
import { useId } from "react";

/**
 * كل الرسومات هنا SVG مرسوم يدويًا — لا صور، لا أشخاص، لا تصيير مزيّف (P8).
 * تمثّل بنية التوأم الرقمي (جدران/أثاث) لا صورًا فوتوغرافية.
 */

/* ————— المخطط المتحرك (Hero — W1: المخطط ينبض بالحياة) ————— */
export function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden>
      <svg viewBox="0 0 560 400" fill="none">
        <defs>
          <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* الجدران الخارجية */}
        <path
          className="plan-line"
          pathLength={1200}
          d="M70 70 H430 V240 H310 V360 H70 Z"
          stroke="var(--accent)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* الجدران الداخلية */}
        <path
          className="plan-line d2"
          pathLength={1200}
          d="M70 240 H310 M215 240 V360 M310 240 V160 H430"
          stroke="var(--accent-strong)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
        {/* الفناء والمدخل */}
        <path
          className="plan-line d3"
          pathLength={1200}
          d="M70 150 A38 38 0 0 1 108 188 M355 360 H430 V280"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.7}
        />

        {/* توهج المجلس */}
        <ellipse className="room-glow" cx="160" cy="300" rx="72" ry="44" fill="url(#heroGlow)" />

        {/* لمسات عائمة */}
        <g className="float" opacity={0.85}>
          <circle cx="160" cy="120" r="5" fill="var(--accent)" />
          <path d="M160 125 v14 M152 132 h16" stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" />
        </g>
        <g className="float" style={{ animationDelay: "1.4s" }} opacity={0.7}>
          <rect x="345" y="300" width="34" height="18" rx="5" stroke="var(--accent-strong)" strokeWidth={1.5} />
        </g>
      </svg>
    </div>
  );
}

/* ————— مشاهد الغرف الداخلية (بدون صور — رسم بنيوي من التوأم الرقمي) ————— */
export type RoomKind = "majlis" | "living" | "kitchen" | "master" | "kids" | "dining";
export type SceneMode = "day" | "night";

type Piece = { d?: string; x?: number; y?: number; width?: number; height?: number; rx?: number; cx?: number; cy?: number; r?: number; kind: "rect" | "circle" | "path" | "ellipse" };
type RoomLayout = { pieces: Piece[]; lights: { cx: number; cy: number }[] };

const LAYOUTS: Record<RoomKind, RoomLayout> = {
  majlis: {
    pieces: [
      { kind: "rect", x: 20, y: 20, width: 280, height: 34, rx: 10 },
      { kind: "rect", x: 20, y: 20, width: 34, height: 190, rx: 10 },
      { kind: "rect", x: 88, y: 92, width: 216, height: 118, rx: 6 },
      { kind: "circle", cx: 196, cy: 151, r: 26 },
    ],
    lights: [{ cx: 196, cy: 40 }],
  },
  living: {
    pieces: [
      { kind: "rect", x: 36, y: 118, width: 168, height: 58, rx: 16 },
      { kind: "rect", x: 36, y: 100, width: 168, height: 26, rx: 10 },
      { kind: "rect", x: 252, y: 58, width: 112, height: 16, rx: 4 },
      { kind: "rect", x: 272, y: 20, width: 72, height: 40, rx: 4 },
      { kind: "rect", x: 92, y: 196, width: 92, height: 26, rx: 8 },
    ],
    lights: [{ cx: 120, cy: 34 }, { cx: 260, cy: 34 }],
  },
  kitchen: {
    pieces: [
      { kind: "rect", x: 36, y: 26, width: 328, height: 28, rx: 4 },
      { kind: "rect", x: 36, y: 196, width: 328, height: 28, rx: 4 },
      { kind: "rect", x: 108, y: 130, width: 184, height: 56, rx: 10 },
      { kind: "circle", cx: 178, cy: 158, r: 6 },
      { kind: "circle", cx: 222, cy: 158, r: 6 },
    ],
    lights: [{ cx: 160, cy: 104 }, { cx: 220, cy: 104 }],
  },
  master: {
    pieces: [
      { kind: "rect", x: 96, y: 86, width: 208, height: 22, rx: 8 },
      { kind: "rect", x: 106, y: 106, width: 188, height: 106, rx: 14 },
      { kind: "rect", x: 58, y: 136, width: 30, height: 30, rx: 5 },
      { kind: "rect", x: 312, y: 136, width: 30, height: 30, rx: 5 },
      { kind: "rect", x: 20, y: 20, width: 58, height: 176, rx: 6 },
    ],
    lights: [{ cx: 73, cy: 116 }, { cx: 327, cy: 116 }],
  },
  kids: {
    pieces: [
      { kind: "rect", x: 40, y: 56, width: 118, height: 46, rx: 8 },
      { kind: "rect", x: 40, y: 112, width: 118, height: 46, rx: 8 },
      { kind: "path", d: "M46 56 V158 M152 56 V158" },
      { kind: "rect", x: 216, y: 168, width: 118, height: 28, rx: 6 },
      { kind: "rect", x: 216, y: 58, width: 78, height: 48, rx: 10 },
    ],
    lights: [{ cx: 300, cy: 34 }],
  },
  dining: {
    pieces: [
      { kind: "ellipse", cx: 200, cy: 140, r: 0 },
      { kind: "rect", x: 40, y: 118, width: 26, height: 26, rx: 6 },
      { kind: "rect", x: 40, y: 168, width: 26, height: 26, rx: 6 },
      { kind: "rect", x: 334, y: 118, width: 26, height: 26, rx: 6 },
      { kind: "rect", x: 334, y: 168, width: 26, height: 26, rx: 6 },
      { kind: "rect", x: 170, y: 84, width: 26, height: 26, rx: 6 },
      { kind: "rect", x: 204, y: 194, width: 26, height: 26, rx: 6 },
    ],
    lights: [{ cx: 150, cy: 50 }, { cx: 200, cy: 46 }, { cx: 250, cy: 50 }],
  },
};

export function RoomScene({ kind, mode = "day" }: { kind: RoomKind; mode?: SceneMode }) {
  const gid = useId();
  const layout = LAYOUTS[kind];
  const isNight = mode === "night";
  const stroke = isNight ? "var(--text-3)" : "var(--text-2)";
  const fill = isNight ? "var(--surface-2)" : "var(--surface-2)";

  return (
    <svg viewBox="0 0 400 260" fill="none">
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={isNight ? 0.85 : 0.35} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="400" height="260" fill={isNight ? "var(--bg-2)" : "var(--scene-light)"} />

      {layout.pieces.map((p, i) => {
        if (p.kind === "rect") return <rect key={i} x={p.x} y={p.y} width={p.width} height={p.height} rx={p.rx} fill={fill} stroke={stroke} strokeWidth={1.4} />;
        if (p.kind === "circle") return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={fill} stroke={stroke} strokeWidth={1.4} />;
        if (p.kind === "ellipse") return <ellipse key={i} cx={200} cy={140} rx={108} ry={46} fill={fill} stroke={stroke} strokeWidth={1.4} />;
        return <path key={i} d={p.d} stroke={stroke} strokeWidth={1.4} strokeLinecap="round" />;
      })}

      {layout.lights.map((l, i) => (
        <g key={i}>
          <circle className={isNight ? "room-glow" : undefined} cx={l.cx} cy={l.cy} r={isNight ? 30 : 5} fill={isNight ? `url(#${gid})` : "var(--accent)"} opacity={isNight ? 1 : 0.9} />
          {!isNight && <circle cx={l.cx} cy={l.cy} r={2} fill="var(--on-accent)" />}
        </g>
      ))}
    </svg>
  );
}
