"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar, RequireAuth, StatusChip } from "@/components/ui";
import { store, type StoredProject } from "@/lib/mock";

export default function Projects() {
  const [projects, setProjects] = useState<StoredProject[] | null>(null);
  useEffect(() => setProjects(store.list()), []);

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
        <section className="shell" style={{ paddingTop: 24, paddingBottom: 48 }}>
          <h1 className="h-xl" style={{ marginBottom: 4 }}>مشاريعك</h1>
          <p className="muted" style={{ marginBottom: 20 }}>كل بيت تصممه يبقى هنا — بكل نسخه وتفاصيله</p>

          {projects === null ? (
            <div className="grid-cards">
              {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="glass anim-fade-up" style={{ padding: "44px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 44 }}>🏠</div>
              <h2 className="h-lg" style={{ marginTop: 10 }}>ابدأ أول مشروع لبيتك</h2>
              <p className="muted" style={{ maxWidth: 400, margin: "8px auto 0", fontSize: 15 }}>
                ارفع مخطط منزلك وشاهد مجلس الخبراء يحوّله إلى تصميم كامل بالأسعار — خلال دقائق.
              </p>
              <Link href="/projects/new" className="btn btn-gold" style={{ marginTop: 20 }}>
                ارفع مخططك الأول
              </Link>
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
                    <div className="glass glass-hover" style={{ padding: 20, height: "100%" }}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <span style={{ fontSize: 26 }}>🏡</span>
                        <StatusChip status={p.status} />
                      </div>
                      <h3 className="h-lg" style={{ marginTop: 12 }}>{p.title}</h3>
                      <p className="dim" style={{ fontSize: 13, marginTop: 4 }}>
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
