"use client";

import { useState } from "react";
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
import { DIETARY_OPTIONS, ALLERGY_OPTIONS, RELATIONSHIP_OPTIONS } from "@/lib/utils";
import { X, Plus } from "lucide-react";

const AVATAR_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
];

export default function NewPersonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [relationship, setRelationship] = useState("family");
  const [dietary, setDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [likeInput, setLikeInput] = useState("");
  const [dislikeInput, setDislikeInput] = useState("");

  const toggleDietary = (tag: string) =>
    setDietary((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const toggleAllergy = (a: string) =>
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const addLike = () => {
    if (likeInput.trim() && !likes.includes(likeInput.trim())) {
      setLikes((prev) => [...prev, likeInput.trim()]);
      setLikeInput("");
    }
  };

  const addDislike = () => {
    if (dislikeInput.trim() && !dislikes.includes(dislikeInput.trim())) {
      setDislikes((prev) => [...prev, dislikeInput.trim()]);
      setDislikeInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarColor, relationship, dietary, allergies, likes, dislikes, notes: notes || null }),
      });

      if (!res.ok) throw new Error("Failed");
      toast.success(`${name} added`);
      router.push("/people");
    } catch {
      toast.error("Failed to add person");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Add Person" subtitle="Add a household member" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {name.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Alice"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avatar Color</Label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                      avatarColor === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={relationship} onValueChange={(v) => { if (v !== null) setRelationship(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dietary Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Diet</Label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDietary(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                      dietary.includes(tag)
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allergies</Label>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAllergy(a)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                      allergies.includes(a)
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Food Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Likes</Label>
              <div className="flex gap-2">
                <Input
                  value={likeInput}
                  onChange={(e) => setLikeInput(e.target.value)}
                  placeholder="e.g., pasta, spicy food"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLike(); } }}
                />
                <Button type="button" variant="outline" onClick={addLike} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {likes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {likes.map((l) => (
                    <span
                      key={l}
                      className="flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs"
                    >
                      {l}
                      <button type="button" onClick={() => setLikes((prev) => prev.filter((x) => x !== l))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Dislikes</Label>
              <div className="flex gap-2">
                <Input
                  value={dislikeInput}
                  onChange={(e) => setDislikeInput(e.target.value)}
                  placeholder="e.g., mushrooms, olives"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDislike(); } }}
                />
                <Button type="button" variant="outline" onClick={addDislike} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {dislikes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {dislikes.map((d) => (
                    <span
                      key={d}
                      className="flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-700 rounded-full text-xs"
                    >
                      {d}
                      <button type="button" onClick={() => setDislikes((prev) => prev.filter((x) => x !== d))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any other notes about food preferences..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Adding..." : "Add Person"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/people")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
