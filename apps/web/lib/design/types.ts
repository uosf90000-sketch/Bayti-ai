import type { RoomType } from "@bayti/design-schema";

/**
 * خط الإنتاج الحقيقي (Real Design Pipeline) — يعمل فوق التوأم الرقمي المبسّط
 * من lib/twin.ts. كل الأنواع هنا آمنة للعميل (لا استيراد node) — المنطق
 * الخادمي (استدعاء Claude، قراءة الكتالوج) يعيش خلف Route Handlers فقط.
 *
 * قرار نطاق موثّق (راجع docs/DESIGN_PIPELINE.md): هذا خط إنتاج عملي حقيقي —
 * وليس تطبيقًا كاملًا لعقد AgentProposal/AgentRun المجمَّد في
 * packages/design-schema/agents.ts (ذاك يتطلب محرك قواعد ومرجع صيغ حسابية
 * (C6: "no number without evidence") غير مبني بعد في هذا المستودع). كل رقم هنا
 * إما محسوب فعليًا من بيانات حقيقية (سعر منتج من الكتالوج، مساحة مكتشفة) أو
 * غائب صراحة — لا رقم مُخترع، لكن التفسير النصي هنا وصف توليدي من Claude
 * وليس AgentProposal موقّعًا بأدلة formula_ref قابلة لإعادة التشغيل.
 */

/** غرفة مستقلة — كائن قائم بذاته لكل غرفة اكتُشفت فعليًا (لا دمج، لا اختراع) */
export type RoomObject = {
  id: string;
  type: RoomType;
  name_ar: string;
  area_m2: number | null;
  /** أبعاد إن استُنتجت بثقة من نص/مقياس المخطط — وإلا null (لا تخمين — P9) */
  dimensions_m: { width: number | null; length: number | null; height: number | null } | null;
  confidence: number;
};

export type ColorPaletteEntry = { hex: string; role_ar: string; name_ar: string };
export type MaterialSpec = { category_ar: string; name_ar: string; description_ar: string };
/** category مقيَّدة بفئات الكتالوج الحقيقي (CATALOG_CATEGORIES في designEngine.ts) لإبقاء مطابقة التسوق دقيقة */
export type FurnitureItem = { name_ar: string; category: string; qty: number; spec_ar: string };
export type LightingPoint = { name_ar: string; type_ar: string; qty: number; notes_ar: string };

/** مخرج Design Engine لغرفة واحدة — وصف توليدي حقيقي من Claude، لا نص ثابت */
export type RoomDesign = {
  room_id: string;
  style_ar: string;
  summary_ar: string;
  palette: ColorPaletteEntry[];
  materials: MaterialSpec[];
  furniture: FurnitureItem[];
  lighting: LightingPoint[];
  confidence: number;
};

/** مطابقة عنصر تصميم واحد بمنتج حقيقي من الكتالوج — أو صراحة "لا يوجد" */
export type ShoppingMatch =
  | { matched: true; item: FurnitureItem | MaterialSpec; productId: string; productName: string; price: number | null; productUrl: string | null; merchantName: string }
  | { matched: false; item: FurnitureItem | MaterialSpec };

export type RoomCost = {
  room_id: string;
  matchedTotal: number;
  /** مطابق بمنتج حقيقي وله سعر مؤكد — يدخل matchedTotal */
  pricedCount: number;
  /** مطابق بمنتج حقيقي لكن سعره غير مؤكد (منتج بلا سعر) — لا يدخل matchedTotal، منفصل عن "لا يوجد منتج" */
  matchedUnpricedCount: number;
  /** لا يوجد منتج مطابق إطلاقًا في الكتالوج */
  noMatchCount: number;
};

export type ProjectCost = {
  total: number;
  byRoom: RoomCost[];
  byCategory: Record<string, number>;
  /** كل عنصر غير محتسب في total — سواء بلا مطابقة أو مطابق بلا سعر مؤكد */
  unpricedItemCount: number;
};

/** نتيجة خط الإنتاج الكامل لغرفة واحدة */
export type RoomPipelineResult = {
  room: RoomObject;
  design: RoomDesign | null;
  shopping: ShoppingMatch[];
  error: string | null;
};

export type ProjectPipeline = {
  project_id: string;
  rooms: RoomPipelineResult[];
  generated_at: string;
};
