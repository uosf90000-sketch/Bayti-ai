import { getSupabaseClient } from "../client";
import type { AnalysisCheckpointRow } from "../types";

/**
 * قاعدة مؤسس (VS-4): لا AI حقيقي قبل اكتمال الحفظ والاستئناف من checkpoint.
 * كل مرحلة تحليل تُحفظ هنا فورًا؛ الاستئناف يقرأ آخر checkpoint بدل إعادة التحليل من الصفر.
 */
export const checkpointsRepo = {
  async save(projectId: string, stage: string, progressPct: number, payload: Record<string, unknown> = {}): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("analysis_checkpoints")
      .insert({ project_id: projectId, stage, progress_pct: progressPct, payload });
    if (error) throw new Error(`checkpoints.save: ${error.message}`);
  },

  async latest(projectId: string): Promise<AnalysisCheckpointRow | undefined> {
    const { data, error } = await getSupabaseClient()
      .from("analysis_checkpoints")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`checkpoints.latest: ${error.message}`);
    return data ?? undefined;
  },
};
