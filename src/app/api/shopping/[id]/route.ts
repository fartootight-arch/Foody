import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const list = await (prisma as any).shoppingList.findUnique({
      where: { id },
      include: {
        items: {
          include: { ingredient: { include: { category: true } } },
          orderBy: [{ source: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "Shopping list not found" }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("GET /api/shopping/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch shopping list" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, status } = body;

    const list = await (prisma as any).shoppingList.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("PUT /api/shopping/[id] error:", error);
    return NextResponse.json({ error: "Failed to update shopping list" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await (prisma as any).shoppingList.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/shopping/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete shopping list" }, { status: 500 });
  }
}
