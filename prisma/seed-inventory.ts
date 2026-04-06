import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: `file:${path.join(process.cwd(), "prisma", "foody.db")}` });
const prisma = new PrismaClient({ adapter } as any);
const db = prisma as any;

const extraCategories = [
  { name: "Spices & Baking", color: "#a16207" },
  { name: "Pasta & Grains",  color: "#ca8a04" },
];

// packageCost = £ price you pay at the shop
// packageSize = how many units (of `unit`) that buys
// costPerUnit is derived: packageCost / packageSize
//
// Examples:
//   Carrots: unit=g, packageCost=0.50, packageSize=500  → £0.001/g
//   Eggs:    unit=whole, packageCost=3.90, packageSize=15 → £0.26/egg
//   Ketchup: unit=bottle, packageCost=2.00, packageSize=1 → £2.00/bottle
const items: {
  name: string;
  category: string;
  unit: string;
  qty: number;
  minQty?: number;
  packageCost: number;
  packageSize: number;
  notes?: string;
}[] = [
  // ─── FRESH VEG & FRUIT ────────────────────────────────────────────────────
  { name: "Courgettes",              category: "Produce",         unit: "whole",   qty: 3,    minQty: 1,   packageCost: 1.05, packageSize: 3    }, // 3 for £1.05
  { name: "Carrots",                 category: "Produce",         unit: "g",       qty: 500,  minQty: 100, packageCost: 0.50, packageSize: 500  }, // 500g bag £0.50
  { name: "Beansprouts",             category: "Produce",         unit: "bag",     qty: 1,    minQty: 0,   packageCost: 0.75, packageSize: 1    },
  { name: "Potatoes",                category: "Produce",         unit: "g",       qty: 2500, minQty: 500, packageCost: 1.50, packageSize: 2500 }, // 2.5kg £1.50
  { name: "Red Apples",              category: "Produce",         unit: "whole",   qty: 6,    minQty: 2,   packageCost: 1.80, packageSize: 6    }, // 6 pack £1.80
  { name: "Bananas",                 category: "Produce",         unit: "whole",   qty: 5,    minQty: 2,   packageCost: 0.75, packageSize: 5    }, // bunch £0.75
  { name: "Mushrooms",               category: "Produce",         unit: "g",       qty: 250,  minQty: 0,   packageCost: 0.75, packageSize: 250  }, // 250g £0.75
  { name: "Cherry Tomatoes",         category: "Produce",         unit: "punnet",  qty: 1,    minQty: 0,   packageCost: 1.20, packageSize: 1    },
  { name: "Salad Tomatoes",          category: "Produce",         unit: "whole",   qty: 4,    minQty: 0,   packageCost: 1.00, packageSize: 4    }, // 4 pack £1.00
  { name: "Red Onions",              category: "Produce",         unit: "whole",   qty: 3,    minQty: 1,   packageCost: 0.75, packageSize: 3    }, // net of 3
  { name: "White Onions",            category: "Produce",         unit: "whole",   qty: 4,    minQty: 1,   packageCost: 0.80, packageSize: 4    },

  // ─── MEAT ─────────────────────────────────────────────────────────────────
  { name: "Chicken Thigh Fillets",   category: "Meat",            unit: "g",       qty: 600,  minQty: 0,   packageCost: 4.80, packageSize: 600  },
  { name: "Smoked Gammon Steaks",    category: "Meat",            unit: "pack",    qty: 1,    minQty: 0,   packageCost: 2.50, packageSize: 1    },
  { name: "Pork Mince 5%",           category: "Meat",            unit: "g",       qty: 500,  minQty: 0,   packageCost: 3.80, packageSize: 500  },
  { name: "Smoked Salami Slices",    category: "Meat",            unit: "pack",    qty: 1,    minQty: 0,   packageCost: 1.50, packageSize: 1    },
  { name: "Sausage Rolls",           category: "Meat",            unit: "whole",   qty: 6,    minQty: 0,   packageCost: 2.70, packageSize: 6    }, // 6-pack

  // ─── DAIRY ────────────────────────────────────────────────────────────────
  { name: "Free Range Eggs",         category: "Dairy",           unit: "whole",   qty: 15,   minQty: 4,   packageCost: 3.90, packageSize: 15   },
  { name: "British Mild Cheddar",    category: "Dairy",           unit: "g",       qty: 400,  minQty: 50,  packageCost: 3.00, packageSize: 400  },
  { name: "Cheese Singles",          category: "Dairy",           unit: "slice",   qty: 10,   minQty: 0,   packageCost: 2.00, packageSize: 10   },
  { name: "Skimmed Milk",            category: "Dairy",           unit: "ml",      qty: 2272, minQty: 500, packageCost: 1.35, packageSize: 2272, notes: "4 pints" },
  { name: "Barista Oat Milk",        category: "Dairy",           unit: "ml",      qty: 1000, minQty: 0,   packageCost: 1.50, packageSize: 1000 },
  { name: "Low Fat Cream Cheese",    category: "Dairy",           unit: "g",       qty: 200,  minQty: 0,   packageCost: 1.20, packageSize: 200  },
  { name: "Cheddar Cheese",          category: "Dairy",           unit: "g",       qty: 200,  minQty: 50,  packageCost: 1.60, packageSize: 200  },
  { name: "Grana Padano",            category: "Dairy",           unit: "g",       qty: 100,  minQty: 0,   packageCost: 1.50, packageSize: 100  },
  { name: "Natural Yoghurt",         category: "Dairy",           unit: "g",       qty: 500,  minQty: 0,   packageCost: 1.50, packageSize: 500  },
  { name: "Almond Barista Milk",     category: "Dairy",           unit: "ml",      qty: 1000, minQty: 0,   packageCost: 1.80, packageSize: 1000 },

  // ─── FROZEN ───────────────────────────────────────────────────────────────
  { name: "BBQ Pulled Pork",         category: "Frozen",          unit: "g",       qty: 250,  minQty: 0,   packageCost: 3.00, packageSize: 250  },
  { name: "Frozen Sausages",         category: "Frozen",          unit: "pack",    qty: 1,    minQty: 0,   packageCost: 2.00, packageSize: 1    },
  { name: "Frozen Burgers",          category: "Frozen",          unit: "pack",    qty: 1,    minQty: 0,   packageCost: 2.50, packageSize: 1    },
  { name: "Frozen Onion Rings",      category: "Frozen",          unit: "pack",    qty: 1,    minQty: 0,   packageCost: 1.50, packageSize: 1    },
  { name: "Frozen Chips",            category: "Frozen",          unit: "pack",    qty: 1,    minQty: 0,   packageCost: 1.50, packageSize: 1    },
  { name: "Frozen Peas",             category: "Frozen",          unit: "g",       qty: 500,  minQty: 100, packageCost: 1.00, packageSize: 500  },
  { name: "Oriental Chicken Noodles Stir Fry", category: "Frozen", unit: "pack",  qty: 1,    minQty: 0,   packageCost: 2.50, packageSize: 1,   notes: "Iceland" },

  // ─── TINNED TOMATOES ──────────────────────────────────────────────────────
  { name: "Tomato Passata",          category: "Pantry",          unit: "can",     qty: 2,    minQty: 1,   packageCost: 0.65, packageSize: 1,   notes: "Baresa 500g" },
  { name: "Chopped Tomatoes",        category: "Pantry",          unit: "can",     qty: 2,    minQty: 1,   packageCost: 0.45, packageSize: 1    },
  { name: "Peeled Plum Tomatoes",    category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.55, packageSize: 1    },

  // ─── BEANS & PULSES ───────────────────────────────────────────────────────
  { name: "Mixed Beans",             category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.70, packageSize: 1    },
  { name: "Black Beans",             category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.75, packageSize: 1    },
  { name: "Red Kidney Beans",        category: "Pantry",          unit: "can",     qty: 2,    minQty: 1,   packageCost: 0.60, packageSize: 1    },
  { name: "Baked Beans",             category: "Pantry",          unit: "can",     qty: 2,    minQty: 1,   packageCost: 0.55, packageSize: 1    },
  { name: "Green Lentils",           category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.75, packageSize: 1    },

  // ─── TINNED SOUPS ─────────────────────────────────────────────────────────
  { name: "Vegetable Soup",          category: "Pantry",          unit: "can",     qty: 4,    minQty: 1,   packageCost: 0.65, packageSize: 1,   notes: "Newgate" },
  { name: "Minestrone Soup",         category: "Pantry",          unit: "can",     qty: 2,    minQty: 0,   packageCost: 0.65, packageSize: 1,   notes: "Newgate" },
  { name: "Lentil Soup",             category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.65, packageSize: 1,   notes: "Newgate" },
  { name: "Chicken & Veg Curry Can", category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 1.20, packageSize: 1    },
  { name: "Heinz Big Soup",          category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 1.80, packageSize: 1    },
  { name: "Heinz Spaghetti",         category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 1.00, packageSize: 1    },
  { name: "Chunky Soup",             category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.85, packageSize: 1,   notes: "Tesco" },

  // ─── TINNED VEG & FRUIT ───────────────────────────────────────────────────
  { name: "Tinned New Potatoes",     category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.65, packageSize: 1    },
  { name: "Tinned Garden Peas",      category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.55, packageSize: 1    },
  { name: "Tinned Marrowfat Peas",   category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.65, packageSize: 1    },
  { name: "Tinned Peach Slices",     category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.75, packageSize: 1,   notes: "Freshona" },
  { name: "Tinned Fruit Cocktail",   category: "Pantry",          unit: "can",     qty: 1,    minQty: 0,   packageCost: 0.85, packageSize: 1,   notes: "Freshona" },

  // ─── FISH & PICKLES ───────────────────────────────────────────────────────
  { name: "Tuna Chunks",             category: "Fish & Seafood",  unit: "can",     qty: 2,    minQty: 1,   packageCost: 1.25, packageSize: 1    },
  { name: "Pickled Cockles",         category: "Fish & Seafood",  unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.80, packageSize: 1,   notes: "Parsons" },
  { name: "Pickled Beetroot",        category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.20, packageSize: 1    },
  { name: "Sliced Lemons in Brine",  category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 2.50, packageSize: 1,   notes: "Opies" },
  { name: "Capers",                  category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.50, packageSize: 1    },

  // ─── BAKERY ───────────────────────────────────────────────────────────────
  { name: "Brioche Buns",            category: "Bakery",          unit: "pack",    qty: 1,    minQty: 0,   packageCost: 1.50, packageSize: 1    },
  { name: "Tortilla Wraps",          category: "Bakery",          unit: "pack",    qty: 1,    minQty: 0,   packageCost: 1.20, packageSize: 1    },
  { name: "Garlic & Coriander Naan", category: "Bakery",          unit: "pack",    qty: 1,    minQty: 0,   packageCost: 1.50, packageSize: 1    },
  { name: "Jus-Rol Pastry",          category: "Bakery",          unit: "pack",    qty: 1,    minQty: 0,   packageCost: 3.50, packageSize: 1    },

  // ─── PASTA ────────────────────────────────────────────────────────────────
  { name: "Linguine",                category: "Pasta & Grains",  unit: "g",       qty: 500,  minQty: 0,   packageCost: 1.50, packageSize: 500,  notes: "Deluxe" },
  { name: "Fusilli",                 category: "Pasta & Grains",  unit: "g",       qty: 500,  minQty: 0,   packageCost: 0.85, packageSize: 500  },
  { name: "Spaghetti",               category: "Pasta & Grains",  unit: "g",       qty: 500,  minQty: 100, packageCost: 0.85, packageSize: 500  },
  { name: "Tagliatelle",             category: "Pasta & Grains",  unit: "g",       qty: 375,  minQty: 0,   packageCost: 1.50, packageSize: 375,  notes: "Deluxe" },
  { name: "Long Pasta",              category: "Pasta & Grains",  unit: "g",       qty: 500,  minQty: 0,   packageCost: 0.85, packageSize: 500  },

  // ─── NOODLES ──────────────────────────────────────────────────────────────
  { name: "Medium Egg Noodles",      category: "Pasta & Grains",  unit: "g",       qty: 300,  minQty: 0,   packageCost: 1.00, packageSize: 300  },
  { name: "Fine Egg Noodles",        category: "Pasta & Grains",  unit: "g",       qty: 300,  minQty: 0,   packageCost: 1.00, packageSize: 300  },
  { name: "Curry Instant Noodles",   category: "Pasta & Grains",  unit: "pack",    qty: 2,    minQty: 0,   packageCost: 0.30, packageSize: 1,   notes: "Curry flavour" },

  // ─── RICE & GRAINS ────────────────────────────────────────────────────────
  { name: "Long Grain Rice",         category: "Pasta & Grains",  unit: "g",       qty: 1000, minQty: 200, packageCost: 1.50, packageSize: 1000, notes: "Easy cook" },
  { name: "Microwave Rice",          category: "Pasta & Grains",  unit: "pack",    qty: 2,    minQty: 0,   packageCost: 0.90, packageSize: 1    },
  { name: "Jasmine Rice",            category: "Pasta & Grains",  unit: "g",       qty: 1000, minQty: 0,   packageCost: 1.80, packageSize: 1000 },
  { name: "Bulgur Wheat",            category: "Pasta & Grains",  unit: "g",       qty: 500,  minQty: 0,   packageCost: 1.50, packageSize: 500  },

  // ─── SAUCES & OILS ────────────────────────────────────────────────────────
  { name: "Sesame Oil",              category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 0,   packageCost: 2.50, packageSize: 1    },
  { name: "Teriyaki Sauce",          category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 0,   packageCost: 2.00, packageSize: 1    },
  { name: "Tomato Ketchup",          category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 1,   packageCost: 2.00, packageSize: 1    },
  { name: "Light Soy Sauce",         category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 0,   packageCost: 1.80, packageSize: 1    },
  { name: "Dark Soy Sauce",          category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 0,   packageCost: 1.80, packageSize: 1    },
  { name: "Gochujang Paste",         category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 2.50, packageSize: 1    },
  { name: "Thai Green Curry Paste",  category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.80, packageSize: 1    },
  { name: "Red Thai Curry Paste",    category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.80, packageSize: 1    },
  { name: "Korma Curry Paste",       category: "Condiments",      unit: "jar",     qty: 2,    minQty: 0,   packageCost: 1.80, packageSize: 1    },
  { name: "Madras Curry Paste",      category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.80, packageSize: 1    },
  { name: "Garlic Paste",            category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.50, packageSize: 1,   notes: "Laila" },
  { name: "Coconut Milk",            category: "Condiments",      unit: "can",     qty: 1,    minQty: 0,   packageCost: 1.00, packageSize: 1    },
  { name: "Rice Wine Vinegar",       category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 0,   packageCost: 1.50, packageSize: 1    },
  { name: "White Wine Vinegar",      category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 0,   packageCost: 1.20, packageSize: 1    },
  { name: "Cider Vinegar",           category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 0,   packageCost: 1.20, packageSize: 1    },
  { name: "Chip Shop Vinegar",       category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 0,   packageCost: 1.00, packageSize: 1    },
  { name: "Sunflower Oil",           category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 1,   packageCost: 2.50, packageSize: 1    },
  { name: "Groundnut Oil",           category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 0,   packageCost: 2.50, packageSize: 1    },
  { name: "Dijon Mustard",           category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.50, packageSize: 1    },
  { name: "English Mustard",         category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.00, packageSize: 1    },
  { name: "Cranberry Sauce",         category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.50, packageSize: 1    },
  { name: "Mango Chutney",           category: "Condiments",      unit: "jar",     qty: 1,    minQty: 0,   packageCost: 1.80, packageSize: 1    },
  { name: "Worcestershire Sauce",    category: "Condiments",      unit: "bottle",  qty: 1,    minQty: 0,   packageCost: 1.80, packageSize: 1    },

  // ─── FLAVOUR KITS ─────────────────────────────────────────────────────────
  { name: "Simply Cook Scandi Salmon Kit",        category: "Condiments", unit: "kit",    qty: 1, packageCost: 4.00, packageSize: 1, notes: "Simply Cook" },
  { name: "Simply Cook Thai Red Prawn Curry Kit", category: "Condiments", unit: "kit",    qty: 1, packageCost: 4.00, packageSize: 1, notes: "Simply Cook" },
  { name: "Simply Cook Jambalaya Kit",            category: "Condiments", unit: "kit",    qty: 1, packageCost: 4.00, packageSize: 1, notes: "Simply Cook" },
  { name: "Simply Cook Beef Massaman Kit",        category: "Condiments", unit: "kit",    qty: 1, packageCost: 4.00, packageSize: 1, notes: "Simply Cook" },
  { name: "Cheesy Chicken & Garlic Pasta Mix",    category: "Condiments", unit: "sachet", qty: 1, packageCost: 1.50, packageSize: 1, notes: "Schwartz One Pan Italian" },
  { name: "Chicken Gyros Seasoning",              category: "Condiments", unit: "sachet", qty: 2, packageCost: 1.50, packageSize: 1, notes: "Schwartz" },
  { name: "Pollo Funghi Sauce Mix",               category: "Condiments", unit: "sachet", qty: 1, packageCost: 1.50, packageSize: 1, notes: "Bella Italia" },
  { name: "Mediterranean Chicken Shake N Bake",   category: "Condiments", unit: "sachet", qty: 1, packageCost: 1.50, packageSize: 1, notes: "Shake N Bake" },

  // ─── SNACKS ───────────────────────────────────────────────────────────────
  { name: "Choco & Caramel Bars",    category: "Snacks",          unit: "pack",    qty: 1,    packageCost: 1.50, packageSize: 1 },
  { name: "Chocolate Digestives",    category: "Snacks",          unit: "pack",    qty: 1,    packageCost: 1.50, packageSize: 1 },
  { name: "Milk Choc Digestives",    category: "Snacks",          unit: "pack",    qty: 1,    packageCost: 1.50, packageSize: 1 },
  { name: "All Bran Cereal",         category: "Snacks",          unit: "box",     qty: 1,    packageCost: 2.50, packageSize: 1 },
  { name: "Bran Flakes",             category: "Snacks",          unit: "box",     qty: 1,    packageCost: 1.80, packageSize: 1 },
  { name: "Cornflakes",              category: "Snacks",          unit: "box",     qty: 1,    packageCost: 2.00, packageSize: 1 },
  { name: "Rice Krispies",           category: "Snacks",          unit: "box",     qty: 1,    packageCost: 2.50, packageSize: 1 },
  { name: "Muesli",                  category: "Snacks",          unit: "box",     qty: 1,    packageCost: 2.50, packageSize: 1 },
  { name: "Quaker Oat So Simple",    category: "Snacks",          unit: "box",     qty: 1,    packageCost: 3.00, packageSize: 1 },
  { name: "Apple & Blueberry Oats",  category: "Snacks",          unit: "box",     qty: 1,    packageCost: 1.80, packageSize: 1, notes: "Crownfield" },

  // ─── HELLOFRESH BLENDS ────────────────────────────────────────────────────
  { name: "Piri Piri Blend",         category: "Spices & Baking", unit: "sachet",  qty: 1,    packageCost: 0.50, packageSize: 1, notes: "HelloFresh" },
  { name: "Harissa Blend",           category: "Spices & Baking", unit: "sachet",  qty: 1,    packageCost: 0.50, packageSize: 1, notes: "HelloFresh" },
  { name: "Paprika Spice Mix",       category: "Spices & Baking", unit: "sachet",  qty: 1,    packageCost: 0.50, packageSize: 1, notes: "HelloFresh" },
  { name: "Buon Appetito Blend",     category: "Spices & Baking", unit: "sachet",  qty: 1,    packageCost: 0.50, packageSize: 1, notes: "HelloFresh" },
  { name: "Fiesta Mix Blend",        category: "Spices & Baking", unit: "sachet",  qty: 1,    packageCost: 0.50, packageSize: 1, notes: "HelloFresh" },
  { name: "Muscat Mix Blend",        category: "Spices & Baking", unit: "sachet",  qty: 1,    packageCost: 0.50, packageSize: 1, notes: "HelloFresh" },

  // ─── SPICES ───────────────────────────────────────────────────────────────
  { name: "Turmeric",                category: "Spices & Baking", unit: "jar",     qty: 1,    packageCost: 1.20, packageSize: 1 },
  { name: "Garam Masala",            category: "Spices & Baking", unit: "jar",     qty: 1,    packageCost: 1.50, packageSize: 1 },
  { name: "Curry Powder",            category: "Spices & Baking", unit: "jar",     qty: 1,    packageCost: 1.50, packageSize: 1 },
  { name: "Ground Coriander",        category: "Spices & Baking", unit: "jar",     qty: 1,    packageCost: 1.20, packageSize: 1 },
  { name: "Chilli Powder",           category: "Spices & Baking", unit: "jar",     qty: 1,    packageCost: 1.20, packageSize: 1 },
  { name: "Chilli Seeds",            category: "Spices & Baking", unit: "jar",     qty: 1,    packageCost: 1.20, packageSize: 1 },
  { name: "Paprika",                 category: "Spices & Baking", unit: "jar",     qty: 1,    packageCost: 1.50, packageSize: 1 },
  { name: "Coriander Seeds",         category: "Spices & Baking", unit: "jar",     qty: 1,    packageCost: 1.20, packageSize: 1 },
  { name: "Salad Sprinkles",         category: "Spices & Baking", unit: "jar",     qty: 1,    packageCost: 2.00, packageSize: 1 },

  // ─── BAKING ESSENTIALS ────────────────────────────────────────────────────
  { name: "Cornflour",               category: "Spices & Baking", unit: "g",       qty: 200,  packageCost: 0.60, packageSize: 200  },
  { name: "Gravy Granules",          category: "Spices & Baking", unit: "tub",     qty: 2,    minQty: 1,   packageCost: 1.80, packageSize: 1    },
  { name: "Baking Powder",           category: "Spices & Baking", unit: "tub",     qty: 1,    packageCost: 1.00, packageSize: 1    },
  { name: "Self-Raising Flour",      category: "Spices & Baking", unit: "g",       qty: 1000, minQty: 200, packageCost: 1.00, packageSize: 1000 },
  { name: "Plain Flour",             category: "Spices & Baking", unit: "g",       qty: 1000, minQty: 200, packageCost: 1.00, packageSize: 1000 },
  { name: "Flaked Almonds",          category: "Spices & Baking", unit: "g",       qty: 100,  packageCost: 1.50, packageSize: 100  },
  { name: "Ground Almonds",          category: "Spices & Baking", unit: "g",       qty: 100,  packageCost: 1.20, packageSize: 100  },
  { name: "Pine Nuts",               category: "Spices & Baking", unit: "g",       qty: 50,   packageCost: 2.50, packageSize: 50   },
  { name: "Sunflower Seeds",         category: "Spices & Baking", unit: "g",       qty: 100,  packageCost: 1.00, packageSize: 100  },
  { name: "Demerara Sugar",          category: "Spices & Baking", unit: "g",       qty: 500,  packageCost: 1.00, packageSize: 500  },
  { name: "Light Brown Soft Sugar",  category: "Spices & Baking", unit: "g",       qty: 1000, packageCost: 1.50, packageSize: 1000, notes: "x2 packs" },
  { name: "Golden Syrup",            category: "Spices & Baking", unit: "tin",     qty: 1,    packageCost: 2.50, packageSize: 1    },
  { name: "Vanilla Extract",         category: "Spices & Baking", unit: "bottle",  qty: 1,    packageCost: 3.00, packageSize: 1,   notes: "Madagascan" },
  { name: "Cocoa Powder",            category: "Spices & Baking", unit: "g",       qty: 250,  packageCost: 2.00, packageSize: 250  },
  { name: "Icing Sugar",             category: "Spices & Baking", unit: "g",       qty: 500,  packageCost: 1.00, packageSize: 500  },
  { name: "Bird's Dream Topping",    category: "Spices & Baking", unit: "pack",    qty: 1,    packageCost: 1.50, packageSize: 1    },
  { name: "Raspberry Jelly",         category: "Spices & Baking", unit: "block",   qty: 1,    packageCost: 0.75, packageSize: 1    },
  { name: "Orange Jelly",            category: "Spices & Baking", unit: "block",   qty: 1,    packageCost: 0.75, packageSize: 1    },
  { name: "Raisins",                 category: "Spices & Baking", unit: "g",       qty: 200,  packageCost: 1.20, packageSize: 200  },
  { name: "All Purpose Seasoning",   category: "Spices & Baking", unit: "jar",     qty: 1,    packageCost: 2.00, packageSize: 1,   notes: "Kuljanka" },
];

