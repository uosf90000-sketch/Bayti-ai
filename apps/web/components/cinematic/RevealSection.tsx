"use client";
import type { CSSProperties, ReactNode } from "react";
import { useReveal } from "@/lib/motion/useReveal";

/** غلاف قسم يظهر بتلاشٍ صاعد عند دخوله الشاشة — يُبنى فوق .reveal-stagger في globals.css */
export function RevealSection({
  id, className, style, children,
}: { id?: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section id={id} ref={ref} className={`reveal reveal-stagger ${className ?? ""}`} style={style}>
      {children}
    </section>
  );
}
