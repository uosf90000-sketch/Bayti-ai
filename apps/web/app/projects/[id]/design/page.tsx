"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { TopBar, RequireAuth } from "@/components/ui";
import { RoomTour } from "@/components/cinematic/RoomTour";
import { twinStore, type AnalyzedTwin } from "@/lib/twin";
import { roomObjectsFromTwin } from "@/lib/design/room";
import { runProjectPipeline, pipelineStore } from "@/lib/design/pipeline";
import { computeProjectCost, costForRoom } from "@/lib/design/costEngine";
import type { ProjectPipeline } from "@/lib/design/types";
import { exportShoppingListCsv, exportBillOfMaterialsCsv } from "@/lib/design/exportCsv";
import { isPipelineComplete } from "@/lib/design/complete";
import { geometryStore } from "@/lib/geometry/store";
import type { FloorGeometry } from "@/lib/geometry/types";
import { sar } from "@/lib/mock";

/**
 * خط الإنتاج الحقيقي — Room Object لكل غرفة → Design Engine (Claude لكل غرفة
 * على حدة) → Shopping Engine (مطابقة كتالوج حقيقي) → Cost Engine → 3D تخطيطي
 * → Export. لا يعرض أبدًا غرفة لم تُكتشف فعليًا في التوأم الرقمي.
 */
export default function DesignPipeline({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [twin, setTwin] = useState<AnalyzedTwin | undefined>(undefined);
  const [pipeline, setPipeline] = useState<ProjectPipeline | undefined>(undefined);
  const [geometry, setGeometry] = useState<FloorGeometry | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setTwin(twinStore.get(id));
    setPipeline(pipelineStore.get(id));
    setGeometry(geometryStore.get(id));
  }, [id]);

  const rooms = twin ? roomObjectsFromTwin(twin) : [];

  async function start() {
    if (!twin) return;
    setRunning(true);
    setProgress(0);
    const roomList = roomObjectsFromTwin(twin);
    const result = await runProjectPipeline(id, roomList, () => setProgress((p) => p + 1));
    setPipeline(result);
    setRunning(false);
  }

  if (!twin) {
    return (
      <RequireAuth>
        <main>
          <TopBar backHref={`/projects/${id}/preview`} />
          <section className="shell" style={{ paddingTop: 28, paddingBottom: 48, maxWidth: 560, textAlign: "center" }}>
            <div className="glass anim-fade-up" style={{ padding: "30px 24px" }}>
              <div style={{ fontSize: 40 }}>⚠</div>
              <h1 className="h-xl" style={{ marginTop: 8 }}>لا يوجد تحليل مخطط لهذا المشروع بعد</h1>
              <Link href="/projects/new" className="btn btn-gold btn-block" style={{ marginTop: 20, minHeight: 54, fontSize: 17 }}>
                رفع مخطط جديد
              </Link>
            </div>
          </section>
        </main>
      </RequireAuth>
    );
  }

  const cost = pipeline ? computeProjectCost(pipeline) : null;
  const complete = isPipelineComplete(twin, pipeline);
  const tourRooms = rooms.flatMap((room) => {
    const result = pipeline?.rooms.find((r) => r.room.id === room.id);
    if (!result?.design) return [];
    return [{ room, design: result.design, cost: pipeline ? costForRoom(pipeline, room.id) : null }];
  });

  // الجولة ملء الشاشة تحل محل لوحة الغرف/الصندوق الثلاثي الأبعاد القابل للطي بمجرد توفر تصميم لغرفة واحدة على الأقل
  if (tourRooms.length > 0 && !running) {
    return (
      <RequireAuth>
        <main>
          <RoomTour
            rooms={tourRooms}
            geometry={geometry}
            backHref={`/projects/${id}/preview`}
            exportActions={
              <>
                {complete && (
                  <span className="chip chip-success" style={{ background: "color-mix(in srgb, var(--bg) 55%, transparent)" }}>
                    ✓ {pipeline!.rooms.length} غرفة مكتملة
                  </span>
                )}
                <button type="button" className="btn btn-ghost" style={{ minHeight: 40, padding: "0 14px", fontSize: 13, background: "color-mix(in srgb, var(--bg) 55%, transparent)" }} onClick={() => exportShoppingListCsv(pipeline!)}>
                  📋 CSV
                </button>
              </>
            }
          />
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <main>
        <TopBar backHref={`/projects/${id}/preview`} />
        <section className="section shell">
          <div className="card anim-fade-up" style={{ padding: "22px 22px", marginBottom: 18 }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <h1 className="h-xl">خط الإنتاج الحقيقي 🏗️</h1>
              {complete && <span className="chip chip-success">✅ المشروع مكتمل — {pipeline!.rooms.length} غرفة بتصميم ناجح كامل</span>}
              {!complete && pipeline && !running && <span className="chip">⏳ غير مكتمل — راجع الغرف أدناه</span>}
            </div>
            <p className="muted t-sm" style={{ marginTop: 4 }}>
              {rooms.length} غرفة مكتشفة فعليًا في مخططك — كل غرفة تُصمَّم بشكل مستقل تمامًا، ولا يُعرض أي عنصر تسوق بلا منتج حقيقي مطابق من الكتالوج.
            </p>

            {!pipeline && !running && (
              <button className="btn btn-gold btn-block" style={{ marginTop: 14, minHeight: 52 }} onClick={start}>
                🎨 ابدأ خط الإنتاج الحقيقي لكل غرفة
              </button>
            )}
            {running && (
              <div style={{ marginTop: 14 }}>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round((progress / Math.max(1, rooms.length)) * 100)}%` }} /></div>
                <p className="dim t-sm" style={{ marginTop: 6 }}>اكتملت {progress} من {rooms.length} غرفة…</p>
              </div>
            )}
            {pipeline && !running && (
              <div className="row" style={{ gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button className="btn btn-ghost" onClick={start}>🔄 إعادة التوليد</button>
                <button className="btn btn-ghost" onClick={() => exportShoppingListCsv(pipeline)}>📋 قائمة التسوق CSV</button>
                <button className="btn btn-ghost" onClick={() => exportBillOfMaterialsCsv(pipeline)}>🧾 جدول الكميات CSV</button>
                <Link href={`/projects/${id}/design/print`} className="btn btn-ghost">📄 تقرير PDF</Link>
              </div>
            )}
          </div>

          {cost && (
            <div className="card anim-fade-up" style={{ padding: "20px 22px", marginBottom: 18 }}>
              <h2 className="h-lg">التكلفة الإجمالية (العناصر المطابقة فقط)</h2>
              <p className="num gold" style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{sar(cost.total)}</p>
              <p className="dim t-sm">{cost.unpricedItemCount} عنصرًا بلا منتج مطابق — غير محتسبة في الإجمالي</p>
              {Object.keys(cost.byCategory).length > 0 && (
                <div className="row" style={{ flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {Object.entries(cost.byCategory).map(([cat, amount]) => (
                    <span key={cat} className="chip">{cat}: {sar(amount)}</span>
                  ))}
                </div>
              )}
            </div>
          )}

        </section>
      </main>
    </RequireAuth>
  );
}
