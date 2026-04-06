"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Category {
  id: number;
  name: string;
  color: string;
}

export default function NewIngredientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    unit: "",
    packageCost: "",
    packageSize: "",
    currentQuantity: "",
    minQuantity: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.unit) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          categoryId: Number(form.categoryId),
          unit: form.unit,
          packageCost: Number(form.packageCost || 0),
          packageSize: Number(form.packageSize || 1),
          currentQuantity: Number(form.currentQuantity || 0),
          minQuantity: Number(form.minQuantity || 0),
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create ingredient");
      }

      toast.success(`${form.name} added to inventory`);
      router.push("/inventory");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const commonUnits = ["g", "kg", "ml", "L", "pieces", "tbsp", "tsp", "cups", "bunch", "pack", "tin", "bottle", "bag", "box"];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Add Ingredient" subtitle="Add a new ingredient to your inventory" />

      <Card>
        <CardHeader>
          <CardTitle>Ingredient Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Chicken Breast"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v ?? "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="unit"
                    placeholder="e.g., g, ml, pieces"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    list="unit-suggestions"
                    required
                  />
                  <datalist id="unit-suggestions">
                    {commonUnits.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageCost">Package price (£)</Label>
                  <Input
                    id="packageCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.packageCost}
                    onChange={(e) => setForm({ ...form, packageCost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageSize">Package size</Label>
                  <Input
                    id="packageSize"
                    type="number"
                    step="any"
                    min="1"
                    placeholder="e.g. 500"
                    value={form.packageSize}
                    onChange={(e) => setForm({ ...form, packageSize: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">e.g. for a 500g bag costing £1.50 — enter 1.50 and 500</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentQuantity">Current stock</Label>
                <Input
                  id="currentQuantity"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={form.currentQuantity}
                  onChange={(e) => setForm({ ...form, currentQuantity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minQuantity">Minimum stock</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={form.minQuantity}
                  onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this ingredient..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Adding..." : "Add Ingredient"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/inventory")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
