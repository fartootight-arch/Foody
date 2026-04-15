"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, Loader2 } from "lucide-react";

interface Props {
  mealName: string;
  description?: string | null;
  instructions: string[];
  ingredients: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  dietaryTags?: string[];
}

export function SaveAsRecipeButton({
  mealName,
  description,
  instructions,
  ingredients,
  prepTime,
  cookTime,
  servings,
  dietaryTags,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/ai/save-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mealName,
          description,
          instructions,
          ingredients,
          prepTime,
          cookTime,
          servings,
          dietaryTags,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }

      const data = await res.json();
      setSaved(true);
      toast.success(`"${mealName}" saved to your recipes!`, {
        action: {
          label: "View Recipe",
          onClick: () => router.push(`/recipes/${data.id}`),
        },
      });
    } catch (e: any) {
      toast.error(e.message ?? "Could not save recipe");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
        <BookmarkPlus className="w-3.5 h-3.5" />
        Saved to recipes
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSave}
      disabled={saving}
      className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
    >
      {saving ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <BookmarkPlus className="w-3.5 h-3.5" />
      )}
      {saving ? "Saving..." : "Save as Recipe"}
    </Button>
  );
}
