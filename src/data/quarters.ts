export type QuarterType = "Type I" | "Type II" | "Type III" | "Type IV";
export type QuarterStatus = "Vacant" | "Occupied" | "Under Maintenance";
export type QuarterCondition = "Excellent" | "Good" | "Poor";
export type QuarterLocation =
  | "North Block"
  | "South Estate"
  | "East Wing"
  | "West Campus"
  | "Central Quarters";

export interface Quarter {
  id: string;
  quarterType: QuarterType;
  location: QuarterLocation;
  status: QuarterStatus;
  condition: QuarterCondition;
  currentAllottee: string | null;
}

export const QUARTER_TYPES: QuarterType[] = [
  "Type I",
  "Type II",
  "Type III",
  "Type IV",
];

export const LOCATIONS: QuarterLocation[] = [
  "North Block",
  "South Estate",
  "East Wing",
  "West Campus",
  "Central Quarters",
];

export const STATUSES: QuarterStatus[] = ["Vacant", "Occupied", "Under Maintenance"];

export const CONDITIONS: QuarterCondition[] = ["Excellent", "Good", "Poor"];

export const quarters: Quarter[] = [
  { id: "QTR-001", quarterType: "Type I", location: "North Block", status: "Occupied", condition: "Excellent", currentAllottee: "James Carter" },
  { id: "QTR-002", quarterType: "Type II", location: "South Estate", status: "Vacant", condition: "Good", currentAllottee: null },
  { id: "QTR-003", quarterType: "Type III", location: "East Wing", status: "Under Maintenance", condition: "Poor", currentAllottee: null },
  { id: "QTR-004", quarterType: "Type IV", location: "West Campus", status: "Occupied", condition: "Good", currentAllottee: "Priya Nair" },
  { id: "QTR-005", quarterType: "Type I", location: "Central Quarters", status: "Vacant", condition: "Excellent", currentAllottee: null },
  { id: "QTR-006", quarterType: "Type II", location: "North Block", status: "Occupied", condition: "Good", currentAllottee: "Daniel Foster" },
  { id: "QTR-007", quarterType: "Type III", location: "South Estate", status: "Vacant", condition: "Poor", currentAllottee: null },
  { id: "QTR-008", quarterType: "Type IV", location: "East Wing", status: "Under Maintenance", condition: "Good", currentAllottee: null },
  { id: "QTR-009", quarterType: "Type I", location: "West Campus", status: "Occupied", condition: "Excellent", currentAllottee: "Aisha Khan" },
  { id: "QTR-010", quarterType: "Type II", location: "Central Quarters", status: "Vacant", condition: "Good", currentAllottee: null },
  { id: "QTR-011", quarterType: "Type III", location: "North Block", status: "Occupied", condition: "Poor", currentAllottee: "Marcus Lee" },
  { id: "QTR-012", quarterType: "Type IV", location: "South Estate", status: "Vacant", condition: "Excellent", currentAllottee: null },
  { id: "QTR-013", quarterType: "Type I", location: "East Wing", status: "Under Maintenance", condition: "Good", currentAllottee: null },
  { id: "QTR-014", quarterType: "Type II", location: "West Campus", status: "Occupied", condition: "Excellent", currentAllottee: "Sofia Ramirez" },
  { id: "QTR-015", quarterType: "Type III", location: "Central Quarters", status: "Vacant", condition: "Good", currentAllottee: null },
  { id: "QTR-016", quarterType: "Type IV", location: "North Block", status: "Occupied", condition: "Good", currentAllottee: "Liam O'Brien" },
  { id: "QTR-017", quarterType: "Type I", location: "South Estate", status: "Vacant", condition: "Poor", currentAllottee: null },
  { id: "QTR-018", quarterType: "Type II", location: "East Wing", status: "Occupied", condition: "Excellent", currentAllottee: "Hana Tanaka" },
  { id: "QTR-019", quarterType: "Type III", location: "West Campus", status: "Under Maintenance", condition: "Poor", currentAllottee: null },
  { id: "QTR-020", quarterType: "Type IV", location: "Central Quarters", status: "Vacant", condition: "Excellent", currentAllottee: null },
];
