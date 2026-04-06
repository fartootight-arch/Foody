import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { listId, name } = body;

    // 1. Find low-stock ingredients (currentQuantity <= minQuantity AND minQuantity > 0)
    const lowStockIngredients = await prisma.ingredient.findMany({
      where: { minQuantity: { gt: 0 } },
    });
    const lowStock = lowStockIngredients.filter(
      (i) => i.currentQuantity <= i.minQuantity
    );

    // 2. Find meal plan entries with draft/confirmed status that have AI suggestions
    const mealPlans = await (prisma as any).mealPlan.findMany({
      where: { status: { in: ["draft", "confirmed"] } },
    });

    const missingIngredientNames = new Set<string>();
    for (const plan of mealPlans) {
      if (!plan.aiSuggestion) continue;
      try {
        const suggestion =
          typeof plan.aiSuggestion === "string"
            ? JSON.parse(plan.aiSuggestion)
            : plan.aiSuggestion;
        const primary = suggestion?.primaryMeal?.missingIngredients ?? [];
        const alternative = suggestion?.alternativeMeal?.missingIngredients ?? [];
        for (const ing of [...primary, ...alternative]) {
          if (typeof ing === "string") missingIngredientNames.add(ing);
          else if (ing?.name) missingIngredientNames.add(ing.name);
        }
      } catch {
        // skip unparseable entries
      }
    }

    // 3. Create or get the shopping list
    let list: any;
    const listName =
      name ??
      `Auto-generated ${new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;

    if (listId) {
      list = await (prisma as any).shoppingList.findUnique({ where: { id: listId } });
      if (!list) {
        return NextResponse.json({ error: "Shopping list not found" }, { status: 404 });
      }
    } else {
      list = await (prisma as any).shoppingList.create({
        data: { name: listName, status: "active" },
      });
    }

    const itemsToCreate: any[] = [];

    // Low stock items
    for (const ing of lowStock) {
      const neededQty = ing.minQuantity - ing.currentQuantity;
      itemsToCreate.push({
        shoppingListId: list.id,
        ingredientId: ing.id,
        name: ing.name,
        quantity: neededQty,
        unit: ing.unit,
        estimatedCost: neededQty * ing.costPerUnit,
        source: "low_stock",
        checked: false,
        sortOrder: 0,
      });
    }

    // Meal plan missing ingredients
    for (const ingName of missingIngredientNames) {
      itemsToCreate.push({
        shoppingListId: list.id,
        ingredientId: null,
        name: ingName,
        quantity: 1,
        unit: "item",
        estimatedCost: null,
        source: "meal_plan",
        checked: false,
        sortOrder: 0,
      });
    }

    // Bulk create items
    await (prisma as any).shoppingListItem.createMany({ data: itemsToCreate });

    // Return the full list with items
    const updatedList = await (prisma as any).shoppingList.findUnique({
      where: { id: list.id },
      include: {
        items: {
          include: { ingredient: { include: { category: true } } },
          orderBy: [{ source: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return NextResponse.json(updatedList, { status: 201 });
  } catch (error) {
    console.error("POST /api/shopping/generate error:", error);
    return NextResponse.json({ error: "Failed to generate shopping list" }, { status: 500 });
  }
}
