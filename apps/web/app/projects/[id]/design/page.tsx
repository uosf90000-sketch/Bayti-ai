"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { TopBar, RequireAuth } from "@/components/ui";
import { twinStore, type AnalyzedTwin } from "@/lib/twin";
import { roomObjectsFromTwin } from "@/lib/design/room";
import { runProjectPipeline, pipelineStore } from "@/lib/design/pipeline";
import { computeProjectCost, costForRoom } from "@/lib/design/costEngine";
import type { ProjectPipeline } from "@/lib/design/types";
import { exportShoppingListCsv, exportBillOfMaterialsCsv } from "@/lib/design/exportCsv";
import { isPipelineComplete } from "@/lib/design/complete";
import { RoomScene3D, DEFAULT_LAYERS, type CameraMode, type LayerVisibility } from "@/components/scene3d";
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
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>("perspective");
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYERS);

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
  const designedRoomIds = rooms.filter((r) => pipeline?.rooms.find((pr) => pr.room.id === r.id)?.design).map((r) => r.id);
  const activeIdx = activeRoomId ? designedRoomIds.indexOf(activeRoomId) : -1;
  const goToRoom = (delta: number) => {
    if (designedRoomIds.length === 0) return;
    const next = ((activeIdx < 0 ? 0 : activeIdx) + delta + designedRoomIds.length) % designedRoomIds.length;
    setActiveRoomId(designedRoomIds[next]!);
  };

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

          <div className="stack" style={{ gap: 16 }}>
            {rooms.map((room) => {
              const result = pipeline?.rooms.find((r) => r.room.id === room.id);
              const rCost = pipeline ? costForRoom(pipeline, room.id) : null;
              return (
                <div key={room.id} className="card card-hover" style={{ padding: 18 }}>
                  <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <h3 className="h-lg">{room.name_ar}</h3>
                    {rCost && rCost.pricedCount > 0 && <span className="chip chip-gold">{sar(rCost.matchedTotal)}</span>}
                  </div>

                  {!result && <p className="dim t-sm" style={{ marginTop: 6 }}>لم يُولَّد تصميم لهذه الغرفة بعد.</p>}
                  {result?.error && <p style={{ color: "var(--danger)", marginTop: 6 }}>⚠ {result.error}</p>}
                  {result?.design && (
                    <>
                      <p className="muted t-sm" style={{ marginTop: 6 }}>{result.design.style_ar} — {result.design.summary_ar}</p>
                      <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {result.design.palette.map((p) => (
                          <span key={p.hex} title={p.name_ar} style={{ width: 22, height: 22, borderRadius: 6, background: p.hex, border: "1px solid rgba(0,0,0,.15)" }} />
                        ))}
                      </div>

                      <button
                        type="button" className="chip" style={{ marginTop: 10, cursor: "pointer", border: "none" }}
                        onClick={() => setActiveRoomId((v) => (v === room.id ? null : room.id))}
                      >
                        {activeRoomId === room.id ? "🔽 إخفاء المعاينة ثلاثية الأبعاد" : "🧊 معاينة ثلاثية الأبعاد (CAD)"}
                      </button>
                      {activeRoomId === room.id && (
                        <div style={{ marginTop: 10 }}>
                          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
                            <button type="button" className="chip" style={{ cursor: "pointer", border: "none" }} onClick={() => goToRoom(-1)} disabled={designedRoomIds.length < 2}>◀ الغرفة السابقة</button>
                            <button type="button" className="chip" style={{ cursor: "pointer", border: "none" }} onClick={() => goToRoom(1)} disabled={designedRoomIds.length < 2}>الغرفة التالية ▶</button>
                            <span style={{ width: 1, height: 18, background: "var(--line)" }} />
                            <button
                              type="button" className="chip" style={{ cursor: "pointer", border: "none" }}
                              onClick={() => setCameraMode((m) => (m === "perspective" ? "top" : "perspective"))}
                            >
                              {cameraMode === "top" ? "🧭 منظور علوي" : "📷 منظور ثلاثي الأبعاد"}
                            </button>
                            <span style={{ width: 1, height: 18, background: "var(--line)" }} />
                            {(["walls", "furniture", "lighting"] as const).map((layer) => (
                              <label key={layer} className="chip" style={{ cursor: "pointer", display: "flex", gap: 5, alignItems: "center" }}>
                                <input
                                  type="checkbox" checked={layers[layer]}
                                  onChange={(e) => setLayers((l) => ({ ...l, [layer]: e.target.checked }))}
                                />
                                {layer === "walls" ? "الجدران" : layer === "furniture" ? "الأثاث" : "الإضاءة"}
                              </label>
                            ))}
                          </div>
                          <div style={{ height: 300, borderRadius: 12, overflow: "hidden" }}>
                            <RoomScene3D room={room} design={result.design} geometry={geometry} cameraMode={cameraMode} layers={layers} />
                          </div>
                        </div>
                      )}

                      <div className="stack" style={{ marginTop: 12, gap: 0 }}>
                        {result.shopping.map((m, i) => {
                          const qty = "qty" in m.item ? m.item.qty : 1;
                          return (
                            <div key={i} className="row" style={{ justifyContent: "space-between", fontSize: 13.5, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                              <span>{m.item.name_ar} ×{qty}</span>
                              {m.matched ? (
                                <span className="dim">{m.productName} · {m.price != null ? sar(m.price) : "سعر غير مؤكد"}</span>
                              ) : (
                                <span className="dim" style={{ color: "var(--warning)" }}>لا يوجد منتج مطابق</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}
