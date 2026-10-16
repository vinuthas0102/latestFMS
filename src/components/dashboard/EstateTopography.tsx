import React, { useEffect, useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import type HighchartsTypes from 'highcharts';
import Highcharts from './highcharts';

interface TopographyBlock {
  name: string;
  total: number;
  occupied: number;
  maintenance: number;
  available: number;
}

interface EstateTopographyProps {
  siteName: string;
  blocks: TopographyBlock[];
}

const STATUS_COLORS = {
  occupied: '#16a34a',
  available: '#2563eb',
  maintenance: '#dc2626',
};

export const EstateTopography: React.FC<EstateTopographyProps> = ({ siteName, blocks }) => {
  const chartRef = useRef<HighchartsTypes.Chart | null>(null);
  const containerId = 'estate-topography-chart';
  const chartHeight = Math.max(280, blocks.length * 42 + 88);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = Highcharts.chart(containerId, {
      chart: {
        type: 'bar',
        inverted: true,
        height: chartHeight,
        backgroundColor: 'transparent',
        spacing: [8, 12, 8, 8],
        options3d: { enabled: false },
      },
      title: { text: undefined },
      xAxis: {
        categories: blocks.map((block) => block.name),
        lineColor: '#cbd5e1',
        tickColor: '#cbd5e1',
        labels: {
          style: { fontSize: '11px', color: '#334155', fontWeight: '600' },
          padding: 4,
        },
      },
      yAxis: {
        min: 0,
        title: { text: 'Units', style: { fontSize: '11px', color: '#64748b' } },
        gridLineColor: '#e2e8f0',
        labels: { style: { fontSize: '10px', color: '#64748b' } },
        stackLabels: {
          enabled: true,
          style: { fontSize: '10px', fontWeight: '600', color: '#475569', textOutline: 'none' },
        },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        headerFormat: '<span style="font-size:12px;font-weight:600">{point.key}</span><br/>',
        pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y}</b><br/>',
        footerFormat: '<span style="color:#64748b">Total: <b>{point.total}</b></span>',
      },
      plotOptions: {
        series: {
          stacking: 'normal',
          borderWidth: 0,
          pointPadding: 0.08,
          groupPadding: 0.12,
          dataLabels: {
            enabled: true,
            inside: true,
            formatter: function () {
              return typeof this.y === 'number' && this.y > 0 ? String(this.y) : '';
            },
            style: { fontSize: '10px', fontWeight: '700', color: '#ffffff', textOutline: 'none' },
          },
        },
      },
      series: [
        { name: 'Occupied', color: STATUS_COLORS.occupied, data: blocks.map((block) => Math.max(0, block.occupied)) },
        { name: 'Available', color: STATUS_COLORS.available, data: blocks.map((block) => Math.max(0, block.available)) },
        { name: 'Maintenance', color: STATUS_COLORS.maintenance, data: blocks.map((block) => Math.max(0, block.maintenance)) },
      ],
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: { fontSize: '11px', fontWeight: '600', color: '#475569' },
        symbolRadius: 3,
      },
      credits: { enabled: false },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [blocks, chartHeight]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 size={18} className="text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-800">Estate Topography — {siteName}</h3>
      </div>
      <div id={containerId} className="w-full" style={{ minHeight: chartHeight }} aria-label={`Estate occupancy chart for ${siteName}`} />
    </div>
  );
};
