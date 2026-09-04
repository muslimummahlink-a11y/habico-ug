import { ReactNode, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Plus, MoreHorizontal, Loader2, Inbox } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type EntityWorkflowConfig, type StatusConfig } from "@/lib/workflow-actions";

const UGX = (n: number) => `UGX ${n.toLocaleString()}`;

function formatValue(val: any, format?: string): string {
  if (val == null || val === "") return "—";
  switch (format) {
    case "currency": return UGX(Number(val));
    case "number": return Number(val).toLocaleString();
    case "date": return val ? new Date(val).toLocaleDateString("en-GB") : "—";
    default: return String(val);
  }
}

export interface CardField<T> {
  key: string;
  label?: string;
  format?: "currency" | "number" | "date" | "status";
  render?: (item: T) => ReactNode;
  className?: string;
}

export interface WorkflowButton {
  label: string;
  icon?: any;
  to?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
}

interface EntityCardGridProps<T> {
  data: T[];
  isLoading?: boolean;
  workflow?: EntityWorkflowConfig;
  searchFields?: (keyof T & string)[];
  filterField?: keyof T & string;
  filterOptions?: { label: string; value: string }[];
  extraFilters?: { label: string; value: string; field: string }[];
  keyExtractor: (item: T) => string;
  titleField: keyof T & string;
  subtitleField?: keyof T & string;
  statusField?: keyof T & string;
  iconField?: ReactNode;
  metricFields?: { key: string; label: string; format?: string }[];
  cardActions?: (item: T) => ReactNode;
  workflowButtons?: (item: T) => WorkflowButton[];
  onCreateNew?: () => void;
  createLabel?: string;
  emptyMessage?: string;
  pageSize?: number;
}

export function EntityCardGrid<T extends Record<string, any>>({
  data,
  isLoading,
  workflow,
  searchFields = [],
  filterField,
  filterOptions,
  extraFilters,
  keyExtractor,
  titleField,
  subtitleField,
  statusField,
  iconField,
  metricFields = [],
  cardActions,
  workflowButtons,
  onCreateNew,
  createLabel = "Create New",
  emptyMessage = "No items found",
  pageSize = 12,
}: EntityCardGridProps<T>) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [extraFilterValues, setExtraFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = data;
    if (search && searchFields.length) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((f) => String(item[f] ?? "").toLowerCase().includes(q))
      );
    }
    if (filterField && activeFilter !== "all") {
      result = result.filter((item) => item[filterField] === activeFilter);
    }
    for (const [field, value] of Object.entries(extraFilterValues)) {
      if (value && value !== "all") {
        result = result.filter((item) => item[field] === value);
      }
    }
    return result;
  }, [data, search, searchFields, filterField, activeFilter, extraFilterValues]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const statusCounts = useMemo(() => {
    if (!filterField || !filterOptions) return {};
    const counts: Record<string, number> = { all: data.length };
    for (const opt of filterOptions) {
      counts[opt.value] = data.filter((item) => item[filterField] === opt.value).length;
    }
    return counts;
  }, [data, filterField, filterOptions]);

  const getStatusConfig = (status: string): StatusConfig | undefined => {
    return workflow?.statuses?.[status];
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {extraFilters?.map((ef) => (
            <select
              key={ef.field}
              value={extraFilterValues[ef.field] ?? "all"}
              onChange={(e) => { setExtraFilterValues((p) => ({ ...p, [ef.field]: e.target.value })); setPage(0); }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">{ef.label}</option>
              {ef.value && <option value={ef.value}>{ef.value}</option>}
            </select>
          ))}
          {onCreateNew && (
            <Button size="sm" onClick={onCreateNew}>
              <Plus className="mr-1.5 h-4 w-4" />
              {createLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      {filterField && filterOptions && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setActiveFilter("all"); setPage(0); }}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              activeFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            All ({statusCounts.all ?? 0})
          </button>
          {filterOptions.map((opt) => {
            const sc = getStatusConfig(opt.value);
            const count = statusCounts[opt.value] ?? 0;
            return (
              <button
                key={opt.value}
                onClick={() => { setActiveFilter(opt.value); setPage(0); }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  activeFilter === opt.value
                    ? cn(sc?.bg, sc?.color, "ring-1 ring-current/20")
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Card grid */}
      {paged.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-sm font-medium text-muted-foreground">{emptyMessage}</div>
            {onCreateNew && (
              <Button variant="outline" size="sm" onClick={onCreateNew}>
                <Plus className="mr-1.5 h-4 w-4" />
                {createLabel}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paged.map((item) => {
            const key = keyExtractor(item);
            const title = String(item[titleField] ?? "Untitled");
            const subtitle = subtitleField ? String(item[subtitleField] ?? "") : "";
            const status = statusField ? String(item[statusField] ?? "") : "";
            const statusCfg = getStatusConfig(status);
            const buttons = workflowButtons?.(item) ?? [];

            return (
              <Card key={key} className="group relative flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="flex flex-row items-start gap-3 p-4 pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {iconField ?? (workflow?.icon ? <workflow.icon className="h-4 w-4" /> : <Inbox className="h-4 w-4" />)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold leading-tight">{title}</h3>
                    {subtitle && (
                      <p className="truncate text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                    )}
                  </div>
                  {status && statusCfg && (
                    <Badge className={cn("shrink-0 text-[10px] font-semibold", statusCfg.bg, statusCfg.color)}>
                      {statusCfg.label}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col p-4 pt-3">
                  {/* Metrics */}
                  {metricFields.length > 0 && (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {metricFields.map((mf) => (
                        <div key={mf.key} className="min-w-0">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{mf.label}</div>
                          <div className="truncate text-xs font-medium">{formatValue(item[mf.key], mf.format)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Workflow action buttons */}
                  {buttons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t pt-3 mt-1">
                      {buttons.slice(0, 3).map((btn, i) => (
                        <Button key={i} size="sm" variant={btn.variant ?? "outline"} className="h-7 text-[11px] px-2" asChild={!!btn.to}>
                          {btn.to ? (
                            <Link to={btn.to}>
                              {btn.icon && <btn.icon className="mr-1 h-3 w-3" />}
                              {btn.label}
                            </Link>
                          ) : (
                            <span onClick={btn.onClick}>
                              {btn.icon && <btn.icon className="mr-1 h-3 w-3" />}
                              {btn.label}
                            </span>
                          )}
                        </Button>
                      ))}
                      {buttons.length > 3 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 px-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {buttons.slice(3).map((btn, i) => (
                              <DropdownMenuItem key={i} asChild={!!btn.to}>
                                {btn.to ? (
                                  <Link to={btn.to}>
                                    {btn.icon && <btn.icon className="mr-2 h-3.5 w-3.5" />}
                                    {btn.label}
                                  </Link>
                                ) : (
                                  <span onClick={btn.onClick}>
                                    {btn.icon && <btn.icon className="mr-2 h-3.5 w-3.5" />}
                                    {btn.label}
                                  </span>
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}

                  {/* Custom card actions */}
                  {cardActions && (
                    <div className="flex items-center gap-1 border-t pt-3 mt-1">
                      {cardActions(item)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum = i;
              if (totalPages > 5) {
                if (page < 3) pageNum = i;
                else if (page > totalPages - 4) pageNum = totalPages - 5 + i;
                else pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
