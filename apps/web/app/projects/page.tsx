"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar, RequireAuth, StatusChip } from "@/components/ui";
import { RoomScene } from "@/components/scene";
import type { StoredProject } from "@/lib/mock";
import { projects as projectsService } from "@/lib/services";
import { twinStore } from "@/lib/twin";

export default function Projects() {
  const [projects, setProjects] = useState<StoredProject[] | null>(null);
  useEffect(() => { projectsService.list().then(setProjects); }, []);

  async function openSample() {
    const p = await projectsService.create("فيلا حي النرجس — مثال");
    await projectsService.update(p.id, { status: "ready", fileName: "villa-najres-sample.pdf" });
    twinStore.seedMock(p.id);
    window.location.href = `/projects/${p.id}/preview`;
  }

  return (
    <RequireAuth>
      <main>
        <TopBar
          action={
            <Link href="/projects/new" className="btn btn-gold" style={{ minHeight: 42, padding: "0 18px", fontSize: 15 }}>
              + مشروع جديد
            </Link>
          }
        />
        <section className="section shell">
          <h1 className="h-xl" style={{ marginBottom: 6 }}>مشاريعك</h1>
          <p className="muted t-body" style={{ marginBottom: 24 }}>كل بيت تصممه يبقى هنا — بكل نسخه وتفاصيله</p>

          {projects === null ? (
            <div className="grid-cards">
              {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="stack">
              <button
                type="button"
                onClick={openSample}
                className="card card-hover"
                style={{ padding: 20, textAlign: "start", cursor: "pointer", border: "none", width: "100%" }}
              >
                <div className="room-visual" style={{ height: 150, marginBottom: 14 }}>
                  <RoomScene kind="majlis" />
                  <div className="caption">
                    <span className="chip chip-gold">مثال</span>
                  </div>
                </div>
                <h3 className="h-lg">فيلا حي النرجس</h3>
                <p className="muted t-sm" style={{ marginTop: 4 }}>
                  شاهد كيف تبدو النتيجة النهائية قبل أن ترفع مخططك — استكشف بيتًا مصممًا بالكامل الآن
                </p>
                <span className="btn btn-ghost" style={{ marginTop: 14, minHeight: 44, padding: "0 20px", fontSize: 14.5 }}>
                  استكشف المثال ←
                </span>
              </button>

              <div className="card anim-fade-up" style={{ padding: "44px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40 }}>🏠</div>
                <h2 className="h-lg" style={{ marginTop: 10 }}>ابدأ أول مشروع لبيتك</h2>
                <p className="muted t-body" style={{ maxWidth: 400, margin: "8px auto 0" }}>
                  ارفع مخطط منزلك وشاهد مجلس الخبراء يحوّله إلى تصميم كامل بالأسعار — خلال دقائق.
                </p>
                <Link href="/projects/new" className="btn btn-gold" style={{ marginTop: 20 }}>
                  ارفع مخططك الأول
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid-cards stagger">
              {projects.map((p) => {
                const href =
                  p.status === "ready" ? `/projects/${p.id}/preview`
                  : p.status === "generating" ? `/projects/${p.id}/council`
                  : p.status === "analyzing" || p.status === "needs_review" ? `/projects/${p.id}/analysis`
                  : `/projects/new`;
                return (
                  <Link key={p.id} href={href} style={{ textDecoration: "none" }}>
                    <div className="card card-hover" style={{ padding: 20, height: "100%" }}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <span style={{ fontSize: 26 }}>🏡</span>
                        <StatusChip status={p.status} />
                      </div>
                      <h3 className="h-lg" style={{ marginTop: 12 }}>{p.title}</h3>
                      <p className="dim t-sm" style={{ marginTop: 4 }}>
                        {p.fileName ? `المخطط: ${p.fileName}` : "لم يُرفع مخطط بعد"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </RequireAuth>
  );
}
