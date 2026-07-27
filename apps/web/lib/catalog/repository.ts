import type { CanonicalProduct, MerchantOffer } from "./types";
import type { CatalogProductRow, CatalogOfferRow } from "../supabase/types";

/**
 * مصدر واحد للكتالوج الحقيقي (خطوة 6 من دمج Bayti Catalog Builder):
 * JSON من packages/catalog-data/generated (mock/dev) أو جداول Supabase catalog_products/catalog_offers (حقيقي).
 * نفس فلترة سياسات RLS في supabase/migrations/0002_catalog.sql تُطبَّق يدويًا في وضع JSON
 * حتى يتطابق سلوك الوضعين تمامًا عند قلب الـ flag (AC12-3).
 */
const MIN_QUALITY = 60;

async function readJson<T>(fileName: string): Promise<T> {
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  // process.cwd() = apps/web وقت التشغيل (dev أو Railway) — يصعد لجذر المستودع ثم يدخل packages/catalog-data/generated
  const file = path.resolve(process.cwd(), "..", "..", "packages", "catalog-data", "generated", fileName);
  return JSON.parse(await readFile(file, "utf8"));
}

function productFromRow(r: CatalogProductRow): CanonicalProduct {
  return {
    id: r.id, canonicalNameAr: r.canonical_name_ar, canonicalNameEn: r.canonical_name_en, brand: r.brand,
    category: r.category, subcategory: r.subcategory,
    dimensions: {
      widthCm: r.dimensions.widthCm ?? null, depthCm: r.dimensions.depthCm ?? null, heightCm: r.dimensions.heightCm ?? null,
      lengthCm: r.dimensions.lengthCm ?? null, diameterCm: r.dimensions.diameterCm ?? null, weightKg: r.dimensions.weightKg ?? null,
    },
    styleTags: r.style_tags, roomTags: r.room_tags, budgetTier: (r.budget_tier as CanonicalProduct["budgetTier"]) ?? null,
    qualityScore: r.quality_score, offerIds: [],
  };
}

function offerFromRow(r: CatalogOfferRow): MerchantOffer {
  return {
    id: r.id, canonicalProductId: r.canonical_product_id, merchantName: r.merchant_name, merchantDomain: r.merchant_domain,
    sku: r.sku, gtin: r.gtin, variantLabel: r.variant_label, currency: r.currency, price: r.price, previousPrice: r.previous_price,
    availability: r.availability as MerchantOffer["availability"], productUrl: r.product_url, imageUrls: r.image_urls,
    sourceCheckedAt: r.source_checked_at, needsLiveRecheck: r.needs_live_recheck, dataSource: r.data_source as MerchantOffer["dataSource"],
    qualityScore: r.quality_score, issues: r.issues,
  };
}

export const catalogRepo = {
  async listProducts(): Promise<CanonicalProduct[]> {
    const { flags } = await import("../flags");
    if (flags.USE_MOCK_CATALOG) {
      const all = await readJson<CanonicalProduct[]>("canonical-products.json");
      return all.filter((p) => p.qualityScore >= MIN_QUALITY);
    }
    const { getSupabaseClient } = await import("../supabase/client");
    const { data, error } = await getSupabaseClient()
      .from("catalog_products")
      .select("*")
      .gte("quality_score", MIN_QUALITY);
    if (error) throw new Error(`catalog.listProducts: ${error.message}`);
    return (data ?? []).map(productFromRow);
  },

  async listOffers(canonicalProductId: string): Promise<MerchantOffer[]> {
    const { flags } = await import("../flags");
    if (flags.USE_MOCK_CATALOG) {
      const all = await readJson<MerchantOffer[]>("merchant-offers.json");
      return all.filter(
        (o) =>
          o.canonicalProductId === canonicalProductId &&
          o.qualityScore >= MIN_QUALITY &&
          o.dataSource === "real" &&
          !!o.productUrl,
      );
    }
    const { getSupabaseClient } = await import("../supabase/client");
    const { data, error } = await getSupabaseClient()
      .from("catalog_offers")
      .select("*")
      .eq("canonical_product_id", canonicalProductId)
      .gte("quality_score", MIN_QUALITY)
      .eq("data_source", "real")
      .not("product_url", "is", null);
    if (error) throw new Error(`catalog.listOffers: ${error.message}`);
    return (data ?? []).map(offerFromRow);
  },

  /** منتجات جاهزة للعرض (جودة كافية) مع أفضل عرض حقيقي لكل واحد — استدعاء واحد بدل N+1 من الشاشة */
  async listShoppableProducts(): Promise<Array<CanonicalProduct & { bestOffer: MerchantOffer | null }>> {
    const { flags } = await import("../flags");
    if (flags.USE_MOCK_CATALOG) {
      const [products, offers] = await Promise.all([
        readJson<CanonicalProduct[]>("canonical-products.json"),
        readJson<MerchantOffer[]>("merchant-offers.json"),
      ]);
      return products
        .filter((p) => p.qualityScore >= MIN_QUALITY)
        .map((p) => {
          const eligible = offers.filter(
            (o) => o.canonicalProductId === p.id && o.qualityScore >= MIN_QUALITY && o.dataSource === "real" && !!o.productUrl,
          );
          const bestOffer = eligible.sort((a, b) => (b.price ?? -1) === (a.price ?? -1) ? b.qualityScore - a.qualityScore : (a.price ?? Infinity) - (b.price ?? Infinity))[0] ?? null;
          return { ...p, bestOffer };
        })
        .filter((p) => p.bestOffer !== null);
    }
    const products = await catalogRepo.listProducts();
    const withOffers = await Promise.all(
      products.map(async (p) => ({ ...p, bestOffer: (await catalogRepo.listOffers(p.id))[0] ?? null })),
    );
    return withOffers.filter((p) => p.bestOffer !== null);
  },
};
