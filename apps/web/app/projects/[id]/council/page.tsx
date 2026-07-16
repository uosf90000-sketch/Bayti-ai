"use client";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar, RequireAuth } from "@/components/ui";
import { AGENTS, COUNCIL_SCRIPT } from "@/lib/mock";
import { projects } from "@/lib/services";
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
  const [lastDone, setLastDone] = useState<AgentId | null>(null);
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
          setLastDone(e.agent_id!);
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
          projects.update(id, { status: "ready" });
        }
      }, at),
    );
    return () => timers.forEach(clearTimeout);
  }, [id]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [feed]);

  const progress = Math.round((doneCount / AGENTS.length) * 100);
  const pct = finished ? 100 : progress;
  const r = 58;
  const circumference = 2 * Math.PI * r;
  const working = AGENTS.find((a) => states[a.id] === "working");
  const lastDoneAgent = lastDone ? AGENTS.find((a) => a.id === lastDone) : undefined;

  return (
    <RequireAuth>
      <main>
        <TopBar backHref="/projects" />
        <section className="section shell">
          <div className="row anim-fade-up" style={{ gap: 24, alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginBottom: 22, textAlign: "start" }}>
            <div className="ring-wrap" style={{ width: 132, height: 132 }}>
              <svg viewBox="0 0 132 132" width={132} height={132}>
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--accent-deep)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                  </linearGradient>
                </defs>
                <circle className="ring-track" cx="66" cy="66" r={r} strokeWidth={10} fill="none" />
                <circle
                  className="ring-fill"
                  cx="66" cy="66" r={r} strokeWidth={10} fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - pct / 100)}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <span className="num h-xl">{pct}%</span>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <h1 className="h-xl">{finished ? "🎊 اكتمل تصميم بيتك" : "مجلسك يعمل الآن على بيتك"}</h1>
              <p className="muted t-body" style={{ marginTop: 4 }}>
                {finished
                  ? "13 خبيرًا أنجزوا عملهم — بيتك جاهز للمعاينة"
                  : `أنجز ${doneCount} من ${AGENTS.length} خبيرًا · يمكنك المغادرة وسنكمل العمل`}
              </p>
            </div>
          </div>

          {/* لوحة الأضواء — الخبير الذي يعمل الآن */}
          <div className="spotlight anim-fade-up" style={{ padding: "20px 22px", marginBottom: 18, textAlign: "center" }}>
            {working ? (
              <>
                <span className="chip chip-gold" style={{ marginBottom: 10 }}>يعمل الآن…</span>
                <div style={{ fontSize: 34 }}>{working.emoji}</div>
                <h3 className="h-lg" style={{ marginTop: 6 }}>{working.name}</h3>
                <p className="muted t-sm">{working.specialty}</p>
              </>
            ) : finished ? (
              <>
                <div style={{ fontSize: 30 }}>✓</div>
                <h3 className="h-lg" style={{ marginTop: 6 }}>كل الخبراء أنجزوا عملهم</h3>
                <p className="muted t-sm">بيتك جاهز — بكل تفاصيله المدروسة</p>
              </>
            ) : lastDoneAgent ? (
              <>
                <span className="chip chip-success" style={{ marginBottom: 10 }}>آخر إنجاز</span>
                <div style={{ fontSize: 30 }}>{lastDoneAgent.emoji}</div>
                <h3 className="h-lg" style={{ marginTop: 6 }}>{lastDoneAgent.name}</h3>
                <p className="muted t-sm">{summaries[lastDoneAgent.id]}</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 30 }}>🏛️</div>
                <h3 className="h-lg" style={{ marginTop: 6 }}>المجلس يستعد لبيتك…</h3>
              </>
            )}
          </div>

          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr", alignItems: "start" }} className="council-grid">
            {/* قائمة الوكلاء */}
            <div className="card" style={{ padding: "6px 16px" }}>
              {AGENTS.map((a) => {
                const st = states[a.id] ?? "idle";
                return (
                  <div key={a.id} className="agent-line" data-state={st}>
                    <span className="agent-dot" />
                    <span style={{ fontSize: 19 }}>{a.emoji}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 14.5 }}>{a.name}</span>
                        <span className={st === "working" ? "gold t-sm" : "dim t-sm"}>
                          {st === "working" ? "يعمل الآن…" : st === "done" ? "✓ أنجز" : "بالانتظار"}
                        </span>
                      </div>
                      <div className="dim t-sm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {summaries[a.id] ?? a.specialty}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* البث الحي */}
            <div className="glass" style={{ padding: 16, position: "sticky", top: 76 }}>
              <h3 className="h-lg" style={{ marginBottom: 10 }}>📡 مباشر من المجلس</h3>
              <div ref={feedRef} style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {feed.length === 0 && <p className="dim t-sm">ينعقد المجلس…</p>}
                {feed.map((f) => (
                  <div key={f.id} className="anim-fade-up t-sm" style={{
                    padding: "10px 12px", borderRadius: 12,
                    background: f.kind === "conflict" ? "color-mix(in srgb, var(--warning) 12%, transparent)" : "var(--surface-2)",
                    border: `1px solid ${f.kind === "conflict" ? "color-mix(in srgb, var(--warning) 40%, transparent)" : "var(--line)"}`,
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
