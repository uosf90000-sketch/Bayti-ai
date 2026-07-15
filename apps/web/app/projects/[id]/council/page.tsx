"use client";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar, RequireAuth } from "@/components/ui";
import { AGENTS, COUNCIL_SCRIPT, store } from "@/lib/mock";
import type { AgentId } from "@bayti/contracts";

/* شاشة المجلس الحية — لحظة W3 (WOW_MOMENTS): "يشاهد فريقًا كاملًا يشتغل لأجله" */

type AgentState = "idle" | "working" | "done";
type Feed = { id: number; text: string; kind: "info" | "success" | "conflict" };

export default function Council({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [states, setStates] = useState<Record<string, AgentState>>({});
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [feed, setFeed] = useState<Feed[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // مشغّل السيناريو — يحاكي SSE بنفس عقد CouncilSseEvent (sequence مضمون بالترتيب)
    const timers = COUNCIL_SCRIPT.map(({ at, ev }, seq) =>
      setTimeout(() => {
        const e = ev as { type: string; agent_id?: AgentId; summary_ar?: string; severity?: string };
        if (e.type === "agent_started" && e.agent_id) {
          setStates((s) => ({ ...s, [e.agent_id!]: "working" }));
        } else if (e.type === "agent_finished" && e.agent_id) {
          setStates((s) => ({ ...s, [e.agent_id!]: "done" }));
          setSummaries((s) => ({ ...s, [e.agent_id!]: e.summary_ar ?? "" }));
          setDoneCount((c) => c + 1);
          const name = AGENTS.find((a) => a.id === e.agent_id)?.name ?? "";
          setFeed((f) => [...f, { id: seq, text: `${name}: ${e.summary_ar}`, kind: "success" }]);
        } else if (e.type === "conflict_detected") {
          setFeed((f) => [...f, { id: seq, text: `⚠ تعارض: ${e.summary_ar}`, kind: "conflict" }]);
        } else if (e.type === "conflict_resolved") {
          setFeed((f) => [...f, { id: seq, text: `✓ حُسم: ${e.summary_ar}`, kind: "success" }]);
        } else if (e.type === "merge_committed") {
          setFeed((f) => [...f, { id: seq, text: `🔒 اعتُمدت النسخة — ${e.summary_ar ?? (ev as { diff_summary_ar?: string }).diff_summary_ar}`, kind: "info" }]);
        } else if (e.type === "council_finished") {
          setFinished(true);
          store.update(id, { status: "ready" });
        }
      }, at),
    );
    return () => timers.forEach(clearTimeout);
  }, [id]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [feed]);

  const progress = Math.round((doneCount / AGENTS.length) * 100);

  return (
    <RequireAuth>
      <main>
        <TopBar backHref="/projects" />
        <section className="shell" style={{ paddingTop: 24, paddingBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 18 }} className="anim-fade-up">
            <h1 className="h-xl">
              {finished ? "🎊 اكتمل تصميم بيتك" : "مجلسك يعمل الآن على بيتك"}
            </h1>
            <p className="muted" style={{ marginTop: 4, fontSize: 15 }}>
              {finished
                ? "13 خبيرًا أنجزوا عملهم — بيتك جاهز للمعاينة"
                : `أنجز ${doneCount} من ${AGENTS.length} خبيرًا · يمكنك المغادرة وسنكمل العمل`}
            </p>
            <div className="progress-track" style={{ maxWidth: 420, margin: "16px auto 0" }}>
              <div className="progress-fill" style={{ width: `${finished ? 100 : progress}%` }} />
            </div>
          </div>

          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr", alignItems: "start" }} className="council-grid">
            {/* بطاقات الوكلاء */}
            <div className="glass" style={{ padding: 16 }}>
              <div style={{ display: "grid", gap: 8 }}>
                {AGENTS.map((a) => {
                  const st = states[a.id] ?? "idle";
                  return (
                    <div key={a.id} className="agent-card" data-state={st === "idle" ? undefined : st}>
                      <span className="agent-avatar">{a.emoji}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <span style={{ fontWeight: 700, fontSize: 14.5 }}>{a.name}</span>
                          <span className="dim" style={{ fontSize: 12 }}>
                            {st === "working" ? "يعمل الآن…" : st === "done" ? "✓ أنجز" : "بالانتظار"}
                          </span>
                        </div>
                        <div className="dim" style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {summaries[a.id] ?? a.specialty}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* البث الحي */}
            <div className="glass" style={{ padding: 16, position: "sticky", top: 76 }}>
              <h3 className="h-lg" style={{ marginBottom: 10 }}>📡 مباشر من المجلس</h3>
              <div ref={feedRef} style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {feed.length === 0 && <p className="dim" style={{ fontSize: 14 }}>ينعقد المجلس…</p>}
                {feed.map((f) => (
                  <div key={f.id} className="anim-fade-up" style={{
                    padding: "10px 12px", borderRadius: 12, fontSize: 13.5,
                    background: f.kind === "conflict" ? "rgba(224,168,60,0.1)" : "var(--glass-light)",
                    border: `1px solid ${f.kind === "conflict" ? "rgba(224,168,60,0.35)" : "var(--glass-border)"}`,
                  }}>
                    {f.text}
                  </div>
                ))}
              </div>
              {finished && (
                <button
                  className="btn btn-gold btn-block anim-fade-up"
                  style={{ marginTop: 16, minHeight: 54, fontSize: 17 }}
                  onClick={() => router.push(`/projects/${id}/preview`)}
                >
                  شاهد بيتك الجديد ✨
                </button>
              )}
            </div>
          </div>
        </section>
        <style>{`@media (min-width: 860px){ .council-grid { grid-template-columns: 1.15fr 1fr !important; } }`}</style>
      </main>
    </RequireAuth>
  );
}
