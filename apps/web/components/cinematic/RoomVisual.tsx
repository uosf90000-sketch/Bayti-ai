type RoomVisualProps = {
  /** empty/full: حالة ثابتة فورية. scroll: كل الطبقات تبدأ مخفية لتُحرَّك لاحقًا عبر GSAP (استخدم مرة واحدة فقط في الصفحة) */
  variant: "empty" | "full" | "scroll";
  className?: string;
};

/** غرفة مُشتقة هندسيًا بـ SVG بدل صور فوتوغرافية — تُستخدم في كل مشاهد الصفحة كي لا نعرض أي صورة أو تصيير غير حقيقي */
export function RoomVisual({ variant, className }: RoomVisualProps) {
  const show = variant === "full";
  const op = (base: number) => (variant === "scroll" ? undefined : show ? 1 : base);

  return (
    <svg
      viewBox="0 0 800 500"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g className="rv-walls" style={{ opacity: op(1) }}>
        <rect x="0" y="0" width="800" height="380" fill="var(--cin-bg-soft)" />
        <line x1="0" y1="0" x2="800" y2="0" stroke="var(--cin-line)" strokeWidth="2" />
      </g>
      <g className="rv-floor" style={{ opacity: op(1) }}>
        <rect x="0" y="380" width="800" height="120" fill="var(--cin-bg)" />
      </g>
      <g className="rv-window" style={{ opacity: op(0.9) }}>
        <rect x="580" y="60" width="160" height="220" rx="6" fill="color-mix(in srgb, var(--cin-beige) 16%, var(--cin-bg-soft))" stroke="var(--cin-line)" strokeWidth="2" />
        <line x1="660" y1="60" x2="660" y2="280" stroke="var(--cin-line)" strokeWidth="1.5" />
      </g>
      <g className="rv-curtains" style={{ opacity: op(0.9) }}>
        <rect x="555" y="50" width="26" height="240" rx="10" fill="var(--cin-bg-soft)" opacity="0.85" />
        <rect x="742" y="50" width="26" height="240" rx="10" fill="var(--cin-bg-soft)" opacity="0.85" />
      </g>
      <g className="rv-light" style={{ opacity: op(0) }}>
        <circle cx="660" cy="170" r="120" fill="var(--cin-beige)" opacity="0.16" />
        <circle cx="230" cy="36" r="10" fill="var(--cin-beige)" />
        <line x1="230" y1="0" x2="230" y2="26" stroke="var(--cin-line)" strokeWidth="2" />
      </g>
      <g className="rv-sofa" style={{ opacity: op(0) }} transform="translate(60 270)">
        <rect x="0" y="20" width="280" height="90" rx="18" fill="var(--cin-brown)" />
        <rect x="0" y="0" width="280" height="30" rx="14" fill="var(--cin-brown)" />
        <rect x="-20" y="0" width="30" height="110" rx="10" fill="var(--cin-brown)" />
        <rect x="270" y="0" width="30" height="110" rx="10" fill="var(--cin-brown)" />
      </g>
      <g className="rv-table" style={{ opacity: op(0) }}>
        <ellipse cx="440" cy="400" rx="90" ry="16" fill="var(--cin-bg)" stroke="var(--cin-line)" strokeWidth="1.5" />
        <rect x="420" y="380" width="40" height="14" rx="4" fill="var(--cin-beige)" opacity="0.75" />
      </g>
      <g className="rv-accessories" style={{ opacity: op(0) }}>
        <rect x="500" y="330" width="18" height="50" rx="4" fill="var(--cin-bg)" />
        <circle cx="509" cy="320" r="26" fill="var(--cin-beige)" opacity="0.6" />
        <rect x="150" y="230" width="60" height="40" rx="4" fill="var(--cin-bg)" opacity="0.85" />
      </g>
    </svg>
  );
}
