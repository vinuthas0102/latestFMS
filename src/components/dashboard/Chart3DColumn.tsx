import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import Highcharts3D from 'highcharts-3d';

Highcharts3D(Highcharts);

interface Chart3DColumnProps {
  containerId: string;
  title: string;
  categories: string[];
  data: number[];
}

export const Chart3DColumn: React.FC<Chart3DColumnProps> = ({ containerId, title, categories, data }) => {
  const chartRef = useRef<Highcharts.Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = Highcharts.chart(containerId, {
      chart: {
        type: 'column',
        options3d: {
          enabled: true,
          alpha: 15,
          beta: 15,
          depth: 50,
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
          depth: 25,
          colorByPoint: true,
          dataLabels: { enabled: true, style: { fontSize: '10px' } },
        },
      },
      series: [
        {
          name: 'Count',
          data,
        },
      ],
      credits: { enabled: false },
      legend: { enabled: false },
      colors: ['#2563eb', '#16a34a', '#f59e0b', '#0891b2', '#7c3aed', '#dc2626'],
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [containerId, title, categories, data]);

  return <div id={containerId} className="w-full h-[350px]" />;
};
