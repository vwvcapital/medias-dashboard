import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  highlight?: boolean;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  highlight = false,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6 animate-slide-up",
        highlight && "metric-highlight border-accent/30"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            highlight ? "bg-accent/20" : "bg-primary/10"
          )}
        >
          <Icon className={cn("w-6 h-6", highlight ? "text-accent" : "text-primary")} />
        </div>
      </div>

      <div className={cn(highlight ? "stat-value-lg text-accent" : "stat-value text-foreground")}>
        {value}
      </div>

      <div className="mt-2">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
