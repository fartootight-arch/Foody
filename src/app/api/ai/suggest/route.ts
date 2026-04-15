import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geminiModel } from "@/lib/gemini";
import { healthRatingLabel, parseJsonArray } from "@/lib/utils";

interface MissingIngredient {
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
}

interface MealSuggestion {
  name: string;
  description: string;
  isExistingRecipe: boolean;
  recipeId: number | null;
  estimatedCost: number;
  prepTime: number;
  cookTime: number;
  servings: number;
  suitableFor: string[];
  missingIngredients: MissingIngredient[];
  dietaryTags: string[];
  ingredients: string[];
  instructions: string[];
}

interface AISuggestionResponse {
  primaryMeal: MealSuggestion;
  alternativeMeal: MealSuggestion | null;
  planningNotes: string;
  totalEstimatedCost: number;
}

function getMockResponse(people: any[], healthRating: number): AISuggestionResponse {
  return {
    primaryMeal: {
      name: "Spaghetti Bolognese",
      description: "A classic Italian pasta dish with rich meat sauce",
      isExistingRecipe: false,
      recipeId: null,
      estimatedCost: 8.5,
      prepTime: 15,
      cookTime: 30,
      servings: people.length || 2,
      suitableFor: ["all"],
      missingIngredients: [],
      dietaryTags: [],
      ingredients: ["500g minced beef", "400g spaghetti", "1 tin chopped tomatoes", "1 onion", "2 garlic cloves", "olive oil"],
      instructions: [
        "Fry diced onion and garlic in olive oil until softened",
        "Add mince and brown all over",
        "Add chopped tomatoes and simmer for 20 minutes",
        "Cook spaghetti according to packet instructions",
        "Serve sauce over pasta",
      ],
    },
    alternativeMeal: null,
    planningNotes: `This is a demo suggestion (API key not configured). Health rating: ${healthRatingLabel(healthRating)}. Please add GEMINI_API_KEY to .env for real AI suggestions.`,
    totalEstimatedCost: 8.5,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, healthRating, shoppingWillingness, moodText, peopleIds, servings } = body;
    const shopLevel: number = typeof shoppingWillingness === "number" ? shoppingWillingness : 1;

    // Fetch people
    const people = await prisma.person.findMany({
      where: { id: { in: Array.isArray(peopleIds) ? peopleIds.map(Number) : [] } },
    });

    // Fetch ALL ingredients in stock (excluding Hello Fresh recipe-only items)
    const ingredients = await prisma.ingredient.findMany({
      where: {
        currentQuantity: { gt: 0 },
        category: { name: { not: "Hello Fresh" } },
      },
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });

    // Fetch all recipes with their ingredients
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: { include: { ingredient: true } },
      },
    });

    // Fetch budget info for current month
    const now = new Date(date ?? new Date());
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgetConfig = await prisma.budgetConfig.findFirst({
      where: { month, year },
    });

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    const budgetEntries = await prisma.budgetEntry.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
    });
    const totalSpent = budgetEntries.reduce((sum, e) => sum + e.amount, 0);
    const monthlyBudget = budgetConfig?.monthlyBudget ?? 350;
    const remaining = monthlyBudget - totalSpent;

    // If no API key, return mock response
    if (!process.env.GEMINI_API_KEY) {
      const suggestion = getMockResponse(people, healthRating ?? 3);
      const mealPlan = await createMealPlanFromSuggestion(suggestion, { date, healthRating, moodText, peopleIds, servings });
      return NextResponse.json({ mealPlan, suggestion });
    }

    // Build the prompt
    const peopleProfiles = people.map((p) => ({
      name: p.name,
      relationship: p.relationship,
      dietary: parseJsonArray(p.dietary),
      allergies: parseJsonArray(p.allergies),
      likes: parseJsonArray(p.likes),
      dislikes: parseJsonArray(p.dislikes),
    }));

    const inventoryList = ingredients.map((i) => ({
      name: i.name,
      quantity: i.currentQuantity,
      unit: i.unit,
      category: i.category.name,
      costPerUnit: i.costPerUnit,
    }));

    const recipeList = recipes.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      servings: r.servings,
      dietaryTags: r.dietaryTags ? r.dietaryTags.split(",").filter(Boolean) : [],
      ingredients: r.ingredients.map((ri) => ({
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
      })),
    }));

    // Shopping willingness directive — shapes the entire suggestion
    const shoppingDirective = [
      // 0 — not shopping
      `🚫 SHOPPING MODE: NOT SHOPPING — The user is NOT going to the shops at all today.
You MUST build the entire meal from the inventory below. Do NOT list any missing ingredients.
Be inventive and creative — improvise with what's there, combine things in interesting ways,
invent dishes that use up what's available. There is plenty to work with.
"missingIngredients" MUST be an empty array [].`,

      // 1 — rather not shop
      `😐 SHOPPING MODE: RATHER NOT SHOP — The user strongly prefers to use what's already in the cupboards.
Only suggest buying something if the meal would be genuinely poor without it, and limit to a maximum of 2 items.
Prioritise creativity with existing stock above everything else.
If you do list missing ingredients, explain in planningNotes why they are truly needed.`,

      // 2 — could manage
      `🤔 SHOPPING MODE: COULD MANAGE A SMALL SHOP — The user can pick up a few items if it really improves the meal.
Base the meal heavily on existing inventory. You may suggest up to 3–4 missing items if they meaningfully improve the dish.
Do not invent a meal that requires a full shop — the pantry should do most of the work.`,

      // 3 — happy to grab a few things
      `🛒 SHOPPING MODE: HAPPY TO GRAB A FEW THINGS — The user is willing to pop to the shops for the right meal.
Aim for a meal where most ingredients are already in stock, but a sensible shopping list of up to 6 items is fine.
Balance using existing inventory with suggesting a genuinely great meal.`,

      // 4 — happy to shop
      `🛍️ SHOPPING MODE: HAPPY TO SHOP — The user is happy to do a full shop.
Suggest the best possible meal for their preferences and health rating regardless of stock.
Provide a clear shopping list for anything needed. Still mention which ingredients they already have.`,
    ][shopLevel];

    // Group inventory by category for readability
    const inventoryByCategory: Record<string, typeof inventoryList> = {};
    for (const item of inventoryList) {
      if (!inventoryByCategory[item.category]) inventoryByCategory[item.category] = [];
      inventoryByCategory[item.category].push(item);
    }
    const inventoryFormatted = Object.entries(inventoryByCategory)
      .map(([cat, items]) =>
        `[${cat}]\n` + items.map((i) => `  • ${i.quantity} ${i.unit} ${i.name}`).join("\n")
      )
      .join("\n\n");

    const prompt = `You are Foody, a creative home chef and meal planning assistant.
Your goal is to suggest the perfect evening meal for this household.

${shoppingDirective}

────────────────────────────────────────
HARD RULES (never break these):
1. NEVER include an ingredient someone is allergic to.
2. If mixed dietary needs exist, suggest a MAIN + ALTERNATIVE unless one meal suits everyone.
3. Be practical about prep/cook time.
4. Return ONLY valid JSON — no markdown fences, no explanation outside the JSON.
5. You do NOT have to use saved recipes. Feel free to invent any dish using available ingredients.
   Saved recipes are provided as inspiration only.
────────────────────────────────────────

PEOPLE EATING — ${people.length || servings || 2} SERVINGS REQUIRED:
${JSON.stringify(peopleProfiles, null, 2)}

⚠️ QUANTITY SCALING RULES — apply these to EVERY ingredient (${people.length || servings || 2} servings):
• Dry pasta / rice / noodles : 80–100g per person → total ~${(people.length || servings || 2) * 90}g
• Meat / fish / poultry      : 150–180g per person → total ~${(people.length || servings || 2) * 165}g
• Each individual vegetable  : 80–120g per person  → total ~${(people.length || servings || 2) * 100}g PER vegetable type (do NOT use 500g of every veg)
• Legumes / pulses (tinned)  : ½ tin per 2 people  → 1 tin for ≤4, 2 tins for ≥5
• Hard cheese (topping)      : 30–40g per person   → total ~${(people.length || servings || 2) * 35}g
• Hard cheese (main sauce)   : 60–80g per person   → total ~${(people.length || servings || 2) * 70}g
• Butter / oil               : 1 tbsp per 2 people — do not over-scale
• Stock / sauce liquid       : 150–200ml per person → total ~${(people.length || servings || 2) * 175}ml
• Tinned tomatoes            : 1 × 400g tin feeds 2–3 people
• Eggs                       : 1–2 per person depending on dish
• Bread / wraps              : 1–2 per person

STRICT RULE: Do NOT default to "500g" for every ingredient. Calculate each quantity individually using the rules above.
STRICT RULE: If only 1–2 people are eating, quantities must be proportionally small.

HEALTH RATING: ${healthRating ?? 3}/5 (${healthRatingLabel(healthRating ?? 3)})
${moodText ? `MOOD/CRAVING: "${moodText}"` : "No specific craving specified."}

CURRENT INVENTORY (${inventoryList.length} items in stock):
${inventoryFormatted}

SAVED RECIPES FOR INSPIRATION (${recipeList.length} recipes — use if a good fit, or ignore and invent something):
${recipeList.map((r) => `• ${r.name} [${r.dietaryTags.join(", ") || "no tags"}] — needs: ${r.ingredients.map((i) => `${i.quantity}${i.unit} ${i.name}`).join(", ")}`).join("\n")}

BUDGET: £${remaining.toFixed(2)} remaining this month (£${monthlyBudget} total, £${totalSpent.toFixed(2)} spent)

────────────────────────────────────────
Return ONLY valid JSON matching this exact schema:
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
    "suitableFor": ["all"] or [personName, ...],
    "missingIngredients": [{"name": "string", "quantity": number, "unit": "string", "estimatedCost": number}],
    "dietaryTags": ["string"],
    "ingredients": ["string — include quantity scaled to exact servings e.g. '450g fusilli (5 × 90g)', '500g chicken breast (5 × 100g)', '400g broccoli (5 × 80g)'"],
    "instructions": ["string"]
  },
  "alternativeMeal": { same shape } | null,
  "planningNotes": "Brief note explaining your choices, what you're using up from the pantry, and any shopping context",
  "totalEstimatedCost": number
}`;

    let suggestion: AISuggestionResponse | null = null;
    let tokensUsed = 0;

    const tryParse = async (): Promise<AISuggestionResponse | null> => {
      const result = await geminiModel.generateContent(prompt);

      const text = result.response.text().trim();

      // Strip markdown fences if present
      const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");

      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      try {
        return JSON.parse(jsonMatch[0]) as AISuggestionResponse;
      } catch {
        return null;
      }
    };

    suggestion = await tryParse();
    if (!suggestion) {
      // Retry once
      suggestion = await tryParse();
    }

    if (!suggestion) {
      // Fall back to mock
      suggestion = getMockResponse(people, healthRating ?? 3);
    }

    // Create the meal plan
    const mealPlan = await createMealPlanFromSuggestion(
      suggestion,
      { date, healthRating, moodText, peopleIds, servings },
      JSON.stringify(suggestion),
      "gemini-2.0-flash",
      tokensUsed
    );

    return NextResponse.json({ mealPlan, suggestion });
  } catch (error) {
    console.error("POST /api/ai/suggest error:", error);
    return NextResponse.json({ error: "Failed to generate suggestion" }, { status: 500 });
  }
}

