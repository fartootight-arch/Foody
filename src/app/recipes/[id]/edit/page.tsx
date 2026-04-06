"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DIETARY_OPTIONS, parseJsonArray } from "@/lib/utils";
import { Plus, Trash2, ChevronLeft, ChevronRight, Search, Check } from "lucide-react";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  costPerUnit: number;
  category: { name: string; color: string };
}

interface RecipeIngredientInput {
  ingredientId: number;
  name: string;
  quantity: string;
  unit: string;
  notes: string;
  optional: boolean;
}

interface Recipe {
  id: number;
  name: string;
  description?: string | null;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  source?: string | null;
  dietaryTags: string;
  ingredients: Array<{
    ingredientId: number;
    quantity: number;
    unit: string;
    notes?: string | null;
    optional: boolean;
    ingredient: { id: number; name: string; unit: string; costPerUnit: number; category: { name: string; color: string } };
  }>;
}

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("2");
  const [source, setSource] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>([]);
  const [instructions, setInstructions] = useState<string[]>([""]);

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory").then((r) => r.json()),
      fetch(`/api/recipes/${id}`).then((r) => r.json()),
    ]).then(([ings, recipe]: [Ingredient[], Recipe]) => {
      setAllIngredients(ings);
      setName(recipe.name);
      setDescription(recipe.description ?? "");
      setPrepTime(String(recipe.prepTime));
      setCookTime(String(recipe.cookTime));
      setServings(String(recipe.servings));
      setSource(recipe.source ?? "");
      setSelectedTags(recipe.dietaryTags ? recipe.dietaryTags.split(",").filter(Boolean) : []);
      setIngredients(
        recipe.ingredients.map((ri) => ({
          ingredientId: ri.ingredientId,
          name: ri.ingredient.name,
          quantity: String(ri.quantity),
          unit: ri.unit,
          notes: ri.notes ?? "",
          optional: ri.optional,
        }))
      );
      const parsedInstructions = parseJsonArray(recipe.instructions);
      setInstructions(parsedInstructions.length > 0 ? parsedInstructions : [""]);
      setLoaded(true);
    }).catch(() => toast.error("Failed to load recipe"));
  }, [id]);

  const filteredIngredients = allIngredients.filter(
    (i) =>
      i.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
      !ingredients.find((ri) => ri.ingredientId === i.id)
  );

  const addIngredient = (ing: Ingredient) => {
    setIngredients((prev) => [
      ...prev,
      { ingredientId: ing.id, name: ing.name, quantity: "1", unit: ing.unit, notes: "", optional: false },
    ]);
    setIngredientSearch("");
  };

  const removeIngredient = (idx: number) => setIngredients((prev) => prev.filter((_, i) => i !== idx));
  const updateIngredient = (idx: number, field: keyof RecipeIngredientInput, value: any) =>
    setIngredients((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));

  const addInstruction = () => setInstructions((prev) => [...prev, ""]);
  const removeInstruction = (idx: number) => {
    if (instructions.length === 1) return;
    setInstructions((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateInstruction = (idx: number, value: string) =>
    setInstructions((prev) => prev.map((s, i) => (i === idx ? value : s)));
  const moveInstruction = (idx: number, dir: -1 | 1) => {
    const arr = [...instructions];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setInstructions(arr);
  };

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Recipe deleted");
      router.push("/recipes");
    } catch {
      toast.error("Failed to delete recipe");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { toast.error("Recipe name is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          instructions: instructions.filter((s) => s.trim()),
          prepTime: Number(prepTime || 0),
          cookTime: Number(cookTime || 0),
          servings: Number(servings || 2),
          source: source || null,
          dietaryTags: selectedTags,
          ingredients: ingredients.map((ri) => ({
            ingredientId: ri.ingredientId,
            quantity: Number(ri.quantity),
            unit: ri.unit,
            notes: ri.notes || null,
            optional: ri.optional,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Recipe updated");
      router.push(`/recipes/${id}`);
    } catch {
      toast.error("Failed to update recipe");
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Recipe</h1>
          <p className="text-sm text-gray-500 mt-1">{name}</p>
        </div>
        <ConfirmDialog
          trigger={
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          }
          title="Delete Recipe"
          description={`Are you sure you want to delete "${name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          destructive
          confirmLabel="Delete"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Recipe Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prep time (mins)</Label>
                <Input type="number" min="0" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cook time (mins)</Label>
                <Input type="number" min="0" value={cookTime} onChange={(e) => setCookTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Servings</Label>
                <Input type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g., Family recipe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dietary Tags</Label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                      selectedTags.includes(tag)
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ingredients</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search and add ingredients..."
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {ingredientSearch && filteredIngredients.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {filteredIngredients.slice(0, 10).map((ing) => (
                  <button key={ing.id} type="button" onClick={() => addIngredient(ing)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-orange-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ing.category.color }} />
                      <span className="font-medium">{ing.name}</span>
                    </div>
                    <Plus className="w-4 h-4 text-orange-500" />
                  </button>
                ))}
              </div>
            )}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                {ingredients.map((ri, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ri.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Input type="number" step="any" value={ri.quantity}
                          onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
                          className="w-20 h-7 text-xs" placeholder="Qty" />
                        <Input value={ri.unit} onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                          className="w-20 h-7 text-xs" placeholder="Unit" />
                        <Input value={ri.notes} onChange={(e) => updateIngredient(idx, "notes", e.target.value)}
                          className="flex-1 h-7 text-xs" placeholder="Notes" />
                        <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                          <input type="checkbox" checked={ri.optional}
                            onChange={(e) => updateIngredient(idx, "optional", e.target.checked)} className="rounded" />
                          Optional
                        </label>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => removeIngredient(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {instructions.map((step_text, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-semibold shrink-0 mt-1">
                  {idx + 1}
                </div>
                <Textarea value={step_text} onChange={(e) => updateInstruction(idx, e.target.value)} rows={2} className="flex-1" />
                <div className="flex flex-col gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveInstruction(idx, -1)} disabled={idx === 0}>
                    <ChevronLeft className="w-3 h-3 rotate-90" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveInstruction(idx, 1)} disabled={idx === instructions.length - 1}>
                    <ChevronRight className="w-3 h-3 rotate-90" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => removeInstruction(idx)} disabled={instructions.length === 1}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" type="button" onClick={addInstruction} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add Step
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/recipes/${id}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
