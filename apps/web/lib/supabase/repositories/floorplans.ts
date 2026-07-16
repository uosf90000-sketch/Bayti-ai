import { getSupabaseClient } from "../client";
import { createUploadUrl } from "../storage";
import type {
  UploadIntentInput, UploadIntentOutput, UploadCompleteInput, UploadCompleteOutput,
} from "../contract-types";

export const floorplansRepo = {
  /**
   * ينشئ سجل floorplans معلّق + رابط رفع موقَّت — الشكل الأساسي يطابق UploadIntentInput/Output
   * (المرجع الملزم لأي طبقة API مستقبلية)، مع حقلي path/token إضافيين يحتاجهما العميل فعليًا
   * لاستدعاء storage.uploadToSignedUrl مباشرة (بنية Supabase الخاصة بالرفع الموقّت).
   */
  async requestUploadUrl(userId: string, projectId: string, input: UploadIntentInput): Promise<UploadIntentOutput & { path: string; token: string }> {
    const { data, error } = await getSupabaseClient()
      .from("floorplans")
      .insert({
        project_id: projectId,
        file_name: input.file_name,
        content_type: input.content_type,
        size_bytes: input.size_bytes,
        storage_path: "",
        level: input.level,
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(`floorplans.requestUploadUrl: ${error?.message ?? "insert failed"}`);

    const { path, token, signedUrl } = await createUploadUrl(userId, data.id, input.file_name);
    await getSupabaseClient().from("floorplans").update({ storage_path: path }).eq("id", data.id);

    return {
      floorplan_id: data.id,
      upload_url: signedUrl,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      path, token,
    };
  },

  /** يوسم الرفع مكتملًا ويحرّك المشروع لحالة analyzing — يطابق UploadCompleteInput/Output */
  async completeUpload(input: UploadCompleteInput): Promise<UploadCompleteOutput> {
    const { data: fp, error: fpErr } = await getSupabaseClient()
      .from("floorplans")
      .update({ uploaded_at: new Date().toISOString() })
      .eq("id", input.floorplan_id)
      .select("*")
      .single();
    if (fpErr || !fp) throw new Error(`floorplans.completeUpload: ${fpErr?.message ?? "not found"}`);

    const { error: projErr } = await getSupabaseClient()
      .from("projects")
      .update({ status: "analyzing", file_name: fp.file_name })
      .eq("id", fp.project_id);
    if (projErr) throw new Error(`floorplans.completeUpload (project update): ${projErr.message}`);

    return { floorplan_id: input.floorplan_id, status: "analyzing" };
  },
};
