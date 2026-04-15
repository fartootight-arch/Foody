/**
 * seed-recipes-from-images.ts
 * Reads Hello Fresh recipe card photos, uses Gemini Vision to extract
 * recipe data, then seeds them into Foody's database.
 *
 * Run with:
 *   npx ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' prisma/seed-recipes-from-images.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

dotenv.config();

const DB_PATH = path.join(process.cwd(), "prisma", "foody.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${DB_PATH}` });
const prisma = new PrismaClient({ adapter } as any);

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

const IMAGE_DIR = "C:\\Users\\Jason\\My Drive\\Other\\Food";

// ── helpers ──────────────────────────────────────────────────────────────────

function imageToBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString("base64");
}

function mimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".png" ? "image/png" : "image/jpeg";
}

function stripFences(text: string): string {
  // Strip markdown fences and any text before the first [ or after the last ]
  const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = stripped.indexOf("[");
  const end = stripped.lastIndexOf("]");
  if (start !== -1 && end !== -1) {
    return stripped.slice(start, end + 1);
  }
  return stripped;
}

// ── Gemini extraction ─────────────────────────────────────────────────────────

async function extractRecipesFromImages(imagePaths: string[]): Promise<any[]> {
  const parts: any[] = [
    {
      text: `You are reading Hello Fresh recipe cards. Some images show the FRONT (dish name, photo, card number, ingredient thumbnails) and some show the BACK (full ingredient list with quantities, step-by-step cooking instructions).

Analyse ALL images provided and extract EVERY distinct recipe you can identify. Match fronts to backs by card number or recipe name.

Return a JSON array of recipe objects. Each object must have:
{
  "name": "Full recipe name",
  "description": "One sentence description",
  "prepTime": <number in minutes>,
  "cookTime": <number in minutes>,
  "servings": <number, default 2>,
  "dietaryTags": "comma-separated tags e.g. High Protein, Low Carb, Calorie Smart",
  "instructions": "Full step-by-step instructions as a single string with numbered steps",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": <number>,
      "unit": "g / ml / tbsp / tsp / unit / bunch etc",
      "notes": "optional prep note e.g. finely chopped"
    }
  ]
}

Extract quantities for 2 servings. If you can only see one side of a card, do your best with available info.
Return ONLY the JSON array, no markdown fences, no explanation.`,
    },
  ];

  // Add all images
  for (const imgPath of imagePaths) {
    parts.push({
      inlineData: {
        mimeType: mimeType(imgPath),
        data: imageToBase64(imgPath),
      },
    });
  }

  console.log(`Sending ${imagePaths.length} images to Gemini Vision...`);
  const result = await model.generateContent({ contents: [{ role: "user", parts }] });
  const text = result.response.text();
  const cleaned = stripFences(text);

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON parse failed, raw response:\n", text.slice(0, 500));
    throw new Error("Gemini returned invalid JSON");
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getOrCreateCategory(name: string): Promise<number> {
  let cat = await prisma.ingredientCategory.findFirst({ where: { name } });
  if (!cat) {
    cat = await prisma.ingredientCategory.create({ data: { name } });
  }
  return cat.id;
}

async function getOrCreateIngredient(
  name: string,
  categoryId: number,
  unit: string
): Promise<number> {
  const normName = name.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  let ing = await prisma.ingredient.findFirst({
    where: { name: { equals: normName } },
  });
  if (!ing) {
    ing = await prisma.ingredient.create({
      data: {
        name: normName,
        categoryId,
        unit,
        packageCost: 0,
        packageSize: 1,
        costPerUnit: 0,
        currentQuantity: 0,
        minQuantity: 0,
      },
    });
  }
  return ing.id;
}

// ── Seed one recipe ───────────────────────────────────────────────────────────

async function seedRecipe(recipe: any): Promise<void> {
  const name = recipe.name?.trim();
  if (!name) return;

  // Skip if already exists
  const existing = await prisma.recipe.findFirst({ where: { name } });
  if (existing) {
    console.log(`  ⏭  Skipping (already exists): ${name}`);
    return;
  }

  console.log(`  ✓  Seeding: ${name}`);

  const categoryId = await getOrCreateCategory("Hello Fresh");

  // Create recipe
  const created = await prisma.recipe.create({
    data: {
      name,
      description: recipe.description || "",
      instructions: recipe.instructions || "",
      prepTime: recipe.prepTime || 10,
      cookTime: recipe.cookTime || 20,
      servings: recipe.servings || 2,
      source: "Hello Fresh",
      dietaryTags: recipe.dietaryTags || "",
      imageUrl: null,
    },
  });

  // Create ingredients
  for (const ing of recipe.ingredients || []) {
    if (!ing.name) continue;
    try {
      const unit = (ing.unit || "unit").toLowerCase();
      const ingredientId = await getOrCreateIngredient(ing.name, categoryId, unit);

      // Check for duplicate RecipeIngredient
      const dupCheck = await prisma.recipeIngredient.findFirst({
        where: { recipeId: created.id, ingredientId },
      });
      if (dupCheck) continue;

      await prisma.recipeIngredient.create({
        data: {
          recipeId: created.id,
          ingredientId,
          quantity: typeof ing.quantity === "number" ? ing.quantity : parseFloat(ing.quantity) || 1,
          unit,
          notes: ing.notes || null,
          optional: false,
        },
      });
    } catch (e: any) {
      console.warn(`    Warning: could not add ingredient "${ing.name}": ${e.message}`);
    }
  }
}

const BATCH_SIZE = 15;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🍽️  Foody Recipe Card Importer");
  console.log("================================\n");

  // Get all images (readdirSync is non-recursive; 'done' sub-folder is excluded
  // automatically because it has no image extension)
  const files = fs
    .readdirSync(IMAGE_DIR)
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
    .sort()
    .map((f) => path.join(IMAGE_DIR, f));

  if (files.length === 0) {
    console.error("No images found in", IMAGE_DIR);
    process.exit(1);
  }

  console.log(`Found ${files.length} images in ${IMAGE_DIR}`);

  // Process in batches to stay within Gemini's per-request limits
  const batches = chunkArray(files, BATCH_SIZE);
  console.log(`Processing in ${batches.length} batch(es) of up to ${BATCH_SIZE} images each\n`);

  const allRecipes: any[] = [];

  for (let i = 0; i < batches.length; i++) {
    console.log(`── Batch ${i + 1}/${batches.length} (${batches[i].length} images) ──`);
    const recipes = await extractRecipesFromImages(batches[i]);
    console.log(`  Extracted ${recipes.length} recipe(s):`);
    recipes.forEach((r) => console.log(`    • ${r.name}`));
    allRecipes.push(...recipes);
    console.log("");
  }

  console.log(`\nTotal extracted: ${allRecipes.length} recipe(s). Seeding into DB...\n`);

  // Seed each recipe (duplicates are skipped inside seedRecipe)
  for (const recipe of allRecipes) {
    await seedRecipe(recipe);
  }

  console.log(`\n✅ Done! ${allRecipes.length} recipes processed.\n`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
