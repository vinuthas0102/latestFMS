import React, { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Gauge,
  Table2,
} from 'lucide-react';
import { SiteSelector } from '../components/dashboard/SiteSelector';
import { ExpandableMetricCard } from '../components/dashboard/ExpandableMetricCard';
import { Chart3DColumn } from '../components/dashboard/Chart3DColumn';
import { Chart3DDonut } from '../components/dashboard/Chart3DDonut';
import { Chart3DClusteredBar } from '../components/dashboard/Chart3DClusteredBar';
import { EstateTopography } from '../components/dashboard/EstateTopography';
import { DrillDownModal } from '../components/dashboard/DrillDownModal';
import { getDrillDownData, getSiteData } from '../services/dashboardService';
import type { DashboardSite, DrillDownData, MetricData } from '../types/dashboard';
import { useAuthStore } from '../stores/authStore';

type ViewMode = 'data' | 'chart';

type MetricGroup = {
  label: string;
  description: string;
  keys: string[];
};

const METRIC_GROUPS: MetricGroup[] = [
  {
    label: 'Housing portfolio',
    description: 'Quarter inventory and occupancy position',
    keys: ['total_quarters', 'quarters_available', 'quarters_occupied'],
  },
  {
    label: 'Maintenance operations',
    description: 'Repairs, tickets, and current workload',
    keys: ['quarters_maintenance', 'maintenance_tickets_total', 'maintenance_tickets_pending'],
  },
  {
    label: 'Resident support',
    description: 'Grievances and community service activity',
    keys: ['grievances_total', 'grievances_pending', 'non_nmdc_allotted'],
  },
  {
    label: 'Bookings and collections',
    description: 'Facility usage, guest stays, and rent position',
    keys: ['facilities_booking', 'guest_house_booking', 'rent_collected', 'rent_pending'],
  },
];

function buildTopographyBlocks(siteName: string) {
  const seedBlocks: Record<string, { name: string; total: number; occupied: number; maintenance: number }[]> = {
    Bacheli: [
      { name: 'Block A', total: 120, occupied: 108, maintenance: 4 },
      { name: 'Block B', total: 110, occupied: 95, maintenance: 5 },
      { name: 'Block C', total: 100, occupied: 92, maintenance: 3 },
      { name: 'Block D', total: 70, occupied: 60, maintenance: 2 },
      { name: 'Block E', total: 50, occupied: 35, maintenance: 1 },
    ],
    Kirandul: [
      { name: 'Block A', total: 100, occupied: 88, maintenance: 8 },
      { name: 'Block B', total: 90, occupied: 82, maintenance: 6 },
      { name: 'Block C', total: 100, occupied: 85, maintenance: 5 },
      { name: 'Block D', total: 90, occupied: 65, maintenance: 3 },
    ],
    Donimalai: [
      { name: 'Block A', total: 80, occupied: 75, maintenance: 3 },
      { name: 'Block B', total: 100, occupied: 95, maintenance: 4 },
      { name: 'Block C', total: 70, occupied: 65, maintenance: 2 },
      { name: 'Block D', total: 50, occupied: 45, maintenance: 1 },
    ],
    Panna: [
      { name: 'Block A', total: 60, occupied: 55, maintenance: 2 },
      { name: 'Block B', total: 70, occupied: 65, maintenance: 2 },
      { name: 'Block C', total: 40, occupied: 35, maintenance: 1 },
      { name: 'Block D', total: 30, occupied: 25, maintenance: 0 },
    ],
  };

  const blocks = seedBlocks[siteName] ?? seedBlocks.Bacheli;
  return blocks.map((block) => ({ ...block, available: block.total - block.occupied - block.maintenance }));
}

function getMetric(metrics: MetricData[], key: string): MetricData | undefined {
  return metrics.find((metric) => metric.key === key);
}

function numericTotal(metric: MetricData | undefined): number {
  return typeof metric?.total === 'number' ? metric.total : 0;
}

