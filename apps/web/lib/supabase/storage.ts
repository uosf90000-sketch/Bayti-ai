import { getSupabaseClient } from "./client";

export const FLOORPLANS_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "floorplans";

/** يطابق نمط الرفع عبر presigned في العقد (UploadIntentInput/Output) — العميل يرفع مباشرة لـ Storage لا عبر API */
export async function createUploadUrl(userId: string, floorplanId: string, fileName: string) {
  const path = `${userId}/${floorplanId}/${fileName}`;
  const { data, error } = await getSupabaseClient()
    .storage.from(FLOORPLANS_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) throw new Error(`تعذّر إنشاء رابط رفع: ${error?.message ?? "unknown"}`);
  return { path, token: data.token, signedUrl: data.signedUrl };
}

/** يُستخدم من طرف العميل مباشرة بعد الحصول على upload_url — لا يمر الملف عبر خادمنا */
export async function uploadToSignedUrl(path: string, token: string, file: File) {
  const { error } = await getSupabaseClient()
    .storage.from(FLOORPLANS_BUCKET)
    .uploadToSignedUrl(path, token, file);
  if (error) throw new Error(`فشل رفع الملف: ${error.message}`);
}
