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
export type IndividualSite = (typeof DASHBOARD_SITES)[number];
export type DashboardSite = IndividualSite | 'All NMDC Sites';

export const ALL_SITES: DashboardSite[] = ['All NMDC Sites', ...DASHBOARD_SITES];

export type DateRangeKey = 'Q1 2026' | 'Q2 2026' | 'Q3 2026' | 'Q4 2026' | 'YTD 2026' | 'Custom';

export interface DateRangeOption {
  key: DateRangeKey;
  label: string;
  start: string;
  end: string;
}

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { key: 'Q1 2026', label: 'Q1 2026', start: '2026-01-01', end: '2026-03-31' },
  { key: 'Q2 2026', label: 'Q2 2026', start: '2026-04-01', end: '2026-06-30' },
  { key: 'Q3 2026', label: 'Q3 2026', start: '2026-07-01', end: '2026-09-30' },
  { key: 'Q4 2026', label: 'Q4 2026', start: '2026-10-01', end: '2026-12-31' },
  { key: 'YTD 2026', label: 'Year-to-Date 2026', start: '2026-01-01', end: '2026-10-16' },
  { key: 'Custom', label: 'Custom Range', start: '', end: '' },
];
