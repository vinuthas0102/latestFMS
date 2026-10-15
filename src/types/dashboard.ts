export interface MetricBreakdownItem {
  label: string;
  value: number | string;
}

export interface MetricData {
  key: string;
  label: string;
  total: number | string;
  details: MetricBreakdownItem[];
  icon: string;
  color: string;
}

export interface SiteData {
  siteName: string;
  metrics: MetricData[];
}

export interface DrillDownRecord {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  meta: string;
}

export interface DrillDownData {
  metricKey: string;
  breakdownLabel: string;
  records: DrillDownRecord[];
}

export const DASHBOARD_SITES = ['Bacheli', 'Kirandul', 'Donimalai', 'Panna'] as const;
export type DashboardSite = (typeof DASHBOARD_SITES)[number];
