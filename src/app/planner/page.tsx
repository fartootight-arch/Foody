import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDateShort, formatGBP, healthRatingEmoji, healthRatingLabel, statusColor, getMonthName } from "@/lib/utils";
import { CalendarDays, Users, ChefHat } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const now = new Date();
  const { month: monthStr, year: yearStr } = await searchParams;
  const month = Number(monthStr ?? now.getMonth() + 1);
  const year = Number(yearStr ?? now.getFullYear());

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const mealPlans = await prisma.mealPlan.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: {
      people: { include: { person: true } },
      entries: { orderBy: { sortOrder: "asc" } },
      budgetEntry: true,
    },
    orderBy: { date: "desc" },
  });

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Meal Planner"
        subtitle="Plan and track your evening meals"
        action={{ label: "Plan a Meal", href: "/planner/new" }}
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/planner?month=${prevMonth}&year=${prevYear}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; {getMonthName(prevMonth)} {prevYear}
        </Link>
        <h2 className="text-lg font-semibold text-gray-900">
          {getMonthName(month)} {year}
        </h2>
        <Link
          href={`/planner?month=${nextMonth}&year=${nextYear}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {getMonthName(nextMonth)} {nextYear} &rarr;
        </Link>
      </div>

      {mealPlans.length === 0 ? (
        <EmptyState
          title="No meal plans this month"
          description="Start planning your meals to track nutrition, budget, and ingredients."
          actionLabel="Plan Tonight's Meal"
          actionHref="/planner/new"
          icon={<CalendarDays className="w-8 h-8 text-gray-400" />}
        />
      ) : (
        <div className="space-y-3">
          {mealPlans.map((plan) => {
            const mainEntry = plan.entries.find((e) => e.role === "main");
            const altEntry = plan.entries.find((e) => e.role === "alternative");
            const mealName = mainEntry?.suggestedName ?? "Unnamed meal";

            return (
              <Link key={plan.id} href={`/planner/${plan.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            {formatDateShort(plan.date)}
                          </span>
                          <Badge
                            className={`text-xs ${statusColor(plan.status)}`}
                            variant="secondary"
                          >
                            {plan.status}
                          </Badge>
                          <span title={healthRatingLabel(plan.healthRating)}>
                            {healthRatingEmoji(plan.healthRating)}
                          </span>
                        </div>

                        <h3 className="font-semibold text-gray-900 truncate">{mealName}</h3>
                        {altEntry && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Alt: {altEntry.suggestedName}
                          </p>
                        )}
                        {plan.moodText && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">"{plan.moodText}"</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {plan.people.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="w-3.5 h-3.5" />
                            <div className="flex -space-x-1.5">
                              {plan.people.slice(0, 3).map((pp) => (
                                <div
                                  key={pp.id}
                                  className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                                  style={{ backgroundColor: pp.person.avatarColor }}
                                  title={pp.person.name}
                                >
                                  {pp.person.name.charAt(0)}
                                </div>
                              ))}
                              {plan.people.length > 3 && (
                                <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">
                                  +{plan.people.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {plan.budgetEntry && (
                          <span className="text-xs text-orange-600 font-medium">
                            {formatGBP(plan.budgetEntry.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
