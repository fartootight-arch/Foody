import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let dateFilter: any = undefined;
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      dateFilter = { gte: startDate, lte: endDate };
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
      include: {
        people: { include: { person: true } },
        entries: {
          include: { recipe: true },
          orderBy: { sortOrder: "asc" },
        },
        budgetEntry: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error("GET /api/meal-plans error:", error);
    return NextResponse.json({ error: "Failed to fetch meal plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, healthRating, moodText, peopleIds, notes } = body;

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        date: new Date(date),
        healthRating: Number(healthRating ?? 3),
        moodText: moodText ?? null,
        notes: notes ?? null,
        status: "draft",
        people: {
          create: Array.isArray(peopleIds)
            ? peopleIds.map((personId: number) => ({ personId: Number(personId) }))
            : [],
        },
      },
      include: {
        people: { include: { person: true } },
        entries: { include: { recipe: true } },
      },
    });

    return NextResponse.json(mealPlan, { status: 201 });
  } catch (error) {
    console.error("POST /api/meal-plans error:", error);
    return NextResponse.json({ error: "Failed to create meal plan" }, { status: 500 });
  }
}
