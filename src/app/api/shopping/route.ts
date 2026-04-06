import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lists = await (prisma as any).shoppingList.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
        items: { select: { estimatedCost: true } },
      },
    });

    const result = lists.map((list: any) => ({
      id: list.id,
      name: list.name,
      status: list.status,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      itemCount: list._count.items,
      estimatedTotal: list.items.reduce(
        (sum: number, item: any) => sum + (item.estimatedCost ?? 0),
        0
      ),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/shopping error:", error);
    return NextResponse.json({ error: "Failed to fetch shopping lists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    const list = await (prisma as any).shoppingList.create({
      data: {
        name: name ?? `Shopping List ${new Date().toLocaleDateString("en-GB")}`,
        status: "active",
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error("POST /api/shopping error:", error);
    return NextResponse.json({ error: "Failed to create shopping list" }, { status: 500 });
  }
}
