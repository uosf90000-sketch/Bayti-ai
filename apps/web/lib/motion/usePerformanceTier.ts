"use client";
import { useEffect, useState } from "react";

export type PerformanceTier = "high" | "balanced" | "lite";
const KEY = "bayti.perfTier.v1";

/**
 * تصنيف تلقائي لقدرة الجهاز (نواة المعالج/الذاكرة إن توفرت + الجوال كإشارة)،
 * قابل للتجاوز يدويًا من الإعدادات (يُخزَّن ويُفضَّل دائمًا على الكشف التلقائي).
 */
function detect(): PerformanceTier {
  if (typeof navigator === "undefined") return "balanced";
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if ((mem != null && mem <= 3) || cores <= 3) return "lite";
  if (isMobile && ((mem != null && mem <= 4) || cores <= 5)) return "balanced";
  if (!isMobile && cores >= 8 && (mem == null || mem >= 6)) return "high";
  return "balanced";
}

export function usePerformanceTier(): [PerformanceTier, (t: PerformanceTier | "auto") => void] {
  const [tier, setTier] = useState<PerformanceTier>("balanced");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (saved === "high" || saved === "balanced" || saved === "lite") setTier(saved);
    else setTier(detect());
  }, []);

  const set = (t: PerformanceTier | "auto") => {
    if (t === "auto") {
      localStorage.removeItem(KEY);
      setTier(detect());
    } else {
      localStorage.setItem(KEY, t);
      setTier(t);
    }
  };

  return [tier, set];
}
