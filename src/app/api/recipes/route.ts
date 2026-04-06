import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const tag = searchParams.get("tag") ?? "";

    const recipes = await prisma.recipe.findMany({
      where: {
        ...(search && { name: { contains: search } }),
        ...(tag && { dietaryTags: { contains: tag } }),
      },
      include: {
        ingredients: {
          include: { ingredient: { include: { category: true } } },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(recipes);
  } catch (error) {
    console.error("GET /api/recipes error:", error);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      instructions,
      prepTime,
      cookTime,
      servings,
      dietaryTags,
      source,
      ingredients,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        name,
        description: description ?? null,
        instructions: JSON.stringify(Array.isArray(instructions) ? instructions : []),
        prepTime: Number(prepTime ?? 0),
        cookTime: Number(cookTime ?? 0),
        servings: Number(servings ?? 2),
        dietaryTags: Array.isArray(dietaryTags) ? dietaryTags.join(",") : (dietaryTags ?? ""),
        source: source ?? null,
        ingredients: {
          create: Array.isArray(ingredients)
            ? ingredients.map((ing: any) => ({
                ingredientId: Number(ing.ingredientId),
                quantity: Number(ing.quantity),
                unit: ing.unit,
                notes: ing.notes ?? null,
                optional: Boolean(ing.optional ?? false),
              }))
            : [],
        },
      },
      include: {
        ingredients: {
          include: { ingredient: { include: { category: true } } },
        },
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("POST /api/recipes error:", error);
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
