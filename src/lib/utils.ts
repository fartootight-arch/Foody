import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function parseJsonArray(value: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Plain text with numbered steps e.g. "1. Step one\n2. Step two"
    return value
      .split(/\n+/)
      .map((s) => s.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
  }
}

export function serializeJsonArray(arr: string[]): string {
  return JSON.stringify(arr);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const DIETARY_OPTIONS = [
  "vegan",
  "vegetarian",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "halal",
  "kosher",
  "low-carb",
  "keto",
  "paleo",
];

export const ALLERGY_OPTIONS = [
  "nuts",
  "peanuts",
  "shellfish",
  "fish",
  "eggs",
  "milk",
  "wheat",
  "soy",
  "sesame",
  "mustard",
  "celery",
  "sulphites",
];

export const RELATIONSHIP_OPTIONS = [
  { value: "self", label: "Myself" },
  { value: "partner", label: "Partner" },
  { value: "family", label: "Family" },
  { value: "child", label: "Child" },
  { value: "guest", label: "Guest" },
];

export const CATEGORY_DEFAULTS = [
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

export function healthRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: "Treat yourself",
    2: "Comfort food",
    3: "Balanced",
    4: "Pretty healthy",
    5: "Very healthy",
  };
  return labels[rating] ?? "Balanced";
}

export function healthRatingEmoji(rating: number): string {
  const emojis: Record<number, string> = {
    1: "🍕",
    2: "🍝",
    3: "🥗",
    4: "🥦",
    5: "🌿",
  };
  return emojis[rating] ?? "🥗";
}

export function statusColor(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "cooked":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getMonthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleString("en-GB", { month: "long" });
}
