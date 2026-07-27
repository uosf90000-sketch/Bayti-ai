"use client";
import { useEffect, useRef, useState } from "react";

/** شاشة تحميل فاخرة: عداد 0→100%، تجاوز اختياري بعد ثانيتين، وانفتاح بـ mask reveal ناعم */
export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [skippable, setSkippable] = useState(false);
  const [closing, setClosing] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPct(100);
    setClosing(true);
    setTimeout(onDone, 1150);
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      finish();
      return;
    }
    const start = performance.now();
    const duration = 1800;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setPct(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    const skipTimer = setTimeout(() => setSkippable(true), 2000);
    return () => { cancelAnimationFrame(raf); clearTimeout(skipTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="hp2-loader hp2-loader-reveal" data-closed={closing} aria-hidden={closing}>
      <div className="hp2-loader-mark">بيتي</div>
      <div className="hp2-loader-line">نجهّز لك تجربة مختلفة للسكن</div>
      <div className="hp2-loader-track"><div className="hp2-loader-fill" style={{ width: `${pct}%` }} /></div>
      <div className="hp2-loader-pct num">{pct}%</div>
      <button type="button" className="hp2-loader-skip" data-shown={skippable} onClick={finish}>
        تجاوز
      </button>
    </div>
  );
}
