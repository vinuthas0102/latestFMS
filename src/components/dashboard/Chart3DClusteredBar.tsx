import React, { useEffect, useRef } from 'react';
import type HighchartsTypes from 'highcharts';
import Highcharts from './highcharts';

interface Chart3DClusteredBarProps {
  containerId: string;
  title: string;
  categories: string[];
  series: { name: string; data: number[]; color: string }[];
  onBarClick?: (category: string, seriesName: string) => void;
}

export const Chart3DClusteredBar: React.FC<Chart3DClusteredBarProps> = ({
  containerId,
  title,
  categories,
  series,
  onBarClick,
}) => {
  const chartRef = useRef<HighchartsTypes.Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = Highcharts.chart(containerId, {
      chart: {
        type: 'column',
        options3d: {
          enabled: true,
          alpha: 12,
          beta: 12,
          depth: 40,
          viewDistance: 25,
        },
        backgroundColor: 'transparent',
      },
      title: { text: title, style: { fontSize: '14px', fontWeight: '600', color: '#1e3a5f' } },
      xAxis: {
        categories,
        labels: { skew3d: true, style: { fontSize: '11px' } },
      },
      yAxis: {
        title: { text: 'Count', style: { fontSize: '11px' } },
      },
      plotOptions: {
        column: {
          depth: 30,
          dataLabels: { enabled: true, style: { fontSize: '10px' } },
          point: {
            events: {
              click: function (this: HighchartsTypes.Point) {
                if (onBarClick) {
                  onBarClick(this.category as string, this.series.name);
                }
              },
            },
          },
        },
      },
      series: series.map((s) => ({
        name: s.name,
        data: s.data,
        color: s.color,
      })),
      credits: { enabled: false },
      legend: {
        enabled: true,
        itemStyle: { fontSize: '11px' },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [containerId, title, categories, series, onBarClick]);

  return <div id={containerId} className="h-[220px] w-full" />;
};
