/**
 * Agent Council contracts — PRD §6.3–6.5 (Architecture v1.0 Frozen).
 * C1: لا وكيل يكتب على التوأم · C6: لا رقم هندسي بلا سند · ADR-018/031: اقتراح فقط.
 */
import { z } from "zod";
import { Confidence } from "./twin.ts";

export const MoneyRange = z.object({
  low: z.number(),
  high: z.number(),
  currency: z.literal("SAR"),
});
export type MoneyRange = z.infer<typeof MoneyRange>;

/** §6.4 — EvidenceRef: رقم بلا سند = رفض آلي (C6) */
export const EvidenceRef = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("rule"), rule_id: z.string() }),
  z.object({
    kind: z.literal("calculation"),
    calc_id: z.string(),
    formula_ref: z.string(), // مرجع معادلة مسجلة — لا نص حر (ADR-020)
    inputs: z.record(z.union([z.number(), z.string()])),
    result: z.number(),
    unit: z.string(),
  }),
  z.object({ kind: z.literal("catalog"), ref: z.string() }),
  z.object({ kind: z.literal("twin"), entity_id: z.string(), field: z.string() }),
]);
export type EvidenceRef = z.infer<typeof EvidenceRef>;

/** §6.5 — التفسير بثلاث طبقات؛ قرار لا يمكن إعادة حسابه يُرفض */
export const DecisionExplanation = z.object({
  // 1) طبقة المستخدم
  decision_summary_ar: z.string(),
  reason_ar: z.string(),
  budget_impact: z.object({ text_ar: z.string(), amount: MoneyRange.nullable() }),
  usability_impact: z.string(),
  maintenance_impact: z.string().nullable(),
  safety_impact: z.string().nullable(),
  user_visible: z.boolean(),
  // 2) طبقة التدقيق
  rule_ids: z.array(z.string()),
  evidence_sources: z.array(EvidenceRef),
  assumptions: z.array(z.string()),
  alternatives_considered: z.array(
    z.object({ option_ar: z.string(), score: z.number().optional() }),
  ),
  rejected_alternatives: z.array(
    z.object({ option_ar: z.string(), rejection_reason_ar: z.string() }),
  ),
  technical_details: z.string().nullable(),
  // 3) الطبقة الحسابية القابلة لإعادة التشغيل بت-بت
  calculations: z.array(
    z.object({
      calc_id: z.string(),
      formula_ref: z.string(),
      inputs: z.record(z.union([z.number(), z.string()])),
      result: z.number(),
      unit: z.string(),
    }),
  ),
  confidence: Confidence,
  uncertainty: z
    .object({ level: z.enum(["low", "medium", "high"]), reason_ar: z.string() })
    .nullable(),
});
export type DecisionExplanation = z.infer<typeof DecisionExplanation>;

export const ProposalStatus = z.enum([
  "proposed", "rule_checked", "accepted", "rejected", "merged", "superseded",
]);

/** §6.4 — AgentProposal: مخرج الوكيل الوحيد المسموح (C2) */
export const AgentProposal = z.object({
  proposal_id: z.string(),
  agent_id: z.string(),
  run_id: z.string(),
  target_entity_id: z.string(),
  proposal_type: z.string(),
  operation: z.enum(["create", "update", "replace", "remove"]),
  before_state: z.record(z.unknown()).nullable(),
  proposed_state: z.record(z.unknown()),
  geometric_effect: z.object({
    changed: z.boolean(),
    summary: z.string().optional(),
    affected_entities: z.array(z.string()).optional(),
  }),
  budget_effect: MoneyRange.nullable(),
  usability_effect: z.string().nullable(),
  maintenance_effect: z.string().nullable(),
  safety_effect: z.string().nullable(),
  sustainability_effect: z.string().nullable(),
  required_rules: z.array(z.string()),
  evidence: z.array(EvidenceRef).min(1), // C6 بنيويًا
  alternatives: z.array(
    z.object({ summary_ar: z.string(), why_not_chosen_ar: z.string() }),
  ),
  confidence: Confidence,
  explanation: DecisionExplanation,
  reversible: z.literal(true), // v1: كل شيء قابل للتراجع (C7)
  dependencies: z.array(z.string()),
  conflicts: z.array(z.string()),
  status: ProposalStatus,
});
export type AgentProposal = z.infer<typeof AgentProposal>;

export const AgentRunStatus = z.enum([
  "pending", "running", "completed", "needs_clarification",
  "blocked", "failed", "superseded", "cancelled",
]);
export type AgentRunStatus = z.infer<typeof AgentRunStatus>;

export const UnresolvedQuestion = z.object({
  id: z.string(),
  question_ar: z.string(),
  blocking: z.boolean(), // blocking يوقف المجلس — لا تخمين (C9/P9)
  default_if_deferred: z.string().nullable(),
  raised_by: z.string(),
  resolution: z.object({ answer: z.string(), at: z.string() }).nullable(),
});
export type UnresolvedQuestion = z.infer<typeof UnresolvedQuestion>;

/** §6.3 — سجل تشغيلة الوكيل (immutable بعد الاكتمال) */
export const AgentRun = z.object({
  run_id: z.string(),
  correlation_id: z.string(),
  agent_id: z.string(),
  agent_version: z.string(),
  model_id: z.string(),
  prompt_version: z.string(),
  project_id: z.string(),
  intake_bundle_version: z.string(), // F-07: أُعيدت تسميته من project_version_id
  twin_version_id: z.string(), // C7: كل نتيجة مرتبطة بإصدار توأم
  input_artifact_ids: z.array(z.string()),
  dependency_results: z.array(z.object({ agent_id: z.string(), run_id: z.string() })),
  proposals: z.array(AgentProposal),
  rejected_options: z.array(z.object({ summary_ar: z.string(), reason: z.string() })),
  assumptions: z.array(
    z.object({ id: z.string(), text_ar: z.string(), risk: z.enum(["low", "medium", "high"]) }),
  ),
  unresolved_questions: z.array(UnresolvedQuestion),
  warnings: z.array(z.object({ code: z.string(), text_ar: z.string() })),
  hard_constraint_violations: z.array(z.string()), // يجب أن تكون فارغة للنشر (C8)
  soft_constraint_tradeoffs: z.array(
    z.object({ constraint: z.string(), tradeoff_ar: z.string() }),
  ),
  estimated_cost_impact: MoneyRange.nullable(),
  estimated_usage_impact: z.string().nullable(),
  confidence: Confidence,
  explanation: DecisionExplanation,
  token_usage: z.object({
    input: z.number().int().nonnegative(),
    output: z.number().int().nonnegative(),
    cost_usd: z.number().nonnegative(),
  }),
  latency_ms: z.number().nonnegative(),
  status: AgentRunStatus,
  created_at: z.string(),
});
export type AgentRun = z.infer<typeof AgentRun>;
