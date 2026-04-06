import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { parseJsonArray, RELATIONSHIP_OPTIONS } from "@/lib/utils";

interface Person {
  id: number;
  name: string;
  avatarColor: string;
  relationship: string;
  dietary: string;
  allergies: string;
  likes: string;
  dislikes: string;
}

interface PersonCardProps {
  person: Person;
}

const DIETARY_COLORS: Record<string, string> = {
  vegan: "bg-green-100 text-green-800",
  vegetarian: "bg-emerald-100 text-emerald-800",
  "gluten-free": "bg-amber-100 text-amber-800",
  "dairy-free": "bg-blue-100 text-blue-800",
  "nut-free": "bg-purple-100 text-purple-800",
  halal: "bg-teal-100 text-teal-800",
  kosher: "bg-indigo-100 text-indigo-800",
  "low-carb": "bg-orange-100 text-orange-800",
  keto: "bg-yellow-100 text-yellow-800",
  paleo: "bg-lime-100 text-lime-800",
};

export function PersonCard({ person }: PersonCardProps) {
  const dietary = parseJsonArray(person.dietary);
  const allergies = parseJsonArray(person.allergies);
  const relationshipLabel =
    RELATIONSHIP_OPTIONS.find((r) => r.value === person.relationship)?.label ??
    person.relationship;
  const initial = person.name.charAt(0).toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ backgroundColor: person.avatarColor }}
            >
              {initial}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{person.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{relationshipLabel}</p>
            </div>
          </div>
          <Link href={`/people/${person.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {dietary.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {dietary.map((d) => (
              <span
                key={d}
                className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                  DIETARY_COLORS[d] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {d}
              </span>
            ))}
          </div>
        )}

        {allergies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allergies.map((a) => (
              <span
                key={a}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 capitalize"
              >
                Allergic: {a}
              </span>
            ))}
          </div>
        )}

        {dietary.length === 0 && allergies.length === 0 && (
          <p className="text-xs text-gray-400">No dietary restrictions</p>
        )}
      </CardContent>
    </Card>
  );
}
