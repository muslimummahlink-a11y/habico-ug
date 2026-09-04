import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface GridCardField<T> {
  label?: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface GridDataCardsProps<T> {
  data: T[];
  fields: GridCardField<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  actions?: (item: T) => ReactNode;
  gridClassName?: string;
  cardContentClassName?: string;
}

export function GridDataCards<T>({
  data,
  fields,
  keyExtractor,
  isLoading,
  emptyMessage,
  emptyIcon,
  actions,
  gridClassName,
  cardContentClassName,
}: GridDataCardsProps<T>) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
                <div className="h-3 w-3/5 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          {emptyIcon}
          <div className="font-medium text-muted-foreground">{emptyMessage ?? "No data found"}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", gridClassName)}>
      {data.map((item) => (
        <Card key={keyExtractor(item)} className="relative h-full transition hover:-translate-y-0.5 hover:shadow-soft">
          <CardContent className={cn("p-4", cardContentClassName)}>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={i} className={field.className}>
                  {field.label && (
                    <span className="text-xs text-muted-foreground">{field.label}</span>
                  )}
                  <div>{field.render(item)}</div>
                </div>
              ))}
            </div>
            {actions && (
              <div className="mt-3 flex items-center gap-1 border-t pt-3">
                {actions(item)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
