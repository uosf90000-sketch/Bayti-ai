/**
 * Bayti Glass — Design Tokens (PRD §12.1 / WOW_MOMENTS §3–4).
 * "سعودية معاصرة راقية" — كحلي ليلي، رملي، ذهب صحراوي مطفأ.
 * لا أرقام حركة حرة في الكود: durations/easings من هنا فقط.
 */

export const colors = {
  // الأساس الداكن الدافئ
  night: {
    950: "#0A0F1E", // الخلفية العميقة
    900: "#0F1729",
    800: "#16203A",
    700: "#1F2C4D",
  },
  sand: {
    50: "#FAF7F0",
    100: "#F2ECDF",
    300: "#DACDB0",
    500: "#B8A582",
  },
  // ذهب صحراوي مطفأ — لمسات لا مساحات
  gold: {
    300: "#D9C08A",
    500: "#C2A45E",
    700: "#9A7F41",
  },
  // دلالات
  success: "#3DBF8A",
  warning: "#E0A83C",
  danger: "#E05C5C",
  savings: "#35C08E", // عدّاد التوفير (W6)
} as const;

/** الزجاجية المنضبطة (§12.1) */
export const glass = {
  surface: "rgba(22, 32, 58, 0.62)",
  surfaceLight: "rgba(250, 247, 240, 0.08)",
  border: "rgba(217, 192, 138, 0.18)", // حافة مضيئة خافتة
  blur: "18px",
  blurHeavy: "28px",
} as const;

/** الحركة — مبادئ WOW الست: سريعة دائمًا، فيزيائية، 60fps */
export const motion = {
  duration: {
    micro: 180, //ms — تفاعلات دقيقة (WOW: 150–250)
    standard: 240,
    scene: 500, // انتقالات مشهدية (WOW: 400–600)
    cinematic: 900, // W2 فقط (2D→3D) — استخدام مقنن
  },
  easing: {
    standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.3, 0.64, 1)", // spring خفيف
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;

export const typography = {
  // الطباعة العربية بطلة (§12.1) — العائلات تُحمَّل في الويب
  familyAr: "'IBM Plex Sans Arabic', 'Noto Kufi Arabic', system-ui, sans-serif",
  familyNumeric: "'IBM Plex Sans', system-ui, sans-serif", // أرقام الأسعار والمساحات
  scale: { xs: 12, sm: 14, base: 16, lg: 20, xl: 26, display: 34, hero: 44 },
  weightHeadline: 700,
} as const;

export const layout = {
  radius: { card: 20, control: 12, pill: 999 },
  touchTargetMin: 44, // §3.2 — أهداف لمس
  spacing: [0, 4, 8, 12, 16, 24, 32, 48, 64] as const,
  z: { base: 0, card: 10, floating: 40, modal: 60, toast: 80 },
} as const;

export const tokens = { colors, glass, motion, typography, layout } as const;
export type BaytiTokens = typeof tokens;
