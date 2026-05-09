import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json({
    products: getProducts(searchParams.get("category") ?? undefined)
  });
}
