import { cn } from "@/utils";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  badge?: ReactNode;
  icon?: LucideIcon;
  backTo?: { label: string; path: string };
}

export default function PageHeader({ title, description, action, className, badge, icon: Icon, backTo }: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {backTo && (
        <Link
          to={backTo.path}
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-primary transition-colors mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {backTo.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            {Icon && (
              <div className="h-8 w-8 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="text-sm text-foreground-muted mt-1">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
