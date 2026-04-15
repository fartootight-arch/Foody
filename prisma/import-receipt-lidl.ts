/**
 * import-receipt-lidl.ts
 * Manually parsed Lidl receipt (Blackheath, 06.04.26)
 * Fixes the previous Gemini import (wrong quantities) and adds all missed items.
 *
 * Run with:
 *   npx ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' prisma/import-receipt-lidl.ts
 */

import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const DB_PATH = path.join(process.cwd(), "prisma", "foody.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${DB_PATH}` });
const prisma = new PrismaClient({ adapter } as any);

// ── Receipt items ─────────────────────────────────────────────────────────────
// Each entry is either:
//   { id: existingIngredientId, addQty: number }          — update existing
//   { name, addQty, unit, category }                      — create new if not found

type ReceiptItem =
  | { id: number; addQty: number; label: string }
  | { name: string; addQty: number; unit: string; category: string; label: string };

const RECEIPT_ITEMS: ReceiptItem[] = [
  // ── BAKED GOODS ─────────────────────────────────────────────────────────────
  { name: "Sweet Buns",           addQty: 1,   unit: "pack",   category: "Bakery",    label: "Sweet Buns Assorted" },
  // Plain Brioche Buns → id:59 "Brioche Buns" — already correctly imported
  { name: "Hot Cross Buns",       addQty: 6,   unit: "whole",  category: "Bakery",    label: "6 Hot Cross Buns" },
  { name: "Sub Rolls",            addQty: 2,   unit: "whole",  category: "Bakery",    label: "Sub Rolls x2" },
  { name: "White Bread Loaf",     addQty: 1,   unit: "whole",  category: "Bakery",    label: "Soft Medium White Loaf" },

  // ── DRINKS ──────────────────────────────────────────────────────────────────
  { name: "Mixed Fruit Cider",        addQty: 1, unit: "can",    category: "Drinks", label: "Mixed Fruit Cider" },
  { name: "Strawberry & Lime Cider",  addQty: 1, unit: "can",    category: "Drinks", label: "Cider Strawb & Lime" },
  { name: "Passionfruit Martini",     addQty: 2, unit: "can",    category: "Drinks", label: "Passionfruit Martini x2" },
  { name: "Raspberry Mojito",         addQty: 2, unit: "can",    category: "Drinks", label: "Raspberry Mojito x2" },
  { name: "Moscato Wine",             addQty: 1, unit: "bottle", category: "Drinks", label: "Moscato Gold Blend" },
  { name: "Summer Fruits Cordial",    addQty: 1, unit: "bottle", category: "Drinks", label: "Summer Fruit" },
  { name: "Fruit & Barley Squash",    addQty: 1, unit: "bottle", category: "Drinks", label: "Fruit & Barley Sumfr" },

  // ── DAIRY / CHILLED ──────────────────────────────────────────────────────────
  { name: "Spreadable Butter",    addQty: 1,   unit: "pack",   category: "Dairy",    label: "Spreadable Butter" },
  { name: "Cooked Ham Slices",    addQty: 1,   unit: "pack",   category: "Dairy",    label: "Cooked Ham Slices" },
  { name: "Coleslaw",             addQty: 1,   unit: "tub",    category: "Dairy",    label: "Reduced Fat Coleslaw" },
  { name: "Lighter Mayonnaise",   addQty: 1,   unit: "jar",    category: "Condiments", label: "Lighter Mayonnaise" },

  // ── TINS / CANS ──────────────────────────────────────────────────────────────
  { id: 54,  addQty: 2,   label: "Simply Tuna in Brine x2" },           // Tuna Chunks
  { name: "Cream of Chicken Soup", addQty: 1, unit: "can", category: "Pantry", label: "Cream of Chicken Soup" },

  // ── FROZEN ───────────────────────────────────────────────────────────────────
  { name: "Sweet Potato Fries",   addQty: 1,   unit: "pack",   category: "Frozen",   label: "Sweet Potatoe Fries" },

  // ── PANTRY ───────────────────────────────────────────────────────────────────
  { id: 72,  addQty: 2,   label: "Microwave Long Grain Rice x2" },       // Microwave Rice
  { id: 70,  addQty: 4,   label: "InstantNoodles Curry x4" },            // Curry Instant Noodles
  { name: "Microwave Egg Fried Rice", addQty: 2, unit: "pack", category: "Pantry", label: "Microwave Egg Fried Rice x2" },
  { name: "Jelly Pots",           addQty: 1,   unit: "pack",   category: "Pantry",   label: "Hartley's Jelly Pots" },

  // ── PRODUCE ──────────────────────────────────────────────────────────────────
  { name: "Mixed Peppers",        addQty: 1,   unit: "pack",   category: "Produce",  label: "Family Pack Peppers" },
  { id: 9,   addQty: 4,   label: "Tomatoes 0082485" },                   // Salad Tomatoes
  { name: "Radish",               addQty: 1,   unit: "bunch",  category: "Produce",  label: "Radish" },
  { name: "Romaine Lettuce",      addQty: 2,   unit: "whole",  category: "Produce",  label: "Romaine Hearts" },
  { id: 5,   addQty: 6,   label: "Red Apples 0080230" },                 // Red Apples
  { name: "Swede",                addQty: 1,   unit: "whole",  category: "Produce",  label: "Swede Loose" },
  { name: "Fresh Beetroot",       addQty: 1,   unit: "whole",  category: "Produce",  label: "Beetroot" },

  // ── MEAT ─────────────────────────────────────────────────────────────────────
  { name: "Pork Loin Steaks",     addQty: 480, unit: "g",      category: "Meat",     label: "Pork Loin Steaks 480g" },

  // ── QUANTITY CORRECTIONS (previous Gemini import got these badly wrong) ──────
  { id: 4,   addQty: 1998, label: "Peeled Potatoes x2 — correction (was +2g, should be +2000g)" },  // Potatoes
  { id: 18,  addQty: 399,  label: "Mild Cheddar — correction (was +1g, should be +400g)" },          // British Mild Cheddar
  { id: 7,   addQty: 249,  label: "Mushrooms — correction (was +1g, should be +250g)" },             // Mushrooms
  { id: 19,  addQty: 9,    label: "Cheese Slices — correction (was +1 slice, should be +10)" },      // Cheese Singles
  { id: 11,  addQty: 2,    label: "Onions net — correction (was +1, net has ~3)" },                  // White Onions
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getOrCreateCategory(name: string): Promise<number> {
  let cat = await prisma.ingredientCategory.findFirst({ where: { name } });
  if (!cat) cat = await prisma.ingredientCategory.create({ data: { name } });
  return cat.id;
}

async function main() {
  console.log("\n🧾  Lidl Receipt Import (manual parse)");
  console.log("========================================\n");

  let updated = 0;
  let created = 0;

  for (const item of RECEIPT_ITEMS) {
    if ("id" in item) {
      // Update existing ingredient by ID
      const ing = await prisma.ingredient.findUnique({ where: { id: item.id } });
      if (!ing) {
        console.warn(`  ⚠️  ID ${item.id} not found — skipping`);
        continue;
      }
      const newQty = ing.currentQuantity + item.addQty;
      await prisma.ingredient.update({ where: { id: ing.id }, data: { currentQuantity: newQty } });
      console.log(`  ✓  ${ing.name.padEnd(35)} ${ing.currentQuantity} → ${newQty} ${ing.unit}   (${item.label})`);
      updated++;
    } else {
      // Find or create by name
      let ing = await prisma.ingredient.findFirst({ where: { name: item.name } });
      if (ing) {
        const newQty = ing.currentQuantity + item.addQty;
        await prisma.ingredient.update({ where: { id: ing.id }, data: { currentQuantity: newQty } });
        console.log(`  ✓  ${ing.name.padEnd(35)} ${ing.currentQuantity} → ${newQty} ${ing.unit}   (${item.label})`);
        updated++;
      } else {
        const categoryId = await getOrCreateCategory(item.category);
        await prisma.ingredient.create({
          data: {
            name: item.name,
            categoryId,
            unit: item.unit,
            packageCost: 0,
            packageSize: 1,
            costPerUnit: 0,
            currentQuantity: item.addQty,
            minQuantity: 0,
          },
        });
        console.log(`  ➕  ${item.name.padEnd(35)} created (${item.addQty} ${item.unit})   (${item.label})`);
        created++;
      }
    }
  }

  console.log(`\n✅  Done! ${updated} updated · ${created} created\n`);
}

main()
  .catch((e) => { console.error("Fatal:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
