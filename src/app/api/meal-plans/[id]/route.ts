import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        people: { include: { person: true } },
        entries: {
          include: {
            recipe: {
              include: {
                ingredients: { include: { ingredient: true } },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        inventoryLogs: { include: { ingredient: true } },
        budgetEntry: true,
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("GET /api/meal-plans/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch meal plan" }, { status: 500 });
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
    const { notes, status, entries } = body;

    // Update entry accepted states if provided
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        if (entry.id !== undefined && entry.accepted !== undefined) {
          await prisma.mealPlanEntry.update({
            where: { id: entry.id },
            data: { accepted: entry.accepted },
          });
        }
      }
    }

    const mealPlan = await prisma.mealPlan.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
      include: {
        people: { include: { person: true } },
        entries: {
          include: {
            recipe: {
              include: {
                ingredients: { include: { ingredient: true } },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        budgetEntry: true,
      },
    });

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("PUT /api/meal-plans/[id] error:", error);
    return NextResponse.json({ error: "Failed to update meal plan" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    await prisma.mealPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/meal-plans/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete meal plan" }, { status: 500 });
  }
}
