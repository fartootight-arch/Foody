"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { MealSuggestionCard } from "@/components/planner/MealSuggestionCard";
import { formatGBP, healthRatingLabel, healthRatingEmoji, parseJsonArray } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, Users, CalendarDays, Sparkles, Check } from "lucide-react";

interface Person {
  id: number;
  name: string;
  avatarColor: string;
  relationship: string;
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
  missingIngredients: any[];
  dietaryTags: string[];
  ingredients: string[];
  instructions: string[];
}

interface AISuggestion {
  primaryMeal: MealSuggestion;
  alternativeMeal: MealSuggestion | null;
  planningNotes: string;
  totalEstimatedCost: number;
}

interface MealPlanEntry {
  id: number;
  role: string;
  accepted: boolean;
  suggestedName?: string | null;
}

interface MealPlan {
  id: number;
  date: string;
  status: string;
  entries: MealPlanEntry[];
}

const MOOD_CHIPS = [
  "comfort food",
  "pasta tonight",
  "something healthy",
  "quick meal",
  "treat ourselves",
  "light and fresh",
  "hearty and filling",
  "spicy",
];

const STEPS = ["Date & People", "Health & Mood", "AI Suggestion", "Confirm"];

export default function NewMealPlanPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<number[]>([]);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [healthRating, setHealthRating] = useState(3);
  const [moodText, setMoodText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [primaryAccepted, setPrimaryAccepted] = useState<boolean | undefined>(true);
  const [altAccepted, setAltAccepted] = useState<boolean | undefined>(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/people")
      .then((r) => r.json())
      .then((data: Person[]) => {
        setPeople(data);
        setSelectedPeopleIds(data.map((p) => p.id));
      })
      .catch(() => {});
  }, []);

  const togglePerson = (id: number) => {
    setSelectedPeopleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGetSuggestion = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          healthRating,
          moodText: moodText || null,
          peopleIds: selectedPeopleIds,
          servings: selectedPeopleIds.length || 2,
        }),
      });

      if (!res.ok) throw new Error("Failed to get suggestion");
      const data = await res.json();
      setSuggestion(data.suggestion);
      setMealPlan(data.mealPlan);
      setPrimaryAccepted(true);
      setAltAccepted(data.suggestion.alternativeMeal ? true : undefined);
      setStep(2);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to generate suggestion");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!mealPlan) return;
    setSaving(true);
    try {
      // Update entry acceptance
      const updates = mealPlan.entries.map((entry) => ({
        id: entry.id,
        accepted: entry.role === "main" ? primaryAccepted ?? true : altAccepted ?? true,
      }));

      await fetch(`/api/meal-plans/${mealPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: updates }),
      });

      toast.success("Meal plan saved!");
      router.push(`/planner/${mealPlan.id}`);
    } catch {
      toast.error("Failed to save meal plan");
    } finally {
      setSaving(false);
    }
  };

  const selectedPeople = people.filter((p) => selectedPeopleIds.includes(p.id));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Plan Tonight's Meal</h1>
      <p className="text-sm text-gray-500 mb-8">Let AI suggest the perfect meal for your household</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                i === step
                  ? "bg-orange-500 text-white"
                  : i < step
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-white/20">
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {s}
            </div>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Date & People */}
      {step === 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-orange-500" />
                When?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Who's eating?
              </CardTitle>
            </CardHeader>
            <CardContent>
              {people.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No people added yet.{" "}
                  <a href="/people/new" className="text-orange-500 hover:underline">
                    Add people
                  </a>{" "}
                  to get personalised suggestions.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {people.map((person) => {
                    const selected = selectedPeopleIds.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => togglePerson(person.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          selected
                            ? "border-orange-300 bg-orange-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{ backgroundColor: person.avatarColor }}
                        >
                          {person.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 text-sm truncate">{person.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{person.relationship}</p>
                        </div>
                        {selected && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Health & Mood */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Health Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-2">{healthRatingEmoji(healthRating)}</div>
                <p className="text-lg font-semibold text-gray-800">{healthRatingLabel(healthRating)}</p>
                <p className="text-sm text-gray-500">{healthRating}/5</p>
              </div>
              <div className="px-4">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[healthRating]}
                  onValueChange={(values) => { const v = Array.isArray(values) ? values[0] : (values as any); if (typeof v === "number") setHealthRating(v); }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Treat yourself</span>
                  <span>Balanced</span>
                  <span>Very healthy</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What are you in the mood for?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {MOOD_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setMoodText((prev) => (prev === chip ? "" : chip))
                    }
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      moodText === chip
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mood">Or describe your mood</Label>
                <Textarea
                  id="mood"
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                  placeholder="e.g., something warming and comforting..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: AI Suggestion */}
      {step === 2 && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">Thinking up the perfect meal...</h3>
              <p className="text-sm text-gray-500 mt-1">
                Checking your inventory, recipes and preferences
              </p>
            </div>
          ) : suggestion ? (
            <>
              <MealSuggestionCard
                meal={suggestion.primaryMeal}
                role="main"
                accepted={primaryAccepted}
                onAccept={() => setPrimaryAccepted(true)}
                onReject={() => setPrimaryAccepted(false)}
              />

              {suggestion.alternativeMeal && (
                <MealSuggestionCard
                  meal={suggestion.alternativeMeal}
                  role="alternative"
                  accepted={altAccepted}
                  onAccept={() => setAltAccepted(true)}
                  onReject={() => setAltAccepted(false)}
                />
              )}

              {suggestion.planningNotes && (
                <Card className="bg-blue-50 border-blue-100">
                  <CardContent className="p-4">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Foody says: </span>
                      {suggestion.planningNotes}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <p className="text-sm text-gray-500">
                  Total estimated cost:{" "}
                  <strong className="text-orange-600">
                    {formatGBP(suggestion.totalEstimatedCost)}
                  </strong>
                </p>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 3 && suggestion && mealPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Meal Plan Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium">{new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Health rating</p>
                <p className="font-medium">{healthRatingEmoji(healthRating)} {healthRatingLabel(healthRating)}</p>
              </div>
              {moodText && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Mood</p>
                  <p className="font-medium">{moodText}</p>
                </div>
              )}
            </div>

            {selectedPeople.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Eating</p>
                <div className="flex gap-2">
                  {selectedPeople.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-gray-500">Meals</p>
              {primaryAccepted !== false && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-medium">Main</span>
                  <span className="text-sm font-medium">{suggestion.primaryMeal.name}</span>
                  <span className="ml-auto text-sm text-orange-600">{formatGBP(suggestion.primaryMeal.estimatedCost)}</span>
                </div>
              )}
              {suggestion.alternativeMeal && altAccepted !== false && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-medium">Alt</span>
                  <span className="text-sm font-medium">{suggestion.alternativeMeal.name}</span>
                  <span className="ml-auto text-sm text-blue-600">{formatGBP(suggestion.alternativeMeal.estimatedCost)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500">Estimated total</p>
              <p className="text-lg font-bold text-orange-600">{formatGBP(suggestion.totalEstimatedCost)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => (step === 0 ? router.push("/planner") : setStep(step - 1))}
          disabled={loading}
        >
          {step === 0 ? "Cancel" : (
            <>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </>
          )}
        </Button>

        {step === 0 && (
          <Button onClick={() => setStep(1)}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}

        {step === 1 && (
          <Button onClick={handleGetSuggestion} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Get AI Suggestion
              </>
            )}
          </Button>
        )}

        {step === 2 && suggestion && !loading && (
          <Button onClick={() => setStep(3)}>
            Review Plan
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}

        {step === 3 && (
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Plan"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
