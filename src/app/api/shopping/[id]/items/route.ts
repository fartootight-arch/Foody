import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const items = await (prisma as any).shoppingListItem.findMany({
      where: { shoppingListId: id },
      include: { ingredient: { include: { category: true } } },
      orderBy: [{ source: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/shopping/[id]/items error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { ingredientId, name, quantity, unit, estimatedCost, source, notes } = body;

    if (!name || !unit || quantity === undefined) {
      return NextResponse.json(
        { error: "name, quantity and unit are required" },
        { status: 400 }
      );
    }

    const item = await (prisma as any).shoppingListItem.create({
      data: {
        shoppingListId: id,
        ingredientId: ingredientId ?? null,
        name,
        quantity: Number(quantity),
        unit,
        estimatedCost: estimatedCost !== undefined ? Number(estimatedCost) : null,
        source: source ?? "manual",
        notes: notes ?? null,
        checked: false,
        sortOrder: 0,
      },
      include: { ingredient: { include: { category: true } } },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/shopping/[id]/items error:", error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
