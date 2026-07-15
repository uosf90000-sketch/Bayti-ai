/** S8 — شاشة المجلس الحية (لحظة W3) — أحداث SSE (PRD §3-S8 / §6.6) */
import { z } from "zod";

export const AgentId = z.enum([
  "agent.architect", "agent.interior", "agent.kitchen", "agent.bathroom",
  "agent.landscape", "agent.hvac", "agent.lighting_architectural",
  "agent.furniture", "agent.lighting_task", "agent.electrical_roughin",
  "agent.electrical_final", "agent.cost", "agent.shopping",
]);
export type AgentId = z.infer<typeof AgentId>;

/** بطاقة وكيل للعرض — عربية بالكامل (S8: لا مصطلح تقني للمستخدم) */
export const AgentCardInfo = z.object({
  agent_id: AgentId,
  display_name_ar: z.string(), // "المهندس المعماري"، "مهندسة الإضاءة"...
  specialty_ar: z.string(),
});

const base = {
  sequence_number: z.number().int().positive(), // ADR-023: المستهلك يرفض الأقدم
  correlation_id: z.string(),
  emitted_at: z.string(),
};

export const CouncilSseEvent = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("council_started"),
    agents: z.array(AgentCardInfo), estimated_s: z.number().int() }),
  z.object({ ...base, type: z.literal("agent_started"), agent_id: AgentId }),
  z.object({ ...base, type: z.literal("agent_finished"), agent_id: AgentId,
    summary_ar: z.string() }), // "صممت 46 نقطة إضاءة على 3 طبقات"
  z.object({ ...base, type: z.literal("agent_needs_review"), agent_id: AgentId,
    reason_ar: z.string() }),
  z.object({ ...base, type: z.literal("conflict_detected"),
    severity: z.enum(["critical", "major", "minor"]), summary_ar: z.string() }),
  z.object({ ...base, type: z.literal("conflict_resolved"), summary_ar: z.string() }),
  z.object({ ...base, type: z.literal("clarification_needed"),
    question_ar: z.string(), blocking: z.boolean() }),
  z.object({ ...base, type: z.literal("merge_committed"),
    twin_version: z.number().int(), diff_summary_ar: z.string() }),
  z.object({ ...base, type: z.literal("council_finished"),
    twin_version: z.number().int(), health_score: z.number() }),
  z.object({ ...base, type: z.literal("render_room_ready"),
    room_id: z.string(), image_url: z.string() }),
]);
export type CouncilSseEvent = z.infer<typeof CouncilSseEvent>;
