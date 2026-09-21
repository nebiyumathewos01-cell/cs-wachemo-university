import { type LucideIcon } from "lucide-react";
import { cn } from "@/utils";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  color?: string;
  bg?: string;
  className?: string;
  href?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection = "up",
  color = "text-primary",
  bg = "bg-primary-subtle",
  className,
  href,
}: StatCardProps) {
  const content = (
    <div className={cn(
      "rounded-xl border border-border bg-card p-4 shadow-xs transition-all",
      href && "hover:shadow-md hover:border-border-strong cursor-pointer",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", bg)}>
          <Icon className={cn("h-4.5 w-4.5", color)} />
        </div>
      </div>
      <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>
      <p className="text-xs text-foreground-muted mt-0.5">{label}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-1.5">
          {trendDirection === "up" && <ArrowUpRight className="h-3 w-3 text-success" />}
          {trendDirection === "down" && <ArrowDownRight className="h-3 w-3 text-destructive" />}
          {trendDirection === "neutral" && <Minus className="h-3 w-3 text-foreground-muted" />}
          <p className={cn("text-xs", {
            "text-success": trendDirection === "up",
            "text-destructive": trendDirection === "down",
            "text-foreground-muted": trendDirection === "neutral",
          })}>
            {trend}
          </p>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
