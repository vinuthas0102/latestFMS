import React, { useState, useMemo, useCallback } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { SiteSelector } from '../components/dashboard/SiteSelector';
import { ExpandableMetricCard } from '../components/dashboard/ExpandableMetricCard';
import { Chart3DColumn } from '../components/dashboard/Chart3DColumn';
import { Chart3DDonut } from '../components/dashboard/Chart3DDonut';
import { Chart3DClusteredBar } from '../components/dashboard/Chart3DClusteredBar';
import { EstateTopography } from '../components/dashboard/EstateTopography';
import { DrillDownModal } from '../components/dashboard/DrillDownModal';
import { getSiteData, getDrillDownData } from '../services/dashboardService';
import type { DashboardSite, DrillDownData } from '../types/dashboard';
import { useAuthStore } from '../stores/authStore';

type ViewMode = 'data' | 'chart';

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
  return blocks.map((b) => ({
    ...b,
    available: b.total - b.occupied - b.maintenance,
  }));
}

export const OperationsDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedSite, setSelectedSite] = useState<DashboardSite>('Bacheli');
  const [viewMode, setViewMode] = useState<ViewMode>('data');
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  const siteData = useMemo(() => getSiteData(selectedSite), [selectedSite]);
  const topographyBlocks = useMemo(() => buildTopographyBlocks(selectedSite), [selectedSite]);

  const handleBreakdownClick = useCallback(
    (metricKey: string, label: string, value: number | string) => {
      const data = getDrillDownData(selectedSite, metricKey, label, value);
      setDrillDown(data);
      setDrillDownOpen(true);
    },
    [selectedSite],
  );

  const occupancyData = useMemo(() => {
    const availMetric = siteData.metrics.find((m) => m.key === 'quarters_available');
    const occupiedMetric = siteData.metrics.find((m) => m.key === 'quarters_occupied');
    const maintMetric = siteData.metrics.find((m) => m.key === 'quarters_maintenance');

    const avail = typeof availMetric?.total === 'number' ? availMetric.total : 0;
    const occupied = typeof occupiedMetric?.total === 'number' ? occupiedMetric.total : 0;
    const maintenance = typeof maintMetric?.total === 'number' ? maintMetric.total : 0;

    return [
      { name: 'Occupied', y: occupied, color: '#16a34a' },
      { name: 'Available', y: avail, color: '#2563eb' },
      { name: 'Maintenance', y: maintenance, color: '#dc2626' },
    ];
  }, [siteData]);

  const clusteredBarData = useMemo(() => {
    const types = ['Type A', 'Type B', 'Type C'];
    const availMetric = siteData.metrics.find((m) => m.key === 'quarters_available');
    const occupiedMetric = siteData.metrics.find((m) => m.key === 'quarters_occupied');
    const maintMetric = siteData.metrics.find((m) => m.key === 'quarters_maintenance');

    const getValues = (metric: typeof availMetric) =>
      types.map((type) => {
        const item = metric?.details.find((d) => d.label.startsWith(type.split(' ')[1]) || d.label.includes(type));
        return typeof item?.value === 'number' ? item.value : 0;
      });

    return [
      { name: 'Occupied', data: getValues(occupiedMetric), color: '#16a34a' },
      { name: 'Available', data: getValues(availMetric), color: '#2563eb' },
      { name: 'Maintenance', data: getValues(maintMetric), color: '#dc2626' },
    ];
  }, [siteData]);

  const columnCharts = useMemo(() => {
    const availMetric = siteData.metrics.find((m) => m.key === 'quarters_available');
    const occupiedMetric = siteData.metrics.find((m) => m.key === 'quarters_occupied');
    const grievancesMetric = siteData.metrics.find((m) => m.key === 'grievances_total');

    const toChartData = (metric: typeof availMetric) => {
      if (!metric) return { categories: [] as string[], data: [] as number[] };
      const categories = metric.details.map((d) => d.label);
      const data = metric.details.map((d) => (typeof d.value === 'number' ? d.value : 0));
      return { categories, data };
    };

    return {
      availability: toChartData(availMetric),
      occupied: toChartData(occupiedMetric),
      grievances: toChartData(grievancesMetric),
    };
  }, [siteData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold">Operations Dashboard</h1>
              <p className="text-blue-200 text-sm mt-0.5">
                Quarters Management System — {user?.fullName || 'Estate Manager'}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('data')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'data' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:text-white'
                }`}
              >
                <Table2 size={16} />
                Data View
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'chart' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:text-white'
                }`}
              >
                <BarChart3 size={16} />
                Chart View
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Site Selector */}
        <div className="mb-6">
          <SiteSelector selectedSite={selectedSite} onSelectSite={setSelectedSite} />
        </div>

        {/* Site Title */}
        <div className="mb-6 pb-3 border-b-2 border-blue-600">
          <h2 className="text-lg font-bold text-blue-800">{selectedSite} Project Site Details</h2>
        </div>

        {viewMode === 'data' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {siteData.metrics.map((metric) => (
              <ExpandableMetricCard
                key={metric.key}
                metric={metric}
                onBreakdownClick={handleBreakdownClick}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Donut + Clustered Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <Chart3DDonut
                  containerId="chart-occupancy-donut"
                  title="Occupancy Distribution"
                  data={occupancyData}
                />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <Chart3DClusteredBar
                  containerId="chart-category-clustered"
                  title="Category Breakdown by Status"
                  categories={['Type A', 'Type B', 'Type C']}
                  series={clusteredBarData}
                  onBarClick={(cat, seriesName) =>
                    handleBreakdownClick(
                      seriesName === 'Occupied' ? 'quarters_occupied' : seriesName === 'Available' ? 'quarters_available' : 'quarters_maintenance',
                      cat,
                      0,
                    )
                  }
                />
              </div>
            </div>

            {/* 3D Column Charts */}
            <div>
              <div className="mb-4 pb-2 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-700">3D Column Charts — Detailed Breakdown</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <Chart3DColumn
                    containerId="chart-availability-3d"
                    title="Quarters Availability Breakdown"
                    categories={columnCharts.availability.categories}
                    data={columnCharts.availability.data}
                  />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <Chart3DColumn
                    containerId="chart-occupied-3d"
                    title="Quarters Occupied Breakdown"
                    categories={columnCharts.occupied.categories}
                    data={columnCharts.occupied.data}
                  />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <Chart3DColumn
                    containerId="chart-grievances-3d"
                    title="Grievances Breakdown"
                    categories={columnCharts.grievances.categories}
                    data={columnCharts.grievances.data}
                  />
                </div>
              </div>
            </div>

            {/* Estate Topography */}
            <EstateTopography siteName={selectedSite} blocks={topographyBlocks} />
          </div>
        )}
      </div>

      <DrillDownModal open={drillDownOpen} data={drillDown} onClose={() => setDrillDownOpen(false)} />
    </div>
  );
};
