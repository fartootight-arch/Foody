import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get("lowStock") === "true";

    const ingredients = await prisma.ingredient.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    });

    // Filter low stock in JS since SQLite doesn't easily support column comparison
    const result = lowStock
      ? ingredients.filter((i) => i.currentQuantity <= i.minQuantity)
      : ingredients;

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, categoryId, unit, packageCost, packageSize, currentQuantity, minQuantity, notes } = body;

    if (!name || !categoryId || !unit) {
      return NextResponse.json({ error: "name, categoryId and unit are required" }, { status: 400 });
    }

    const pkgCost = Number(packageCost ?? 0);
    const pkgSize = Number(packageSize ?? 1);
    const costPerUnit = pkgSize > 0 ? pkgCost / pkgSize : 0;

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        categoryId: Number(categoryId),
        unit,
        packageCost: pkgCost,
        packageSize: pkgSize,
        costPerUnit,
        currentQuantity: Number(currentQuantity ?? 0),
        minQuantity: Number(minQuantity ?? 0),
        notes: notes ?? null,
      },
      include: { category: true },
    });

    return NextResponse.json(ingredient, { status: 201 });
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json({ error: "Failed to create ingredient" }, { status: 500 });
  }
}
