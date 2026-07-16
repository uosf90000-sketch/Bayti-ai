/** يطابق packages/catalog-builder/src/types.ts — مُعاد إعلانه هنا محليًا لتفادي ربط أنواع عبر الحزمة (لا exports معرّفة هناك بعد) */
export type Availability = "available" | "unavailable" | "limited" | "preorder" | "unknown";
export type BudgetTier = "economic" | "balanced" | "luxury";
export type Dimensions = {
  widthCm: number | null; depthCm: number | null; heightCm: number | null;
  lengthCm: number | null; diameterCm: number | null; weightKg: number | null;
};
export type CanonicalProduct = {
  id: string; canonicalNameAr: string | null; canonicalNameEn: string | null; brand: string | null;
  category: string; subcategory: string | null; dimensions: Dimensions;
  styleTags: string[]; roomTags: string[]; budgetTier: BudgetTier | null;
  qualityScore: number; offerIds: string[];
};
export type MerchantOffer = {
  id: string; canonicalProductId: string; merchantName: string; merchantDomain: string | null;
  sku: string | null; gtin: string | null; variantLabel: string | null; currency: string;
  price: number | null; previousPrice: number | null; availability: Availability;
  productUrl: string | null; imageUrls: string[]; sourceCheckedAt: string | null;
  needsLiveRecheck: boolean; dataSource: "real" | "demo" | "unknown"; qualityScore: number; issues: string[];
};
