import { NextResponse } from "next/server";
import { catalogRepo } from "@/lib/catalog/repository";

export async function GET(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const offers = await catalogRepo.listOffers(productId);
  return NextResponse.json({ offers });
}
