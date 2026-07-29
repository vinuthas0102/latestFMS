import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { FilterPanel, type FilterState } from "@/components/FilterPanel";
import { QuartersTable } from "@/components/QuartersTable";
import { quarters } from "@/data/quarters";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  quarterType: "all",
  location: "all",
  statuses: [],
};

export default function App() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return quarters.filter((q) => {
      if (term) {
        const hay = `${q.id} ${q.currentAllottee ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (filters.quarterType !== "all" && q.quarterType !== filters.quarterType)
        return false;
      if (filters.location !== "all" && q.location !== filters.location)
        return false;
      if (
        filters.statuses.length > 0 &&
        !filters.statuses.includes(q.status)
      )
        return false;
      return true;
    });
  }, [filters]);

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Quarter Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Allocation &amp; filter module for estate admins
              </p>
            </div>
          </div>
        </header>

        {/* Filter panel */}
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          resultCount={filtered.length}
        />

        {/* Data grid */}
        <div className="mt-6">
          <QuartersTable quarters={filtered} />
        </div>
      </div>
    </div>
  );
}
