import { NextResponse } from "next/server";
import { catalogRepo } from "@/lib/catalog/repository";

/** منتجات الكتالوج الحقيقي الجاهزة للعرض داخل Shopping — جودة كافية + عرض حقيقي واحد على الأقل */
export async function GET() {
  const products = await catalogRepo.listShoppableProducts();
  return NextResponse.json({ products });
}
