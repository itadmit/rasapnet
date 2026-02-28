"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface DataListProps {
  children: React.ReactNode;
  className?: string;
}

export function DataList({ children, className }: DataListProps) {
  return (
    <div className={cn("divide-y divide-border rounded-lg border bg-card", className)}>
      {children}
    </div>
  );
}

interface DataListItemProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: Array<{ icon?: React.ReactNode | null; value: React.ReactNode }>;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  expandable?: boolean;
  className?: string;
}

export function DataListItem({
  icon,
  title,
  subtitle,
  meta,
  actions,
  children,
  expandable,
  className,
}: DataListItemProps) {
  const [open, setOpen] = useState(false);
  const hasExpandable = expandable && children;

  const content = (
    <div className="flex items-start gap-3 min-w-0">
      {icon && (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{title}</div>
        {subtitle && (
          <div className="text-sm text-muted-foreground truncate">{subtitle}</div>
        )}
        {meta && meta.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-1.5">
            {meta.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                {m.icon && <span className="shrink-0">{m.icon}</span>}
                <span className="truncate max-w-[140px] sm:max-w-none">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {actions}
        {hasExpandable && (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 transition-colors hover:bg-muted/50",
        className
      )}
    >
      {hasExpandable ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          {content}
          <CollapsibleContent>
            <div className="mt-3 pt-3 border-t border-border">{children}</div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          {content}
          {children}
        </>
      )}
    </div>
  );
}

interface DataListEmptyProps {
  message: string;
  className?: string;
}

export function DataListEmpty({ message, className }: DataListEmptyProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-12 text-muted-foreground text-sm",
        className
      )}
    >
      {message}
    </div>
  );
}
