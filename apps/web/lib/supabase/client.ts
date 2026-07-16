import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient<Database> | null = null;

/** يرمي خطأً واضحًا إن لم تُضبط متغيرات البيئة — لا سقوط صامت (نفس فلسفة notWired في services.ts) */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase غير مهيأ — أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في .env.local قبل إطفاء أي flag يعتمد عليه (راجع supabase/README.md)",
    );
  }
  if (!client) client = createClient<Database>(url, anonKey);
  return client;
}

export async function currentUserId(): Promise<string> {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error || !data.user) {
    throw new Error("لا توجد جلسة Supabase حقيقية — المصادقة الحقيقية خطوة لاحقة منفصلة عن VS-4 (راجع supabase/README.md)");
  }
  return data.user.id;
}
