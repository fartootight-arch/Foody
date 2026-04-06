import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: `file:${path.join(process.cwd(), "prisma", "foody.db")}` });
const prisma = new PrismaClient({ adapter } as any);

const categories = [
  { name: "Produce", color: "#22c55e" },
  { name: "Dairy", color: "#3b82f6" },
  { name: "Meat", color: "#ef4444" },
  { name: "Fish & Seafood", color: "#06b6d4" },
  { name: "Pantry", color: "#f59e0b" },
  { name: "Frozen", color: "#8b5cf6" },
  { name: "Bakery", color: "#d97706" },
  { name: "Condiments", color: "#ec4899" },
  { name: "Drinks", color: "#14b8a6" },
  { name: "Snacks", color: "#f97316" },
];

async function main() {
  console.log("Seeding categories...");
  for (const cat of categories) {
    await (prisma as any).ingredientCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const now = new Date();
  await (prisma as any).budgetConfig.upsert({
    where: { month_year: { month: now.getMonth() + 1, year: now.getFullYear() } },
    update: {},
    create: {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      monthlyBudget: 350,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
