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
    const { totalCost } = body;

    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: { budgetEntry: true },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    const cost = Number(totalCost ?? 0);

    await prisma.$transaction([
      prisma.mealPlan.update({
        where: { id },
        data: { status: "cooked" },
      }),
      ...(mealPlan.budgetEntry
        ? [
            prisma.budgetEntry.update({
              where: { mealPlanId: id },
              data: {
                amount: cost,
                date: mealPlan.date,
                category: "meal",
                description: `Meal plan - ${new Date(mealPlan.date).toLocaleDateString("en-GB")}`,
              },
            }),
          ]
        : [
            prisma.budgetEntry.create({
              data: {
                mealPlanId: id,
                amount: cost,
                date: mealPlan.date,
                category: "meal",
                description: `Meal plan - ${new Date(mealPlan.date).toLocaleDateString("en-GB")}`,
              },
            }),
          ]),
    ]);

    const updated = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        people: { include: { person: true } },
        entries: { orderBy: { sortOrder: "asc" } },
        budgetEntry: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/meal-plans/[id]/cooked error:", error);
    return NextResponse.json({ error: "Failed to mark meal plan as cooked" }, { status: 500 });
  }
}
