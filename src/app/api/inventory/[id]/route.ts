import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        category: true,
        inventoryLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error("GET /api/inventory/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch ingredient" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    const body = await request.json();
    const { name, categoryId, unit, packageCost, packageSize, currentQuantity, minQuantity, notes } = body;

    // Derive costPerUnit if packageCost or packageSize provided
    let derivedCostPerUnit: number | undefined;
    if (packageCost !== undefined || packageSize !== undefined) {
      const pkgCost = Number(packageCost ?? 0);
      const pkgSize = Number(packageSize ?? 1);
      derivedCostPerUnit = pkgSize > 0 ? pkgCost / pkgSize : 0;
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(categoryId !== undefined && { categoryId: Number(categoryId) }),
        ...(unit !== undefined && { unit }),
        ...(packageCost !== undefined && { packageCost: Number(packageCost) }),
        ...(packageSize !== undefined && { packageSize: Number(packageSize) }),
        ...(derivedCostPerUnit !== undefined && { costPerUnit: derivedCostPerUnit }),
        ...(currentQuantity !== undefined && { currentQuantity: Number(currentQuantity) }),
        ...(minQuantity !== undefined && { minQuantity: Number(minQuantity) }),
        ...(notes !== undefined && { notes }),
      },
      include: { category: true },
    });

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error("PUT /api/inventory/[id] error:", error);
    return NextResponse.json({ error: "Failed to update ingredient" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    await prisma.ingredient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/inventory/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete ingredient" }, { status: 500 });
  }
}
