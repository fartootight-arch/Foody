import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geminiModel } from "@/lib/gemini";
import { parseJsonArray } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    const body = await request.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // Load the meal plan
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        people: { include: { person: true } },
        entries: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    if (!mealPlan.aiSuggestion) {
      return NextResponse.json({ error: "No AI suggestion to refine" }, { status: 400 });
    }

    let currentSuggestion: any;
    try {
      currentSuggestion = JSON.parse(mealPlan.aiSuggestion);
    } catch {
      return NextResponse.json({ error: "Could not parse existing suggestion" }, { status: 400 });
    }

    // Fetch current inventory (real stock, no Hello Fresh)
    const ingredients = await prisma.ingredient.findMany({
      where: {
        currentQuantity: { gt: 0 },
        category: { name: { not: "Hello Fresh" } },
      },
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });

    const inventoryByCategory: Record<string, string[]> = {};
    for (const ing of ingredients) {
      if (!inventoryByCategory[ing.category.name]) inventoryByCategory[ing.category.name] = [];
      inventoryByCategory[ing.category.name].push(`${ing.currentQuantity} ${ing.unit} ${ing.name}`);
    }
    const inventoryText = Object.entries(inventoryByCategory)
      .map(([cat, items]) => `[${cat}]\n` + items.map((i) => `  • ${i}`).join("\n"))
      .join("\n\n");

    // People profiles
    const peopleProfiles = mealPlan.people.map((pp) => ({
      name: pp.person.name,
      relationship: pp.person.relationship,
      dietary: parseJsonArray(pp.person.dietary),
      allergies: parseJsonArray(pp.person.allergies),
      likes: parseJsonArray(pp.person.likes),
      dislikes: parseJsonArray(pp.person.dislikes),
    }));

    const servingCount = mealPlan.people.length || currentSuggestion?.primaryMeal?.servings || 2;

    const prompt = `You are Foody, a helpful home chef assistant. You previously suggested a meal and the user wants to refine it.

CURRENT SUGGESTION:
${JSON.stringify(currentSuggestion, null, 2)}

USER'S REFINEMENT REQUEST: "${message}"

CURRENT INVENTORY (what's actually in the house):
${inventoryText}

PEOPLE EATING — ${servingCount} SERVINGS:
${JSON.stringify(peopleProfiles, null, 2)}

⚠️ QUANTITY SCALING RULES — every ingredient MUST be scaled to exactly ${servingCount} servings:
• Dry pasta / rice / noodles : 80–100g per person  → total ~${servingCount * 90}g
• Meat / fish / poultry      : 150–180g per person  → total ~${servingCount * 165}g
• Each individual vegetable  : 80–120g per person   → total ~${servingCount * 100}g PER vegetable (NOT 500g of every veg)
• Legumes / pulses (tinned)  : ½ tin per 2 people
• Hard cheese (topping)      : 30–40g per person    → total ~${servingCount * 35}g
• Hard cheese (main sauce)   : 60–80g per person    → total ~${servingCount * 70}g
• Butter / oil               : 1 tbsp per 2 people
• Stock / sauce liquid       : 150–200ml per person → total ~${servingCount * 175}ml
• Tinned tomatoes            : 1 × 400g tin feeds 2–3 people
• Eggs                       : 1–2 per person depending on dish
STRICT: Do NOT default to "500g" for every ingredient. Calculate individually using the rules above.

INSTRUCTIONS:
- Make ONLY the changes the user has asked for. Keep everything else exactly the same.
- If they say to swap an ingredient, update it in BOTH the ingredients list AND the instructions.
- Whenever you write or adjust any ingredient quantity, apply the scaling rules above.
- If they ask about something not in stock, check the inventory before suggesting they buy it.
- If the user says they don't have something, remove it or suggest the best substitute from inventory.
- Never include ingredients someone is allergic to.
- Return the COMPLETE updated suggestion in the same JSON schema — do not omit any fields.
- Return ONLY valid JSON, no markdown fences, no explanation.

JSON schema to return:
{
  "primaryMeal": {
    "name": "string",
    "description": "string",
    "isExistingRecipe": boolean,
    "recipeId": number | null,
    "estimatedCost": number,
    "prepTime": number,
    "cookTime": number,
    "servings": number,
    "suitableFor": ["all"] or [name, ...],
    "missingIngredients": [{"name": "string", "quantity": number, "unit": "string", "estimatedCost": number}],
    "dietaryTags": ["string"],
    "ingredients": ["string — quantity scaled to ${servingCount} servings, e.g. '${servingCount * 90}g fusilli', '${servingCount * 100}g broccoli'"],
    "instructions": ["string"]
  },
  "alternativeMeal": { same shape } | null,
  "planningNotes": "string — briefly explain what changed and why",
  "totalEstimatedCost": number
}`;

    // Call Gemini
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();
    const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: "AI returned invalid response" }, { status: 500 });
    }

    let updatedSuggestion: any;
    try {
      updatedSuggestion = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // Persist the updated suggestion + update entry names/descriptions
    const primaryEntry = mealPlan.entries.find((e) => e.role === "main");
    const altEntry = mealPlan.entries.find((e) => e.role === "alternative");

    await prisma.mealPlan.update({
      where: { id },
      data: { aiSuggestion: JSON.stringify(updatedSuggestion) },
    });

    if (primaryEntry && updatedSuggestion.primaryMeal) {
      await prisma.mealPlanEntry.update({
        where: { id: primaryEntry.id },
        data: {
          suggestedName: updatedSuggestion.primaryMeal.name,
          suggestedDescription: updatedSuggestion.primaryMeal.description,
        },
      });
    }

    if (altEntry && updatedSuggestion.alternativeMeal) {
      await prisma.mealPlanEntry.update({
        where: { id: altEntry.id },
        data: {
          suggestedName: updatedSuggestion.alternativeMeal.name,
          suggestedDescription: updatedSuggestion.alternativeMeal.description,
        },
      });
    }

    return NextResponse.json({ suggestion: updatedSuggestion });
  } catch (error) {
    console.error("POST /api/meal-plans/[id]/refine error:", error);
    return NextResponse.json({ error: "Failed to refine meal" }, { status: 500 });
  }
}
