import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { PersonCard } from "@/components/people/PersonCard";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="People"
        subtitle="Manage household members and their dietary preferences"
        action={{ label: "Add Person", href: "/people/new" }}
      />

      {people.length === 0 ? (
        <EmptyState
          title="No people added yet"
          description="Add household members to personalise meal suggestions based on their preferences and dietary needs."
          actionLabel="Add First Person"
          actionHref="/people/new"
          icon={<Users className="w-8 h-8 text-gray-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
