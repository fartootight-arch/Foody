import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { checked, quantity, notes, name, unit, estimatedCost } = body;

    const item = await (prisma as any).shoppingListItem.update({
      where: { id: itemId },
      data: {
        ...(checked !== undefined && { checked }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(notes !== undefined && { notes }),
        ...(name !== undefined && { name }),
        ...(unit !== undefined && { unit }),
        ...(estimatedCost !== undefined && { estimatedCost: Number(estimatedCost) }),
      },
      include: { ingredient: { include: { category: true } } },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("PATCH /api/shopping/[id]/items/[itemId] error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;

    await (prisma as any).shoppingListItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/shopping/[id]/items/[itemId] error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
