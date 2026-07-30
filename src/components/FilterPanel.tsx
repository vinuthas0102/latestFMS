import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QUARTER_TYPES,
  LOCATIONS,
  STATUSES,
  type QuarterType,
  type QuarterLocation,
  type QuarterStatus,
} from "@/data/quarters";

export interface FilterState {
  search: string;
  quarterType: QuarterType | "all";
  location: QuarterLocation | "all";
  statuses: QuarterStatus[];
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClear: () => void;
  resultCount: number;
}

export function FilterPanel({
  filters,
  onChange,
  onClear,
  resultCount,
}: FilterPanelProps) {
  const toggleStatus = (status: QuarterStatus) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  };

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.quarterType !== "all" ||
    filters.location !== "all" ||
    filters.statuses.length > 0;

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-5 py-3.5">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {/* Search row */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Quarter ID or Allottee"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Controls row */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {/* Quarter Type */}
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Quarter Type
            </label>
            <Select
              value={filters.quarterType}
              onValueChange={(value) =>
                onChange({ ...filters, quarterType: value as QuarterType | "all" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {QUARTER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Location
            </label>
            <Select
              value={filters.location}
              onValueChange={(value) =>
                onChange({ ...filters, location: value as QuarterLocation | "all" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status multi-select */}
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <div className="flex h-10 flex-wrap items-center gap-x-5 gap-y-2 rounded-md border border-input bg-background px-3">
              {STATUSES.map((status) => {
                const checked = filters.statuses.includes(status);
                return (
                  <label
                    key={status}
                    className="flex cursor-pointer select-none items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <span
                      className={
                        checked
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {status === "Under Maintenance" ? "Maintenance" : status}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Clear */}
          <div className="lg:pb-0">
            <Button
              variant="outline"
              onClick={onClear}
              disabled={!hasActiveFilters}
              className="w-full lg:w-auto"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
