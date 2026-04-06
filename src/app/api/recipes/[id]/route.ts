import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: { ingredient: { include: { category: true } } },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("GET /api/recipes/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
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

    // Delete existing recipe ingredients and recreate
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(instructions !== undefined && {
          instructions: JSON.stringify(Array.isArray(instructions) ? instructions : [instructions]),
        }),
        ...(prepTime !== undefined && { prepTime: Number(prepTime) }),
        ...(cookTime !== undefined && { cookTime: Number(cookTime) }),
        ...(servings !== undefined && { servings: Number(servings) }),
        ...(dietaryTags !== undefined && {
          dietaryTags: Array.isArray(dietaryTags) ? dietaryTags.join(",") : dietaryTags,
        }),
        ...(source !== undefined && { source }),
        ...(Array.isArray(ingredients) && {
          ingredients: {
            create: ingredients.map((ing: any) => ({
              ingredientId: Number(ing.ingredientId),
              quantity: Number(ing.quantity),
              unit: ing.unit,
              notes: ing.notes ?? null,
              optional: Boolean(ing.optional ?? false),
            })),
          },
        }),
      },
      include: {
        ingredients: {
          include: { ingredient: { include: { category: true } } },
        },
      },
    });

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("PUT /api/recipes/[id] error:", error);
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    await prisma.recipe.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/recipes/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 });
  }
}
