import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action && (
        <div>
          {action.href ? (
            <Link href={action.href}>
              <Button className="gap-2">
                {action.icon ?? <Plus className="w-4 h-4" />}
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button onClick={action.onClick} className="gap-2">
              {action.icon ?? <Plus className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
