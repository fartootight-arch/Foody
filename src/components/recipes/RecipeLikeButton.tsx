"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface Person {
  id: number;
  name: string;
  avatarColor: string;
}

interface Props {
  recipeId: number;
  people: Person[];
  initialLikedByIds: number[];  // personIds who have already liked
}

export function RecipeLikeButton({ recipeId, people, initialLikedByIds }: Props) {
  const [likedByIds, setLikedByIds] = useState<number[]>(initialLikedByIds);
  const [loading, setLoading] = useState<number | null>(null);

  const toggle = async (person: Person, e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate if inside a Link
    e.stopPropagation();
    if (loading !== null) return;
    setLoading(person.id);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id }),
      });
      const data = await res.json();
      setLikedByIds((prev) =>
        data.liked ? [...prev, person.id] : prev.filter((id) => id !== person.id)
      );
      toast(data.liked ? `${person.name} liked this recipe ❤️` : `${person.name} unliked this recipe`);
    } catch {
      toast.error("Couldn't update like");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {people.map((person) => {
        const liked = likedByIds.includes(person.id);
        const isLoading = loading === person.id;
        return (
          <button
            key={person.id}
            onClick={(e) => toggle(person, e)}
            disabled={isLoading}
            title={liked ? `${person.name} likes this — click to unlike` : `${person.name}: click to like`}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: liked ? `${person.avatarColor}22` : "transparent",
              border: `1.5px solid ${liked ? person.avatarColor : "#d1d5db"}`,
              color: liked ? person.avatarColor : "#9ca3af",
            }}
          >
            <Heart
              className="w-3 h-3 transition-transform"
              style={{
                fill: liked ? person.avatarColor : "none",
                color: liked ? person.avatarColor : "#9ca3af",
                transform: isLoading ? "scale(1.3)" : "scale(1)",
              }}
            />
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={{ backgroundColor: person.avatarColor }}
            >
              {person.name.charAt(0)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