export const OperationsDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedSite, setSelectedSite] = useState<DashboardSite>('Bacheli');
  const [viewMode, setViewMode] = useState<ViewMode>('data');
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  const siteData = useMemo(() => getSiteData(selectedSite), [selectedSite]);
  const topographyBlocks = useMemo(() => buildTopographyBlocks(selectedSite), [selectedSite]);

  const summary = useMemo(() => {
    const total = numericTotal(getMetric(siteData.metrics, 'total_quarters'));
    const occupied = numericTotal(getMetric(siteData.metrics, 'quarters_occupied'));
    const available = numericTotal(getMetric(siteData.metrics, 'quarters_available'));
    const maintenance = numericTotal(getMetric(siteData.metrics, 'quarters_maintenance'));
    const pendingTickets = numericTotal(getMetric(siteData.metrics, 'maintenance_tickets_pending'));
    const pendingGrievances = numericTotal(getMetric(siteData.metrics, 'grievances_pending'));

    return {
      total,
      occupied,
      available,
      maintenance,
      occupancyRate: total ? Math.round((occupied / total) * 100) : 0,
      pendingActions: pendingTickets + pendingGrievances,
    };
  }, [siteData]);

  const handleBreakdownClick = useCallback(
    (metricKey: string, label: string, value: number | string) => {
      setDrillDown(getDrillDownData(selectedSite, metricKey, label, value));
      setDrillDownOpen(true);
    },
    [selectedSite],
  );

  const occupancyData = useMemo(() => [
    { name: 'Occupied', y: summary.occupied, color: '#0f766e' },
    { name: 'Available', y: summary.available, color: '#2563eb' },
    { name: 'Maintenance', y: summary.maintenance, color: '#d97706' },
  ], [summary]);

  const metricGroups = useMemo(() => METRIC_GROUPS.map((group) => ({
    ...group,
    metrics: group.keys
      .map((key) => getMetric(siteData.metrics, key))
      .filter((metric): metric is MetricData => Boolean(metric)),
  })).filter((group) => group.metrics.length > 0), [siteData.metrics]);

  const clusteredBarData = useMemo(() => {
    const types = ['Type A', 'Type B', 'Type C'];
    const getValues = (metric: MetricData | undefined) => types.map((type) => {
      const item = metric?.details.find((detail) => detail.label.includes(type));
      return typeof item?.value === 'number' ? Math.max(0, item.value) : 0;
    });

    return [
      { name: 'Occupied', data: getValues(getMetric(siteData.metrics, 'quarters_occupied')), color: '#0f766e' },
      { name: 'Available', data: getValues(getMetric(siteData.metrics, 'quarters_available')), color: '#2563eb' },
      { name: 'Maintenance', data: getValues(getMetric(siteData.metrics, 'quarters_maintenance')), color: '#d97706' },
    ];
  }, [siteData]);

  const columnCharts = useMemo(() => {
    const toChartData = (metric: MetricData | undefined) => ({
      categories: metric?.details.map((detail) => detail.label) ?? [],
      data: metric?.details.map((detail) => typeof detail.value === 'number' ? Math.max(0, detail.value) : 0) ?? [],
    });

    return {
      availability: toChartData(getMetric(siteData.metrics, 'quarters_available')),
      occupied: toChartData(getMetric(siteData.metrics, 'quarters_occupied')),
      grievances: toChartData(getMetric(siteData.metrics, 'grievances_total')),
    };
  }, [siteData]);

  const handleChartBreakdown = useCallback((category: string, seriesName: string) => {
    const metricKey = seriesName === 'Occupied'
      ? 'quarters_occupied'
      : seriesName === 'Available'
        ? 'quarters_available'
        : 'quarters_maintenance';
    const metric = getMetric(siteData.metrics, metricKey);
    const item = metric?.details.find((detail) => detail.label.includes(category));
    handleBreakdownClick(metricKey, category, item?.value ?? 0);
  }, [handleBreakdownClick, siteData.metrics]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <header className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.28),transparent_36%)]" />
        <div className="relative mx-auto max-w-[1440px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-h-12 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Activity size={15} className="shrink-0 text-blue-300" />
              <div className="flex min-w-0 items-center gap-3">
                <h1 className="shrink-0 text-lg font-bold tracking-tight sm:text-xl">Operations Dashboard</h1>
                <p className="hidden truncate text-xs text-slate-300 xl:block">Quarters, service demand, and resident operations across the selected project site.</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-white">{user?.fullName || 'Estate Manager'}</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 p-1 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('data')}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${viewMode === 'data' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'}`}
                >
                  <Table2 size={14} /> Data
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('chart')}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${viewMode === 'chart' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'}`}
                >
                  <BarChart3 size={14} /> Charts
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-3 text-sm sm:px-6 lg:px-8 lg:py-4">
        <section className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
          <span className="hidden shrink-0 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:block">Project sites</span>
          <div className="min-w-0 flex-1">
            <SiteSelector selectedSite={selectedSite} onSelectSite={setSelectedSite} />
          </div>
        </section>

        <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Selected project site</span>
            <h2 className="truncate text-base font-bold tracking-tight text-slate-900">· {selectedSite}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" /> Live snapshot
          </div>
        </div>

        {viewMode === 'data' ? (
          <div key={`data-${selectedSite}`} className="animate-fadeIn">
            <section className="mb-5 grid grid-cols-2 gap-2 lg:grid-cols-5">
              <SummaryCard label="Total quarters" value={summary.total} icon={<Building2 size={18} />} tone="blue" />
              <SummaryCard label="Occupancy rate" value={`${summary.occupancyRate}%`} icon={<Gauge size={18} />} tone="teal" />
              <SummaryCard label="Available units" value={summary.available} icon={<CheckCircle2 size={18} />} tone="green" />
              <SummaryCard label="In maintenance" value={summary.maintenance} icon={<ClipboardList size={18} />} tone="amber" />
              <SummaryCard label="Pending actions" value={summary.pendingActions} icon={<AlertTriangle size={18} />} tone="red" />
            </section>

                <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="shrink-0 text-sm font-bold text-slate-900">Site performance indicators</h3>
                <span className="hidden truncate text-xs text-slate-500 sm:block">· Expand a card to inspect the operational breakdown.</span>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-400"><CircleDot size={13} /> {siteData.metrics.length} indicators</span>
            </div>
            <div className="space-y-3">
              {metricGroups.map((group) => (
                <section key={group.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <h4 className="shrink-0 text-sm font-bold text-slate-800">{group.label}</h4>
                      <span className="hidden truncate text-xs text-slate-500 sm:block">· {group.description}</span>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group.metrics.length} indicators</span>
                  </div>
                  <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {group.metrics.map((metric, index) => (
                      <ExpandableMetricCard key={metric.key} metric={metric} index={index} onBreakdownClick={handleBreakdownClick} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div key={`chart-${selectedSite}`} className="space-y-4 animate-fadeIn">
            <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <ChartPanel title="Occupancy distribution" eyebrow="Portfolio mix">
                <Chart3DDonut containerId="chart-occupancy-donut" title="Occupancy Distribution" data={occupancyData} />
              </ChartPanel>
              <ChartPanel title="Category status comparison" eyebrow="Quarter type performance">
                <Chart3DClusteredBar
                  containerId="chart-category-clustered"
                  title="Category Breakdown by Status"
                  categories={['Type A', 'Type B', 'Type C']}
                  series={clusteredBarData}
                  onBarClick={handleChartBreakdown}
                />
              </ChartPanel>
            </section>
            <section>
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Detailed analysis</p>
                  <h3 className="text-sm font-bold text-slate-900">· Breakdown by operating category</h3>
                </div>
                <span className="hidden text-[11px] font-medium text-slate-400 sm:block">Hover for values · select bars for records</span>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <ChartPanel title="Availability" eyebrow="By quarter type"><Chart3DColumn containerId="chart-availability-3d" title="Quarters Availability Breakdown" categories={columnCharts.availability.categories} data={columnCharts.availability.data} /></ChartPanel>
                <ChartPanel title="Occupied quarters" eyebrow="By quarter type"><Chart3DColumn containerId="chart-occupied-3d" title="Quarters Occupied Breakdown" categories={columnCharts.occupied.categories} data={columnCharts.occupied.data} /></ChartPanel>
                <ChartPanel title="Grievances" eyebrow="Reported categories"><Chart3DColumn containerId="chart-grievances-3d" title="Grievances Breakdown" categories={columnCharts.grievances.categories} data={columnCharts.grievances.data} /></ChartPanel>
              </div>
            </section>
            <EstateTopography siteName={selectedSite} blocks={topographyBlocks} />
          </div>
        )}
      </main>

      <DrillDownModal open={drillDownOpen} data={drillDown} onClose={() => setDrillDownOpen(false)} />
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: 'blue' | 'teal' | 'green' | 'amber' | 'red';
}

const SUMMARY_TONES: Record<SummaryCardProps['tone'], string> = {
  blue: 'border-blue-200 bg-blue-50/60 text-blue-700',
  teal: 'border-teal-200 bg-teal-50/60 text-teal-700',
  green: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50/60 text-amber-700',
  red: 'border-red-200 bg-red-50/60 text-red-700',
};

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, tone }) => (
  <div className={`rounded-lg border-2 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${SUMMARY_TONES[tone]}`}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold leading-4 text-slate-600">{label}</span>
      <span className="opacity-70">{icon}</span>
    </div>
    <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">{value}</p>
  </div>
);

interface ChartPanelProps {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}

const ChartPanel: React.FC<ChartPanelProps> = ({ title, eyebrow, children }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
      <p className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
      <h3 className="truncate text-sm font-bold text-slate-900">· {title}</h3>
    </div>
    <div className="p-2">{children}</div>
  </section>
);
