import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    const body = await request.json();
    const { amount, reason } = body;

    if (amount === undefined || !reason) {
      return NextResponse.json({ error: "amount and reason are required" }, { status: 400 });
    }

    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    const newQuantity = ingredient.currentQuantity + Number(amount);

    const [updatedIngredient, log] = await prisma.$transaction([
      prisma.ingredient.update({
        where: { id },
        data: { currentQuantity: newQuantity },
        include: { category: true },
      }),
      prisma.inventoryLog.create({
        data: {
          ingredientId: id,
          changeAmount: Number(amount),
          reason,
        },
      }),
    ]);

    return NextResponse.json({ ingredient: updatedIngredient, log });
  } catch (error) {
    console.error("POST /api/inventory/[id]/adjust error:", error);
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 });
  }
}
