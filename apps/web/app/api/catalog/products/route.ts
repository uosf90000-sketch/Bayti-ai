import { NextResponse } from "next/server";
import { catalogRepo } from "@/lib/catalog/repository";

/** خادم فقط — catalogRepo يستخدم node:fs في وضع JSON، لا يجوز استيراده مباشرة من كود العميل */
export async function GET() {
  const products = await catalogRepo.listProducts();
  return NextResponse.json({ products });
}
