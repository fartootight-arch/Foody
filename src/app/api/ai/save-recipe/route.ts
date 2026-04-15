import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      instructions,
      ingredients,   // string[] from AI — stored as notes on the recipe
      prepTime,
      cookTime,
      servings,
      dietaryTags,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Don't create duplicates
    const existing = await prisma.recipe.findFirst({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: `A recipe called "${name}" already exists.`, id: existing.id },
        { status: 409 }
      );
    }

    // Store ingredient strings as a note on the recipe (they can be properly
    // linked via the edit page later). We join them into the description if
    // there is no description, or append them as a separate block.
    const ingredientNote =
      Array.isArray(ingredients) && ingredients.length > 0
        ? ingredients.join("\n")
        : null;

    const fullDescription = [description, ingredientNote]
      .filter(Boolean)
      .join("\n\n— Ingredients —\n");

    const recipe = await prisma.recipe.create({
      data: {
        name,
        description: fullDescription || null,
        instructions: JSON.stringify(
          Array.isArray(instructions) ? instructions : []
        ),
        prepTime: Number(prepTime ?? 0),
        cookTime: Number(cookTime ?? 0),
        servings: Number(servings ?? 2),
        source: "AI Foody",
        dietaryTags: Array.isArray(dietaryTags)
          ? dietaryTags.join(",")
          : (dietaryTags ?? ""),
      },
    });

    return NextResponse.json({ id: recipe.id, name: recipe.name }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ai/save-recipe error:", error);
    return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 });
  }
}
