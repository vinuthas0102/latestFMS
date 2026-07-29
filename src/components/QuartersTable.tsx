import { Building2, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Quarter,
  QuarterCondition,
  QuarterStatus,
} from "@/data/quarters";

interface QuartersTableProps {
  quarters: Quarter[];
}

const STATUS_VARIANT: Record<
  QuarterStatus,
  "success" | "destructive" | "warning"
> = {
  Vacant: "success",
  Occupied: "destructive",
  "Under Maintenance": "warning",
};

const STATUS_DOT: Record<QuarterStatus, string> = {
  Vacant: "bg-success",
  Occupied: "bg-destructive",
  "Under Maintenance": "bg-warning",
};

const CONDITION_TONE: Record<QuarterCondition, string> = {
  Excellent: "text-success",
  Good: "text-foreground",
  Poor: "text-destructive",
};

export function QuartersTable({ quarters }: QuartersTableProps) {
  if (quarters.length === 0) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              No quarters match your filters
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting or clearing the filters above.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Quarter ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Allottee</TableHead>
          </TableRow>
        </TableHeader>
    <TableBody>
      {quarters.map((q) => (
        <TableRow key={q.id} className="group">
          <TableCell className="font-mono text-sm font-medium text-foreground">
            {q.id}
          </TableCell>
          <TableCell className="text-sm text-foreground">{q.quarterType}</TableCell>
          <TableCell className="text-sm text-foreground">{q.location}</TableCell>
          <TableCell>
            <Badge variant={STATUS_VARIANT[q.status]} className="capitalize">
              <span
                className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[q.status]}`}
              />
              {q.status === "Under Maintenance" ? "Maintenance" : q.status}
            </Badge>
          </TableCell>
          <TableCell>
            <span
              className={`text-sm font-medium ${CONDITION_TONE[q.condition]}`}
            >
              {q.condition}
            </span>
          </TableCell>
          <TableCell>
            {q.currentAllottee ? (
              <span className="text-sm text-foreground">{q.currentAllottee}</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserX className="h-3.5 w-3.5" />
                Unassigned
              </span>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
);
}
