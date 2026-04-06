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
    const { date, healthRating, moodText, peopleIds, servings } = body;

    // Fetch people
    const people = await prisma.person.findMany({
      where: { id: { in: Array.isArray(peopleIds) ? peopleIds.map(Number) : [] } },
    });

    // Fetch top 50 ingredients in stock
    const ingredients = await prisma.ingredient.findMany({
      where: { currentQuantity: { gt: 0 } },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
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

    const prompt = `You are Foody, an expert home meal planner and chef assistant. Your job is to suggest the perfect evening meal based on the household's ingredients, dietary needs, and mood.

RULES:
1) NEVER suggest a meal containing an ingredient someone is allergic to.
2) If the group has mixed dietary requirements, suggest a MAIN meal plus an ALTERNATIVE for the person with restrictions - unless one meal satisfies everyone.
3) Prefer recipes using ingredients already in stock.
4) Flag missing ingredients.
5) Be practical about prep/cook time.
6) Return ONLY valid JSON.

Please suggest the perfect meal for tonight.

PEOPLE EATING (${people.length || servings || 2} people):
${JSON.stringify(peopleProfiles, null, 2)}

HEALTH RATING: ${healthRating ?? 3}/5 (${healthRatingLabel(healthRating ?? 3)})
${moodText ? `MOOD/CRAVING: ${moodText}` : ""}
SERVINGS NEEDED: ${servings ?? people.length ?? 2}

CURRENT INVENTORY (${inventoryList.length} items):
${JSON.stringify(inventoryList, null, 2)}

KNOWN RECIPES (${recipeList.length} recipes):
${JSON.stringify(recipeList, null, 2)}

BUDGET: £${remaining.toFixed(2)} remaining this month (£${monthlyBudget} total, £${totalSpent.toFixed(2)} spent)

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
    "suitableFor": ["all"] or [personName...],
    "missingIngredients": [{"name": "string", "quantity": number, "unit": "string", "estimatedCost": number}],
    "dietaryTags": ["string"],
    "ingredients": ["string"],
    "instructions": ["string"]
  },
  "alternativeMeal": { same shape as primaryMeal } | null,
  "planningNotes": "string",
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
