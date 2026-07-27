import { catalogRepo } from "../catalog/repository";
import type { CanonicalProduct, MerchantOffer } from "../catalog/types";
import type { RoomDesign, ShoppingMatch, FurnitureItem, MaterialSpec } from "./types";

/**
 * Shopping Engine — خادم فقط (catalogRepo يقرأ node:fs في وضع mock). يربط كل
 * عنصر تصميم بمنتج حقيقي من الكتالوج المُجمَّد (61 منتجًا معتمدًا — راجع
 * docs/CATALOG_INTEGRATION.md، لا يُعدَّل هنا). لا اختراع منتج — عدم وجود
 * مطابقة حقيقية يُعرض صراحة "لا يوجد منتج مطابق".
 */

const LIGHTING_CATEGORY = "lighting";

function categoryMatches(productCategory: string, wanted: string): boolean {
  return productCategory.toLowerCase() === wanted.toLowerCase();
}

function pickBestMatch(
  products: Array<CanonicalProduct & { bestOffer: MerchantOffer | null }>,
  category: string,
): (CanonicalProduct & { bestOffer: MerchantOffer | null }) | null {
  const candidates = products.filter((p) => categoryMatches(p.category, category) && p.bestOffer);
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => b.qualityScore - a.qualityScore)[0] ?? null;
}

export async function matchRoomDesignToShopping(design: RoomDesign): Promise<ShoppingMatch[]> {
  const products = await catalogRepo.listShoppableProducts();
  const matches: ShoppingMatch[] = [];
  const usedProductIds = new Set<string>();

  const toMatch = (item: FurnitureItem | MaterialSpec, category: string): ShoppingMatch => {
    const available = products.filter((p) => !usedProductIds.has(p.id));
    const best = pickBestMatch(available, category);
    if (!best || !best.bestOffer) return { matched: false, item };
    usedProductIds.add(best.id);
    const name = best.canonicalNameAr || best.canonicalNameEn || "منتج";
    return {
      matched: true, item, productId: best.id, productName: name,
      price: best.bestOffer.price, productUrl: best.bestOffer.productUrl, merchantName: best.bestOffer.merchantName,
    };
  };

  for (const f of design.furniture) matches.push(toMatch(f, f.category));
  for (const l of design.lighting) {
    // نضم كل نقاط الإضاءة لبند تصميم واحد متوافق مع نوع FurnitureItem لإبقاء نوع ShoppingMatch موحّدًا
    const asFurniture: FurnitureItem = { name_ar: l.name_ar, category: LIGHTING_CATEGORY, qty: l.qty, spec_ar: l.notes_ar };
    matches.push(toMatch(asFurniture, LIGHTING_CATEGORY));
  }
  // المواد (دهانات/أرضيات) لا تقابل فئة كتالوج حقيقية بعد — تُعرض دائمًا بصدق كـ"لا يوجد منتج مطابق"
  for (const m of design.materials) matches.push({ matched: false, item: m });

  return matches;
}
