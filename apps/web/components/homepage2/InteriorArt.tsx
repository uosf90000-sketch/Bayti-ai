"use client";

/**
 * فن بنيوي (SVG) لمشهد داخلي فاخر — قوس نافذة، خطوط ضوء، أثاث مبسّط بالصمت اللوني.
 * ليست صورة فوتوغرافية مولَّدة (P8: لا تصيير يوحي بواقعية غير موجودة) — رسم معماري
 * أصيل بهوية بيتي، بديل حقيقي لصورة/فيديو حين لا تتوفر أصول تصوير فعلية.
 */
export function InteriorArt({ variant = "majlis" }: { variant?: "majlis" | "room" }) {
  return (
    <svg viewBox="0 0 1600 1000" fill="none" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }} aria-hidden>
      <defs>
        <linearGradient id="hp2FloorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--surface-2)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--surface-2)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hp2WindowGlow" cx="50%" cy="30%" r="65%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* قوس نافذة معمارية مركزية */}
      <path d="M560 900 V420 A240 240 0 0 1 1040 420 V900" stroke="var(--line-strong)" strokeWidth="3" opacity="0.7" />
      <path d="M560 900 V420 A240 240 0 0 1 1040 420 V900" fill="url(#hp2WindowGlow)" opacity="0.5" />
      <path d="M660 900 V460 A140 140 0 0 1 940 460 V900" stroke="var(--line)" strokeWidth="1.5" opacity="0.5" />

      {/* أشعة ضوء */}
      <g opacity="0.35">
        <path d="M620 460 L420 900" stroke="var(--accent)" strokeWidth="2" />
        <path d="M800 420 L700 900" stroke="var(--accent)" strokeWidth="2" />
        <path d="M980 460 L1180 900" stroke="var(--accent)" strokeWidth="2" />
      </g>

      {/* أرضية */}
      <rect x="0" y="820" width="1600" height="180" fill="url(#hp2FloorGrad)" />

      {variant === "majlis" ? (
        <g opacity="0.9">
          {/* أريكة مجلس منخفضة ممتدة */}
          <path d="M180 860 h520 a20 20 0 0 1 20 20 v40 h-560 v-40 a20 20 0 0 1 20-20 Z" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <rect x="150" y="820" width="60" height="60" rx="12" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <rect x="900" y="820" width="60" height="60" rx="12" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.5" />
          {/* طاولة */}
          <ellipse cx="450" cy="950" rx="140" ry="18" fill="var(--surface-2)" stroke="var(--line)" strokeWidth="1.2" />
        </g>
      ) : (
        <g opacity="0.9">
          <rect x="220" y="800" width="360" height="90" rx="18" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <rect x="700" y="850" width="160" height="50" rx="8" fill="var(--surface-2)" stroke="var(--line)" strokeWidth="1.2" />
          <rect x="1020" y="760" width="16" height="140" fill="var(--surface-2)" />
          <ellipse cx="1028" cy="750" rx="60" ry="24" fill="var(--surface-2)" opacity="0.7" />
        </g>
      )}
    </svg>
  );
}
