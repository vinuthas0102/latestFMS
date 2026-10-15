import React, { useEffect, useRef } from 'react';
import Highcharts from './highcharts';

interface Chart3DDonutProps {
  containerId: string;
  title: string;
  data: { name: string; y: number; color: string }[];
}

export const Chart3DDonut: React.FC<Chart3DDonutProps> = ({ containerId, title, data }) => {
  const chartRef = useRef<Highcharts.Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = Highcharts.chart(containerId, {
      chart: {
        type: 'pie',
        options3d: {
          enabled: true,
          alpha: 45,
          beta: 0,
        },
        backgroundColor: 'transparent',
      },
      title: { text: title, style: { fontSize: '14px', fontWeight: '600', color: '#1e3a5f' } },
      plotOptions: {
        pie: {
          innerSize: 120,
          depth: 45,
          dataLabels: {
            enabled: true,
            format: '{point.name}: {point.percentage:.1f}%',
            style: { fontSize: '11px' },
          },
        },
      },
      series: [
        {
          name: 'Count',
          data,
        },
      ],
      credits: { enabled: false },
      tooltip: {
        pointFormat: '{point.name}: <b>{point.y}</b> ({point.percentage:.1f}%)',
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [containerId, title, data]);

  return <div id={containerId} className="w-full h-[350px]" />;
};
