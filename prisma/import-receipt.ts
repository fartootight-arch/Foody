/**
 * import-receipt.ts
 * Reads a supermarket receipt photo, extracts food items using Gemini Vision,
 * matches them to existing Foody ingredients, and updates currentQuantity.
 *
 * Run with:
 *   npx ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' prisma/import-receipt.ts
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

const RECEIPT_IMAGE = "C:\\Users\\Jason\\My Drive\\Other\\Food\\2026.04.06_13001151120260406165504.jpg.png";

// ── helpers ───────────────────────────────────────────────────────────────────

function imageToBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString("base64");
}

function mimeType(filePath: string): string {
  // treat .jpg.png as jpeg since it's likely a Pixel photo renamed
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png") && !lower.endsWith(".jpg.png")) return "image/png";
  return "image/jpeg";
}

function stripFences(text: string): string {
  const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = stripped.indexOf("[");
  const end = stripped.lastIndexOf("]");
  if (start !== -1 && end !== -1) return stripped.slice(start, end + 1);
  return stripped;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🧾  Foody Receipt Importer");
  console.log("===========================\n");

  if (!fs.existsSync(RECEIPT_IMAGE)) {
    console.error("Receipt image not found:", RECEIPT_IMAGE);
    process.exit(1);
  }

  // Load existing ingredients so Gemini can match against them
  const existing = await prisma.ingredient.findMany({
    select: { id: true, name: true, unit: true, currentQuantity: true },
    orderBy: { id: "asc" },
  });

  const ingredientList = existing
    .map((i) => `${i.id}|${i.name}|${i.unit}`)
    .join("\n");

  console.log(`Loaded ${existing.length} existing ingredients from DB`);
  console.log("Sending receipt to Gemini Vision...\n");

  const prompt = `You are reading a UK supermarket receipt photo.

Step 1 – Extract every food/drink/household item from the receipt. Ignore non-food items, loyalty points, totals, and store info.

Step 2 – For each item, work out a sensible quantity to add to the pantry (e.g. if "Whole Milk 2L" → quantity: 2000, unit: "ml"; if "Free Range Eggs 12" → quantity: 12, unit: "whole"; if "Cheddar 400g" → quantity: 400, unit: "g"; if "Baked Beans 4-pack" → quantity: 4, unit: "can").

Step 3 – Try to match each item to one of the existing pantry ingredients listed below (match by ID). If a good match exists use the existing ID. If no match, set existingId to null — a new ingredient will be created.

Existing pantry ingredients (format: id|name|unit):
${ingredientList}

Return a JSON array. Each element:
{
  "receiptName": "exact name on receipt",
  "existingId": <number or null>,
  "ingredientName": "clean name to use if creating new",
  "quantity": <number to ADD to current stock>,
  "unit": "unit string"
}

Return ONLY the JSON array, no markdown, no explanation.`;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType(RECEIPT_IMAGE),
              data: imageToBase64(RECEIPT_IMAGE),
            },
          },
        ],
      },
    ],
  });

  const text = result.response.text();
  const cleaned = stripFences(text);

  let items: any[];
  try {
    items = JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON parse failed. Raw response:\n", text.slice(0, 800));
    throw new Error("Gemini returned invalid JSON");
  }

  console.log(`Gemini found ${items.length} item(s) on the receipt:\n`);

  let updated = 0;
  let created = 0;

  for (const item of items) {
    const qty = typeof item.quantity === "number" ? item.quantity : parseFloat(item.quantity) || 1;

    if (item.existingId) {
      // Update existing ingredient
      const ing = existing.find((e) => e.id === item.existingId);
      if (ing) {
        const newQty = ing.currentQuantity + qty;
        await prisma.ingredient.update({
          where: { id: ing.id },
          data: { currentQuantity: newQty },
        });
        console.log(`  ✓  Updated: ${ing.name}  ${ing.currentQuantity} → ${newQty} ${ing.unit}  (receipt: "${item.receiptName}")`);
        updated++;
      }
    } else {
      // Create new ingredient
      const name = item.ingredientName?.trim();
      if (!name) continue;

      // Check it doesn't already exist under a slightly different name
      const dupe = await prisma.ingredient.findFirst({ where: { name } });
      if (dupe) {
        const newQty = dupe.currentQuantity + qty;
        await prisma.ingredient.update({
          where: { id: dupe.id },
          data: { currentQuantity: newQty },
        });
        console.log(`  ✓  Updated (found): ${dupe.name}  ${dupe.currentQuantity} → ${newQty} ${dupe.unit}`);
        updated++;
        continue;
      }

      // Get or create a "Supermarket" category
      let cat = await prisma.ingredientCategory.findFirst({ where: { name: "Supermarket" } });
      if (!cat) {
        cat = await prisma.ingredientCategory.create({ data: { name: "Supermarket" } });
      }

      await prisma.ingredient.create({
        data: {
          name,
          categoryId: cat.id,
          unit: item.unit || "unit",
          packageCost: 0,
          packageSize: 1,
          costPerUnit: 0,
          currentQuantity: qty,
          minQuantity: 0,
        },
      });
      console.log(`  ➕  Created:  ${name}  (${qty} ${item.unit})  (receipt: "${item.receiptName}")`);
      created++;
    }
  }

  console.log(`\n✅ Done!  ${updated} updated · ${created} new ingredients created\n`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
