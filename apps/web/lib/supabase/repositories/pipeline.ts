import { getSupabaseClient } from "../client";
import type { RoomType } from "@bayti/design-schema";
import type { AnalyzedTwin, AnalyzedRoom } from "@/lib/twin";
import type { ProjectPipeline, ProjectCost } from "@/lib/design/types";

/**
 * حفظ خط الإنتاج الحقيقي في Supabase — يُستدعى فقط عندما !flags.USE_MOCK_PROJECTS
 * (راجع lib/twin.ts و lib/design/pipeline.ts). يفشل بوضوح إن لم يكن Supabase
 * مهيّأً بمفاتيح حقيقية (getSupabaseClient يرمي رسالة واضحة) — لا سقوط صامت
 * لبيانات محلية بدلًا من الحفظ الحقيقي.
 */
export const pipelineRepo = {
  /** يحفظ نتيجة تحليل المخطط + كل Room Object مستقل تابع لها */
  async saveTwin(twin: AnalyzedTwin): Promise<string> {
    const client = getSupabaseClient();
    const { data: analysis, error } = await client
      .from("floorplan_analyses")
      .insert({ project_id: twin.project_id, source: twin.source, overall_confidence: twin.overall_confidence, analyzed_at: twin.analyzed_at })
      .select("*")
      .single();
    if (error || !analysis) throw new Error(`pipeline.saveTwin: ${error?.message ?? "insert failed"}`);

    const rows = twin.rooms.map((r) => ({
      id: r.id, project_id: twin.project_id, floorplan_analysis_id: analysis.id,
      room_type: r.type, name_ar: r.name_ar, area_m2: r.area_m2, dimensions: r.dimensions_m, confidence: r.confidence,
    }));
    const { error: roomsError } = await client.from("room_objects").upsert(rows);
    if (roomsError) throw new Error(`pipeline.saveTwin: ${roomsError.message}`);
    return analysis.id as string;
  },

  async getTwin(projectId: string): Promise<AnalyzedTwin | undefined> {
    const client = getSupabaseClient();
    const { data: analysis, error } = await client
      .from("floorplan_analyses")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`pipeline.getTwin: ${error.message}`);
    if (!analysis) return undefined;

    const { data: rooms, error: roomsError } = await client.from("room_objects").select("*").eq("floorplan_analysis_id", analysis.id);
    if (roomsError) throw new Error(`pipeline.getTwin: ${roomsError.message}`);

    const analyzedRooms: AnalyzedRoom[] = (rooms ?? []).map((r) => ({
      id: r.id, type: r.room_type as RoomType, name_ar: r.name_ar, area_m2: r.area_m2, dimensions_m: r.dimensions, confidence: r.confidence,
    }));
    return { project_id: projectId, source: analysis.source, overall_confidence: analysis.overall_confidence, analyzed_at: analysis.analyzed_at, rooms: analyzedRooms };
  },

  /** يحفظ نتائج التصميم والتسوق لكل غرفة (فقط الغرف التي نجح توليدها فعليًا) + ملخص التكلفة */
  async savePipeline(pipeline: ProjectPipeline, cost: ProjectCost): Promise<void> {
    const client = getSupabaseClient();
    for (const r of pipeline.rooms) {
      if (!r.design) continue; // لا نحفظ فشلًا كنتيجة تصميم — فقط تصاميم ناجحة فعليًا
      const { data: designRow, error } = await client
        .from("room_designs")
        .insert({
          room_id: r.room.id, project_id: pipeline.project_id, style_ar: r.design.style_ar, summary_ar: r.design.summary_ar,
          palette: r.design.palette, materials: r.design.materials, furniture: r.design.furniture, lighting: r.design.lighting,
          confidence: r.design.confidence,
        })
        .select("*")
        .single();
      if (error || !designRow) throw new Error(`pipeline.savePipeline: ${error?.message ?? "insert failed"}`);

      if (r.shopping.length > 0) {
        const matchRows = r.shopping.map((m) => ({
          room_design_id: designRow.id, project_id: pipeline.project_id, item: m.item, matched: m.matched,
          product_id: m.matched ? m.productId : null, product_name: m.matched ? m.productName : null,
          price: m.matched ? m.price : null, product_url: m.matched ? m.productUrl : null,
          merchant_name: m.matched ? m.merchantName : null,
        }));
        const { error: matchError } = await client.from("shopping_matches").insert(matchRows);
        if (matchError) throw new Error(`pipeline.savePipeline: ${matchError.message}`);
      }
    }

    const { error: costError } = await client.from("cost_summaries").insert({
      project_id: pipeline.project_id, total: cost.total, by_room: cost.byRoom, by_category: cost.byCategory,
      unpriced_item_count: cost.unpricedItemCount,
    });
    if (costError) throw new Error(`pipeline.savePipeline: ${costError.message}`);
  },

  /** لقطة إصدار غير قابلة للتعديل (P7) — رقم الإصدار يزيد تلقائيًا لكل مشروع */
  async saveVersion(projectId: string, pipeline: ProjectPipeline, label?: string): Promise<number> {
    const client = getSupabaseClient();
    const { data: last, error: lastError } = await client
      .from("project_versions")
      .select("version_number")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) throw new Error(`pipeline.saveVersion: ${lastError.message}`);
    const nextVersion = (last?.version_number ?? 0) + 1;

    const { error } = await client
      .from("project_versions")
      .insert({ project_id: projectId, version_number: nextVersion, snapshot: pipeline, label: label ?? null });
    if (error) throw new Error(`pipeline.saveVersion: ${error.message}`);
    return nextVersion;
  },

  /** يقرأ آخر لقطة إصدار كاملة — أبسط وأدق من إعادة تجميع الجداول المنفصلة */
  async getLatestPipeline(projectId: string): Promise<ProjectPipeline | undefined> {
    const { data, error } = await getSupabaseClient()
      .from("project_versions")
      .select("*")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`pipeline.getLatestPipeline: ${error.message}`);
    return data ? (data.snapshot as ProjectPipeline) : undefined;
  },
};
