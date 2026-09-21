import { type LucideIcon } from "lucide-react";
import { cn } from "@/utils";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
  size?: "sm" | "default" | "lg";
  children?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "default",
  children,
}: EmptyStateProps) {
  const sizes = {
    sm:      { wrap: "py-10", icon: "h-10 w-10 mb-3", iconSize: "h-5 w-5", title: "text-sm font-semibold", desc: "text-xs" },
    default: { wrap: "py-16", icon: "h-14 w-14 mb-4", iconSize: "h-7 w-7", title: "text-base font-semibold", desc: "text-sm" },
    lg:      { wrap: "py-20", icon: "h-20 w-20 mb-5", iconSize: "h-9 w-9", title: "text-lg font-semibold", desc: "text-base" },
  };
  const s = sizes[size];

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", s.wrap, className)}>
      <div className={cn("rounded-2xl bg-muted flex items-center justify-center", s.icon)}>
        <Icon className={cn("text-foreground-subtle", s.iconSize)} />
      </div>
      <p className={cn("text-foreground", s.title)}>{title}</p>
      {description && (
        <p className={cn("text-foreground-muted mt-1.5 max-w-xs", s.desc)}>{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-5">
          {action && (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button size="sm" variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
