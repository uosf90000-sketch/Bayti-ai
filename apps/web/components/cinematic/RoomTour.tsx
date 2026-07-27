"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { RoomStage } from "@/components/cinematic/RoomStage";
import { BudgetReveal } from "@/components/cinematic/BudgetReveal";
import { EditAssistant } from "@/components/cinematic/EditAssistant";
import type { RoomObject, RoomDesign, RoomCost, ShoppingMatch, ProjectCost } from "@/lib/design/types";
import type { FloorGeometry } from "@/lib/geometry/types";

type TourRoom = { room: RoomObject; design: RoomDesign; cost: RoomCost | null; shopping: ShoppingMatch[] };

/**
 * جولة استكشاف الغرف ملء الشاشة — غرفة واحدة نشطة في كل مرة (محرك 3D واحد
 * مُحمَّل فعليًا)، تنقّل صريح بالأزرار الجانبية/لوحة النقاط/الأسهم — لا
 * يتعارض مع سحب الكاميرا داخل المشهد نفسه (اللمس/العجلة داخل الغرفة للتقريب والدوران فقط).
 */
export function RoomTour({
  rooms, geometry, backHref, exportActions, projectId, projectCost,
}: {
  rooms: TourRoom[]; geometry?: FloorGeometry; backHref: string; exportActions?: React.ReactNode;
  projectId: string; projectCost: ProjectCost | null;
}) {
  const [index, setIndex] = useState(0);
  const [proMode, setProMode] = useState(false);
  const [showBudget, setShowBudget] = useState(false);

  const go = (delta: number) => setIndex((i) => (i + delta + rooms.length) % rooms.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1);
      else if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.length]);

  if (rooms.length === 0) return null;
  const current = rooms[index]!;

  return (
    <div style={{ position: "relative" }}>
      <div className="tour-nav">
        <Link href={backHref} className="btn btn-ghost" style={{ minHeight: 40, padding: "0 16px", fontSize: 13.5, background: "color-mix(in srgb, var(--bg) 55%, transparent)" }}>
          رجوع
        </Link>
        <div className="tour-rail" role="tablist" aria-label="الغرف">
          {rooms.map((r, i) => (
            <button
              key={r.room.id} type="button" role="tab" aria-selected={i === index} aria-label={r.room.name_ar}
              className="dot" data-active={i === index} onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {projectCost && (
            <button type="button" className="btn btn-ghost" style={{ minHeight: 40, padding: "0 14px", fontSize: 13, background: "color-mix(in srgb, var(--bg) 55%, transparent)" }} onClick={() => setShowBudget((v) => !v)}>
              💰 الميزانية
            </button>
          )}
          {exportActions}
          <div className="mode-toggle" role="tablist" aria-label="مستوى التفاصيل">
            <button type="button" data-active={!proMode} onClick={() => setProMode(false)}>بسيط</button>
            <button type="button" data-active={proMode} onClick={() => setProMode(true)}>احترافي</button>
          </div>
        </div>
      </div>

      {showBudget && projectCost && <BudgetReveal cost={projectCost} onClose={() => setShowBudget(false)} />}
      <EditAssistant projectId={projectId} realTotal={projectCost?.total} />

      {/* الأزرار تشير للخارج نحو حافتها (اصطلاح معارض الصور المعتاد، مستقل عن اتجاه القراءة) */}
      <button type="button" className="tour-side-nav" data-side="prev" aria-label="الغرفة السابقة" onClick={() => go(1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>
      </button>
      <button type="button" className="tour-side-nav" data-side="next" aria-label="الغرفة التالية" onClick={() => go(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 6l-6 6 6 6" /></svg>
      </button>

      <RoomStage key={current.room.id} room={current.room} design={current.design} geometry={geometry} cost={current.cost} proMode={proMode} shopping={current.shopping} />
    </div>
  );
}
