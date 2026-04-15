import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/recipes/[id]/like  { personId }  — toggles like on/off
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipeId = Number(id);
  const { personId } = await req.json();

  if (!personId) {
    return NextResponse.json({ error: "personId required" }, { status: 400 });
  }

  const existing = await prisma.recipeLike.findUnique({
    where: { recipeId_personId: { recipeId, personId } },
  });

  if (existing) {
    await prisma.recipeLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  } else {
    await prisma.recipeLike.create({ data: { recipeId, personId } });
    return NextResponse.json({ liked: true });
  }
}
