"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DIETARY_OPTIONS } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  Search,
  Check,
} from "lucide-react";

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

const STEPS = ["Basic Info", "Ingredients", "Instructions"];

export default function NewRecipePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");

  // Step 1
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("2");
  const [source, setSource] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Step 2
  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>([]);

  // Step 3
  const [instructions, setInstructions] = useState<string[]>([""]);

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then(setAllIngredients)
      .catch(() => {});
  }, []);

  const filteredIngredients = allIngredients.filter(
    (i) =>
      i.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
      !ingredients.find((ri) => ri.ingredientId === i.id)
  );

  const addIngredient = (ing: Ingredient) => {
    setIngredients((prev) => [
      ...prev,
      {
        ingredientId: ing.id,
        name: ing.name,
        quantity: "1",
        unit: ing.unit,
        notes: "",
        optional: false,
      },
    ]);
    setIngredientSearch("");
  };

  const removeIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateIngredient = (idx: number, field: keyof RecipeIngredientInput, value: any) => {
    setIngredients((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addInstruction = () => setInstructions((prev) => [...prev, ""]);
  const removeInstruction = (idx: number) => {
    if (instructions.length === 1) return;
    setInstructions((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateInstruction = (idx: number, value: string) => {
    setInstructions((prev) => prev.map((s, i) => (i === idx ? value : s)));
  };

  const moveInstruction = (idx: number, dir: -1 | 1) => {
    const newInstructions = [...instructions];
    const target = idx + dir;
    if (target < 0 || target >= newInstructions.length) return;
    [newInstructions[idx], newInstructions[target]] = [newInstructions[target], newInstructions[idx]];
    setInstructions(newInstructions);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!name) {
      toast.error("Recipe name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed");
      }

      toast.success(`${name} recipe created`);
      router.push("/recipes");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="New Recipe" subtitle="Add a recipe to your collection" />

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step || (i === step + 1 && canProceed()) ? setStep(i) : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i === step
                  ? "bg-orange-500 text-white"
                  : i < step
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  i < step ? "bg-orange-500 text-white" : "bg-current/20"
                }`}
              >
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {s}
            </button>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Recipe Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Spaghetti Carbonara"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the dish..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prepTime">Prep time (mins)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  min="0"
                  placeholder="15"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cookTime">Cook time (mins)</Label>
                <Input
                  id="cookTime"
                  type="number"
                  min="0"
                  placeholder="30"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  placeholder="2"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source / Origin</Label>
                <Input
                  id="source"
                  placeholder="e.g., Family recipe, BBC Good Food"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
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
      )}

      {/* Step 2: Ingredients */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search and add ingredients from inventory..."
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {ingredientSearch && filteredIngredients.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {filteredIngredients.slice(0, 10).map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => addIngredient(ing)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ing.category.color }}
                      />
                      <span className="font-medium">{ing.name}</span>
                      <span className="text-gray-400">{ing.category.name}</span>
                    </div>
                    <Plus className="w-4 h-4 text-orange-500" />
                  </button>
                ))}
              </div>
            )}

            {ingredients.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Search for ingredients above to add them
              </p>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ri, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{ri.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          value={ri.quantity}
                          onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
                          className="w-20 h-7 text-xs"
                          placeholder="Qty"
                        />
                        <Input
                          value={ri.unit}
                          onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                          className="w-20 h-7 text-xs"
                          placeholder="Unit"
                        />
                        <Input
                          value={ri.notes}
                          onChange={(e) => updateIngredient(idx, "notes", e.target.value)}
                          className="flex-1 h-7 text-xs"
                          placeholder="Notes (optional)"
                        />
                        <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={ri.optional}
                            onChange={(e) => updateIngredient(idx, "optional", e.target.checked)}
                            className="rounded"
                          />
                          Optional
                        </label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-600 shrink-0"
                      onClick={() => removeIngredient(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Instructions */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {instructions.map((step_text, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-semibold shrink-0 mt-1">
                  {idx + 1}
                </div>
                <Textarea
                  value={step_text}
                  onChange={(e) => updateInstruction(idx, e.target.value)}
                  placeholder={`Step ${idx + 1}...`}
                  rows={2}
                  className="flex-1"
                />
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveInstruction(idx, -1)}
                    disabled={idx === 0}
                  >
                    <ChevronLeft className="w-3 h-3 rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveInstruction(idx, 1)}
                    disabled={idx === instructions.length - 1}
                  >
                    <ChevronRight className="w-3 h-3 rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400"
                    onClick={() => removeInstruction(idx)}
                    disabled={instructions.length === 1}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addInstruction} className="w-full gap-2 mt-2">
              <Plus className="w-4 h-4" />
              Add Step
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => (step === 0 ? router.push("/recipes") : setStep(step - 1))}
        >
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Create Recipe"}
          </Button>
        )}
      </div>
    </div>
  );
}