async function main() {
  for (const cat of extraCategories) {
    await db.ingredientCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const allCategories = await db.ingredientCategory.findMany();
  const catMap: Record<string, number> = {};
  for (const c of allCategories) catMap[c.name] = c.id;

  let created = 0;
  let updated = 0;

  for (const item of items) {
    const categoryId = catMap[item.category];
    if (!categoryId) {
      console.warn(`  ⚠ Category not found: "${item.category}" for "${item.name}"`);
      continue;
    }

    const costPerUnit = item.packageSize > 0 ? item.packageCost / item.packageSize : 0;

    const existing = await db.ingredient.findUnique({ where: { name: item.name } });
    if (existing) {
      await db.ingredient.update({
        where: { name: item.name },
        data: {
          currentQuantity: item.qty,
          packageCost:     item.packageCost,
          packageSize:     item.packageSize,
          costPerUnit,
          minQuantity:     item.minQty ?? 0,
        },
      });
      updated++;
    } else {
      await db.ingredient.create({
        data: {
          name:            item.name,
          categoryId,
          unit:            item.unit,
          currentQuantity: item.qty,
          minQuantity:     item.minQty ?? 0,
          packageCost:     item.packageCost,
          packageSize:     item.packageSize,
          costPerUnit,
          notes:           item.notes ?? null,
        },
      });
      created++;
    }
  }

  console.log(`\nDone! Created ${created} new, updated ${updated} existing.`);
  console.log(`costPerUnit is now derived (packageCost ÷ packageSize) — no more sub-penny fractions in forms.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
