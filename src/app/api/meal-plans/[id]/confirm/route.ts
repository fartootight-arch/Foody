import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);

    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        entries: {
          where: { accepted: true },
          include: {
            recipe: {
              include: {
                ingredients: { include: { ingredient: true } },
              },
            },
          },
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    if (mealPlan.status === "confirmed" || mealPlan.status === "cooked") {
      return NextResponse.json({ error: "Meal plan already confirmed or cooked" }, { status: 400 });
    }

    // Collect all ingredient deductions
    const deductions: Array<{ ingredientId: number; amount: number; name: string }> = [];

    for (const entry of mealPlan.entries) {
      if (entry.recipe) {
        for (const ri of entry.recipe.ingredients) {
          const existing = deductions.find((d) => d.ingredientId === ri.ingredientId);
          if (existing) {
            existing.amount += ri.quantity;
          } else {
            deductions.push({
              ingredientId: ri.ingredientId,
              amount: ri.quantity,
              name: ri.ingredient.name,
            });
          }
        }
      }
    }

    // Execute all updates in a transaction
    await prisma.$transaction([
      prisma.mealPlan.update({
        where: { id },
        data: { status: "confirmed" },
      }),
      ...deductions.map((d) =>
        prisma.ingredient.update({
          where: { id: d.ingredientId },
          data: { currentQuantity: { decrement: d.amount } },
        })
      ),
      ...deductions.map((d) =>
        prisma.inventoryLog.create({
          data: {
            ingredientId: d.ingredientId,
            changeAmount: -d.amount,
            reason: `Used in meal plan #${id}`,
            mealPlanId: id,
          },
        })
      ),
    ]);

    const updated = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        people: { include: { person: true } },
        entries: {
          include: { recipe: { include: { ingredients: { include: { ingredient: true } } } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/meal-plans/[id]/confirm error:", error);
    return NextResponse.json({ error: "Failed to confirm meal plan" }, { status: 500 });
  }
}