async function createMealPlanFromSuggestion(
  suggestion: AISuggestionResponse,
  params: {
    date?: string;
    healthRating?: number;
    moodText?: string;
    peopleIds?: number[];
    servings?: number;
  },
  aiSuggestionJson?: string,
  aiModel?: string,
  aiTokensUsed?: number
) {
  const { date, healthRating, moodText, peopleIds } = params;

  const mealPlan = await prisma.mealPlan.create({
    data: {
      date: date ? new Date(date) : new Date(),
      healthRating: Number(healthRating ?? 3),
      moodText: moodText ?? null,
      status: "draft",
      aiSuggestion: aiSuggestionJson ?? null,
      aiModel: aiModel ?? null,
      aiTokensUsed: aiTokensUsed ?? null,
      people: {
        create: Array.isArray(peopleIds)
          ? peopleIds.map((personId: number) => ({ personId: Number(personId) }))
          : [],
      },
      entries: {
        create: [
          {
            suggestedName: suggestion.primaryMeal.name,
            suggestedDescription: suggestion.primaryMeal.description,
            recipeId: suggestion.primaryMeal.recipeId ?? null,
            role: "main",
            forPeopleIds: JSON.stringify(
              suggestion.primaryMeal.suitableFor?.includes("all")
                ? (peopleIds ?? [])
                : []
            ),
            accepted: true,
            sortOrder: 0,
          },
          ...(suggestion.alternativeMeal
            ? [
                {
                  suggestedName: suggestion.alternativeMeal.name,
                  suggestedDescription: suggestion.alternativeMeal.description,
                  recipeId: suggestion.alternativeMeal.recipeId ?? null,
                  role: "alternative",
                  forPeopleIds: JSON.stringify([]),
                  accepted: true,
                  sortOrder: 1,
                },
              ]
            : []),
        ],
      },
    },
    include: {
      people: { include: { person: true } },
      entries: {
        include: { recipe: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return mealPlan;
}
