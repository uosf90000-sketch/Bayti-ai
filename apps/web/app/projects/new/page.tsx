"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar, RequireAuth } from "@/components/ui";
import { projects, floorplans } from "@/lib/services";
import { flags } from "@/lib/flags";
import { twinStore } from "@/lib/twin";
import { analyzeFloorplanClient } from "@/lib/vision/client";

const ACCEPTED = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".dwg", ".dxf"];
const MAX_MB = 50;

export default function NewProject() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const pick = (f: File | undefined) => {
    setError("");
    if (!f) return;
    const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setError(`الصيغة غير مدعومة. المقبول: PDF أو صورة (PNG/JPG) أو ملف CAD (DWG/DXF).`);
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`الملف أكبر من ${MAX_MB} ميجابايت — جرّب نسخة أخف أو صفحة المخطط فقط.`);
      return;
    }
    setFile(f);
  };

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      const p = await projects.create(title.trim() || "بيتي الجديد");
      await floorplans.upload(p.id, file!);
      await projects.update(p.id, { fileName: file!.name, status: "analyzing" });

      if (!flags.USE_MOCK_ANALYSIS) {
        setAnalyzing(true);
        const result = await analyzeFloorplanClient(file!);
        twinStore.save({
          project_id: p.id,
          source: "vlm",
          overall_confidence: result.overall_confidence,
          analyzed_at: new Date().toISOString(),
          rooms: result.rooms.map((r, i) => ({ id: `room-${i}`, ...r })),
        });
      }
      router.push(`/projects/${p.id}/analysis`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تحليل المخطط — جرّب ملفًا آخر");
      setBusy(false);
      setAnalyzing(false);
    }
  };

  return (
    <RequireAuth>
      <main>
        <TopBar backHref="/projects" />
        <section className="shell" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 640 }}>
          <div className="stagger">
            <h1 className="h-xl">مشروع جديد</h1>
            <p className="muted" style={{ marginBottom: 8 }}>سمِّ بيتك، ثم ارفع مخططه — وخلّ الباقي علينا</p>

            <input
              className="field" placeholder="اسم المشروع — مثال: فيلا حي النرجس"
              value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60}
              aria-label="اسم المشروع"
            />

            <div
              className="dropzone" data-drag={drag}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
              role="button" tabIndex={0} aria-label="رفع المخطط"
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            >
              <input
                ref={fileRef} type="file" hidden accept={ACCEPTED.join(",")}
                onChange={(e) => pick(e.target.files?.[0])}
              />
              {file ? (
                <div className="anim-fade-in">
                  <div style={{ fontSize: 38 }}>📄</div>
                  <div style={{ fontWeight: 700, marginTop: 6 }}>{file.name}</div>
                  <div className="dim" style={{ fontSize: 13 }}>{(file.size / 1024 / 1024).toFixed(1)} م.ب — اضغط للتغيير</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 38 }}>⬆️</div>
                  <div style={{ fontWeight: 700, marginTop: 6 }}>اسحب مخططك هنا أو اضغط للاختيار</div>
                  <div className="dim" style={{ fontSize: 13, marginTop: 4 }}>
                    PDF · صورة واضحة · ملف CAD — حتى {MAX_MB} م.ب
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="glass" style={{ padding: 14, borderColor: "rgba(224,92,92,0.4)" }}>
                <span style={{ color: "var(--danger)", fontSize: 14 }}>⚠ {error}</span>
              </div>
            )}

            <button className="btn btn-gold btn-block" disabled={!file || busy} onClick={start} style={{ minHeight: 54, fontSize: 17 }}>
              {analyzing ? "نحلل مخططك بالذكاء الاصطناعي… قد يستغرق ذلك حتى دقيقة" : busy ? "جارٍ الرفع…" : "حلّل مخططي ✨"}
            </button>
            <p className="dim" style={{ fontSize: 13, textAlign: "center" }}>
              💡 أفضل نتيجة: ملف PDF الأصلي من المطور، أو صورة عمودية بإضاءة جيدة
            </p>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}
