"use client";
import { useState } from "react";
import { RoomScene3D, DEFAULT_LAYERS, type CameraMode, type LayerVisibility } from "@/components/scene3d";
import type { RoomObject, RoomDesign, RoomCost } from "@/lib/design/types";
import type { FloorGeometry } from "@/lib/geometry/types";
import { sar } from "@/lib/mock";

/**
 * مشهد غرفة واحدة ملء الشاشة — بديل صندوق الـ3D الصغير القابل للطي.
 * المرئي دائمًا هو RoomScene3D نفسه (محرك CAD الحقيقي بديله التخطيطي الصادق
 * المدمج فعلًا) — لا صور فوتوغرافية زائفة (P8)، فقط مكبَّرًا لملء الشاشة.
 */
export function RoomStage({
  room, design, geometry, cost, proMode,
}: {
  room: RoomObject; design: RoomDesign; geometry?: FloorGeometry; cost: RoomCost | null; proMode: boolean;
}) {
  const [cameraMode, setCameraMode] = useState<CameraMode>("perspective");
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYERS);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="tour-stage">
      <div className="tour-visual">
        <RoomScene3D room={room} design={design} geometry={geometry} cameraMode={cameraMode} layers={layers} proMode={proMode} />
      </div>

      <div className="tour-overlay">
        <div className="shell" style={{ padding: 0, maxWidth: 760 }}>
          <span className="chip chip-gold">{design.style_ar}</span>
          <h2 className="h-display" style={{ fontSize: "clamp(28px, 5vw, 42px)", marginTop: 10 }}>{room.name_ar}</h2>
          <p className="muted t-body" style={{ maxWidth: 560, marginTop: 6 }}>{design.summary_ar}</p>

          <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: "wrap" }}>
            {cost && cost.pricedCount > 0 && <span className="chip chip-gold num">{sar(cost.matchedTotal)}</span>}
            {room.area_m2 != null && <span className="chip">{room.area_m2} م²</span>}
            <button type="button" className="btn btn-ghost" style={{ minHeight: 40, padding: "0 18px", fontSize: 13.5 }} onClick={() => setShowDetails((v) => !v)}>
              {showDetails ? "إخفاء التفاصيل" : "التفاصيل والمنتجات"}
            </button>
          </div>

          {showDetails && (
            <div className="glass anim-fade-up" style={{ padding: 16, marginTop: 14, maxHeight: "38vh", overflowY: "auto" }}>
              <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {design.palette.map((p) => (
                  <span key={p.hex} title={p.name_ar} style={{ width: 22, height: 22, borderRadius: 6, background: p.hex, border: "1px solid rgba(255,255,255,.2)" }} />
                ))}
              </div>
              <div className="stack" style={{ gap: 0 }}>
                {design.furniture.map((f, i) => (
                  <div key={i} className="row" style={{ justifyContent: "space-between", fontSize: 13.5, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                    <span>{f.name_ar} ×{f.qty}</span>
                    <span className="dim">{f.spec_ar}</span>
                  </div>
                ))}
              </div>

              {proMode && (
                <div className="pro-panel">
                  <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <button type="button" className="chip" style={{ cursor: "pointer", border: "none" }} onClick={() => setCameraMode((m) => (m === "perspective" ? "top" : "perspective"))}>
                      {cameraMode === "top" ? "🧭 منظور علوي" : "📷 منظور ثلاثي الأبعاد"}
                    </button>
                    {(["walls", "furniture", "lighting"] as const).map((layer) => (
                      <label key={layer} className="chip" style={{ cursor: "pointer", display: "flex", gap: 5, alignItems: "center" }}>
                        <input type="checkbox" checked={layers[layer]} onChange={(e) => setLayers((l) => ({ ...l, [layer]: e.target.checked }))} />
                        {layer === "walls" ? "الجدران" : layer === "furniture" ? "الأثاث" : "الإضاءة"}
                      </label>
                    ))}
                  </div>
                  <div className="stack" style={{ gap: 0 }}>
                    {design.lighting.map((l, i) => (
                      <div key={i} className="row" style={{ justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                        <span>{l.name_ar} ×{l.qty}</span>
                        <span className="dim">{l.notes_ar}</span>
                      </div>
                    ))}
                    {design.materials.map((m, i) => (
                      <div key={i} className="row" style={{ justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                        <span>{m.category_ar}: {m.name_ar}</span>
                        <span className="dim">{m.description_ar}</span>
                      </div>
                    ))}
                    <div className="row" style={{ justifyContent: "space-between", fontSize: 13, padding: "6px 0" }}>
                      <span>ثقة الاكتشاف</span>
                      <span className="dim num">{Math.round(room.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
