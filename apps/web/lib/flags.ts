/**
 * Feature Flags (§12.2 — قرار مؤسس): كل خدمة تُستبدل تدريجيًا بقلب flag
 * دون أي تغيير في كود الشاشات. الافتراضي: mock (لا خدمات حقيقية بعد).
 * القيم تُضبط في .env: NEXT_PUBLIC_USE_MOCK_X=false عند ربط الخدمة الحقيقية.
 */
const on = (v: string | undefined) => v !== "false"; // mock افتراضيًا حتى يُطفأ صراحة

export const flags = {
  USE_MOCK_AUTH: on(process.env.NEXT_PUBLIC_USE_MOCK_AUTH),
  USE_MOCK_ANALYSIS: on(process.env.NEXT_PUBLIC_USE_MOCK_ANALYSIS),
  USE_MOCK_COUNCIL: on(process.env.NEXT_PUBLIC_USE_MOCK_COUNCIL),
  USE_MOCK_RESULTS: on(process.env.NEXT_PUBLIC_USE_MOCK_RESULTS),
  /** VS-4: سجل المشاريع + Storage المخططات + checkpoints التحليل (Supabase). يتطلب أيضًا مصادقة حقيقية — راجع supabase/README.md */
  USE_MOCK_PROJECTS: on(process.env.NEXT_PUBLIC_USE_MOCK_PROJECTS),
  /** الكتالوج الحقيقي (Bayti Catalog Builder): mock = ملفات JSON في packages/catalog-data/generated، false = جداول Supabase (catalog_products/catalog_offers) */
  USE_MOCK_CATALOG: on(process.env.NEXT_PUBLIC_USE_MOCK_CATALOG),
} as const;

/**
 * أمان OTP التجريبي (قرار مؤسس): الرمز 1234 يعمل في development فقط.
 * في production لا يعمل أبدًا — إلا بتفعيل صريح موقوف على بيئات المعاينة
 * (NEXT_PUBLIC_ALLOW_TEST_OTP=true تُضبط يدويًا في Vercel Preview فقط، ولا تُضبط في الإنتاج الفعلي).
 */
export const TEST_OTP_ALLOWED =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ALLOW_TEST_OTP === "true";
