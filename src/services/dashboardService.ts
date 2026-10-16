import type { SiteData, DrillDownData, DashboardSite, IndividualSite, MetricData } from '../types/dashboard';
import { DASHBOARD_SITES } from '../types/dashboard';

const siteMetrics: Record<IndividualSite, SiteData> = {
  Bacheli: {
    siteName: 'Bacheli',
    metrics: [
      {
        key: 'total_quarters',
        label: 'Total Quarters',
        total: 450,
        icon: 'Building2',
        color: 'blue',
        details: [
          { label: 'Type A (Executive)', value: 150 },
          { label: 'Type B (Staff)', value: 200 },
          { label: 'Type C (Worker)', value: 100 },
        ],
      },
      {
        key: 'quarters_available',
        label: 'Quarters Availability',
        total: 60,
        icon: 'Home',
        color: 'green',
        details: [
          { label: 'Type A (Executive)', value: 10 },
          { label: 'Type B (Staff)', value: 20 },
          { label: 'Type C (Worker)', value: 30 },
        ],
      },
      {
        key: 'quarters_occupied',
        label: 'Quarters Occupied',
        total: 390,
        icon: 'Users',
        color: 'teal',
        details: [
          { label: 'Type A (Executive)', value: 140 },
          { label: 'Type B (Staff)', value: 180 },
          { label: 'Type C (Worker)', value: 70 },
        ],
      },
      {
        key: 'quarters_maintenance',
        label: 'Quarters under Maintenance',
        total: 15,
        icon: 'Wrench',
        color: 'amber',
        details: [
          { label: 'Civil Work', value: 8 },
          { label: 'Plumbing', value: 4 },
          { label: 'Electrical', value: 3 },
        ],
      },
      {
        key: 'maintenance_tickets_total',
        label: 'Total Maintenance Tickets',
        total: 120,
        icon: 'ClipboardList',
        color: 'indigo',
        details: [
          { label: 'Resolved', value: 95 },
          { label: 'In Progress', value: 15 },
          { label: 'Open', value: 10 },
        ],
      },
      {
        key: 'maintenance_tickets_pending',
        label: 'Maintenance Tickets Pending',
        total: 25,
        icon: 'AlertCircle',
        color: 'orange',
        details: [
          { label: 'High Priority', value: 5 },
          { label: 'Medium Priority', value: 10 },
          { label: 'Low Priority', value: 10 },
        ],
      },
      {
        key: 'grievances_total',
        label: 'Total Grievances Raised',
        total: 40,
        icon: 'MessageSquareWarning',
        color: 'rose',
        details: [
          { label: 'Water Supply', value: 15 },
          { label: 'Sanitation', value: 10 },
          { label: 'Other', value: 15 },
        ],
      },
      {
        key: 'grievances_pending',
        label: 'Pending Grievances',
        total: 8,
        icon: 'Clock',
        color: 'red',
        details: [
          { label: 'Water Supply', value: 4 },
          { label: 'Sanitation', value: 2 },
          { label: 'Other', value: 2 },
        ],
      },
      {
        key: 'facilities_booking',
        label: 'Facilities Booking (Halls)',
        total: 12,
        icon: 'CalendarDays',
        color: 'cyan',
        details: [
          { label: 'Marriage Hall', value: 5 },
          { label: 'Convention Hall', value: 7 },
        ],
      },
      {
        key: 'non_nmdc_allotted',
        label: 'Non-NMDC Allotted',
        total: 30,
        icon: 'UserCog',
        color: 'slate',
        details: [
          { label: 'Contractors', value: 20 },
          { label: 'State Police', value: 10 },
        ],
      },
      {
        key: 'guest_house_booking',
        label: 'Guest House Booking',
        total: 18,
        icon: 'BedDouble',
        color: 'purple',
        details: [
          { label: 'VIP Rooms', value: 6 },
          { label: 'Standard Rooms', value: 12 },
        ],
      },
      {
        key: 'rent_collected',
        label: 'Rent Collected (INR)',
        total: '4.5L',
        icon: 'IndianRupee',
        color: 'emerald',
        details: [
          { label: 'Online', value: '3.0L' },
          { label: 'Deduction', value: '1.5L' },
        ],
      },
      {
        key: 'rent_pending',
        label: 'Rent Pending (INR)',
        total: '50K',
        icon: 'Wallet',
        color: 'pink',
        details: [
          { label: 'Current Month', value: '30K' },
          { label: 'Overdue', value: '20K' },
        ],
      },
    ],
  },
  Kirandul: {
    siteName: 'Kirandul',
    metrics: [
      {
        key: 'total_quarters',
        label: 'Total Quarters',
        total: 380,
        icon: 'Building2',
        color: 'blue',
        details: [
          { label: 'Type A', value: 100 },
          { label: 'Type B', value: 180 },
          { label: 'Type C', value: 100 },
        ],
      },
      {
        key: 'quarters_available',
        label: 'Quarters Availability',
        total: 38,
        icon: 'Home',
        color: 'green',
        details: [
          { label: 'Type A', value: 10 },
          { label: 'Type B', value: 30 },
          { label: 'Type C', value: -2 },
        ],
      },
      {
        key: 'quarters_occupied',
        label: 'Quarters Occupied',
        total: 320,
        icon: 'Users',
        color: 'teal',
        details: [
          { label: 'Type A', value: 90 },
          { label: 'Type B', value: 150 },
          { label: 'Type C', value: 80 },
        ],
      },
      {
        key: 'quarters_maintenance',
        label: 'Quarters under Maintenance',
        total: 22,
        icon: 'Wrench',
        color: 'amber',
        details: [
          { label: 'Civil', value: 10 },
          { label: 'Plumbing', value: 7 },
          { label: 'Electrical', value: 5 },
        ],
      },
      {
        key: 'maintenance_tickets_total',
        label: 'Total Maintenance Tickets',
        total: 90,
        icon: 'ClipboardList',
        color: 'indigo',
        details: [
          { label: 'Resolved', value: 70 },
          { label: 'In Progress', value: 0 },
          { label: 'Open', value: 20 },
        ],
      },
      {
        key: 'maintenance_tickets_pending',
        label: 'Maintenance Tickets Pending',
        total: 20,
        icon: 'AlertCircle',
        color: 'orange',
        details: [
          { label: 'High', value: 8 },
          { label: 'Medium', value: 0 },
          { label: 'Low', value: 12 },
        ],
      },
      {
        key: 'grievances_total',
        label: 'Total Grievances Raised',
        total: 30,
        icon: 'MessageSquareWarning',
        color: 'rose',
        details: [
          { label: 'Water', value: 10 },
          { label: 'Power', value: 20 },
        ],
      },
      {
        key: 'grievances_pending',
        label: 'Pending Grievances',
        total: 5,
        icon: 'Clock',
        color: 'red',
        details: [
          { label: 'Water', value: 2 },
          { label: 'Power', value: 3 },
        ],
      },
    ],
  },
  Donimalai: {
    siteName: 'Donimalai',
    metrics: [
      {
        key: 'total_quarters',
        label: 'Total Quarters',
        total: 300,
        icon: 'Building2',
        color: 'blue',
        details: [
          { label: 'Type A', value: 80 },
          { label: 'Type B', value: 150 },
          { label: 'Type C', value: 70 },
        ],
      },
      {
        key: 'quarters_available',
        label: 'Quarters Availability',
        total: 10,
        icon: 'Home',
        color: 'green',
        details: [
          { label: 'Type A', value: 5 },
          { label: 'Type B', value: 10 },
          { label: 'Type C', value: -5 },
        ],
      },
      {
        key: 'quarters_occupied',
        label: 'Quarters Occupied',
        total: 280,
        icon: 'Users',
        color: 'teal',
        details: [
          { label: 'Type A', value: 75 },
          { label: 'Type B', value: 140 },
          { label: 'Type C', value: 65 },
        ],
      },
      {
        key: 'quarters_maintenance',
        label: 'Quarters under Maintenance',
        total: 10,
        icon: 'Wrench',
        color: 'amber',
        details: [
          { label: 'Civil', value: 5 },
          { label: 'Electrical', value: 5 },
        ],
      },
      {
        key: 'maintenance_tickets_total',
        label: 'Total Maintenance Tickets',
        total: 60,
        icon: 'ClipboardList',
        color: 'indigo',
        details: [
          { label: 'Resolved', value: 50 },
          { label: 'In Progress', value: 0 },
          { label: 'Open', value: 10 },
        ],
      },
      {
        key: 'maintenance_tickets_pending',
        label: 'Maintenance Tickets Pending',
        total: 10,
        icon: 'AlertCircle',
        color: 'orange',
        details: [
          { label: 'High', value: 2 },
          { label: 'Medium', value: 0 },
          { label: 'Low', value: 8 },
        ],
      },
      {
        key: 'grievances_total',
        label: 'Total Grievances Raised',
        total: 15,
        icon: 'MessageSquareWarning',
        color: 'rose',
        details: [
          { label: 'Security', value: 5 },
          { label: 'Sanitation', value: 10 },
        ],
      },
      {
        key: 'grievances_pending',
        label: 'Pending Grievances',
        total: 3,
        icon: 'Clock',
        color: 'red',
        details: [
          { label: 'Security', value: 1 },
          { label: 'Sanitation', value: 2 },
        ],
      },
    ],
  },
  Panna: {
    siteName: 'Panna',
    metrics: [
      {
        key: 'total_quarters',
        label: 'Total Quarters',
        total: 200,
        icon: 'Building2',
        color: 'blue',
        details: [
          { label: 'Type A', value: 50 },
          { label: 'Type B', value: 100 },
          { label: 'Type C', value: 50 },
        ],
      },
      {
        key: 'quarters_available',
        label: 'Quarters Availability',
        total: 15,
        icon: 'Home',
        color: 'green',
        details: [
          { label: 'Type A', value: 5 },
          { label: 'Type B', value: 10 },
          { label: 'Type C', value: 0 },
        ],
      },
      {
        key: 'quarters_occupied',
        label: 'Quarters Occupied',
        total: 180,
        icon: 'Users',
        color: 'teal',
        details: [
          { label: 'Type A', value: 45 },
          { label: 'Type B', value: 90 },
          { label: 'Type C', value: 45 },
        ],
      },
      {
        key: 'quarters_maintenance',
        label: 'Quarters under Maintenance',
        total: 5,
        icon: 'Wrench',
        color: 'amber',
        details: [
          { label: 'Plumbing', value: 3 },
          { label: 'Civil', value: 2 },
        ],
      },
      {
        key: 'maintenance_tickets_total',
        label: 'Total Maintenance Tickets',
        total: 45,
        icon: 'ClipboardList',
        color: 'indigo',
        details: [
          { label: 'Resolved', value: 40 },
          { label: 'In Progress', value: 0 },
          { label: 'Open', value: 5 },
        ],
      },
      {
        key: 'maintenance_tickets_pending',
        label: 'Maintenance Tickets Pending',
        total: 5,
        icon: 'AlertCircle',
        color: 'orange',
        details: [
          { label: 'High', value: 1 },
          { label: 'Medium', value: 0 },
          { label: 'Low', value: 4 },
        ],
      },
      {
        key: 'grievances_total',
        label: 'Total Grievances Raised',
        total: 10,
        icon: 'MessageSquareWarning',
        color: 'rose',
        details: [
          { label: 'Misc', value: 10 },
        ],
      },
      {
        key: 'grievances_pending',
        label: 'Pending Grievances',
        total: 2,
        icon: 'Clock',
        color: 'red',
        details: [
          { label: 'Misc', value: 2 },
        ],
      },
    ],
  },
};

function generateDrillDownRecords(
  siteName: string,
  metricKey: string,
  breakdownLabel: string,
  count: number,
): DrillDownData['records'] {
  const records: DrillDownData['records'] = [];
  const numCount = typeof count === 'number' ? Math.min(count, 12) : 3;

  for (let i = 0; i < numCount; i++) {
    const id = `${siteName.slice(0, 3).toUpperCase()}-${metricKey.slice(0, 4).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;

    if (metricKey.includes('quarters') || metricKey === 'total_quarters') {
      records.push({
        id,
        title: `Quarter Q-${100 + i}`,
        subtitle: `Block ${String.fromCharCode(65 + (i % 4))}, Floor ${1 + (i % 3)}`,
        status: breakdownLabel,
        meta: `${siteName} Township`,
      });
    } else if (metricKey.includes('maintenance') || metricKey.includes('grievance')) {
      records.push({
        id,
        title: `Ticket #${5000 + i}`,
        subtitle: `${breakdownLabel} — ${siteName}`,
        status: metricKey.includes('pending') ? 'Pending' : 'Open',
        meta: `Created ${new Date(2026, 9, 15 - i).toLocaleDateString()}`,
      });
    } else if (metricKey.includes('facilities') || metricKey.includes('guest_house')) {
      records.push({
        id,
        title: `Booking BK${2026010 + i}`,
        subtitle: `${breakdownLabel}`,
        status: i % 3 === 0 ? 'Confirmed' : i % 3 === 1 ? 'Pending' : 'Completed',
        meta: `${new Date(2026, 9, 10 + i).toLocaleDateString()} — ${new Date(2026, 9, 12 + i).toLocaleDateString()}`,
      });
    } else if (metricKey.includes('non_nmdc')) {
      records.push({
        id,
        title: `Allotment AL-${200 + i}`,
        subtitle: `${breakdownLabel}`,
        status: 'Allotted',
        meta: `Resident: ${['R. Sharma', 'K. Verma', 'S. Nair', 'P. Reddy'][i % 4]}`,
      });
    } else if (metricKey.includes('rent')) {
      records.push({
        id,
        title: `Demand DM-${300 + i}`,
        subtitle: `${breakdownLabel}`,
        status: metricKey.includes('pending') ? 'Due' : 'Paid',
        meta: `Amount: ₹${(5000 + i * 1500).toLocaleString()}`,
      });
    } else {
      records.push({
        id,
        title: `Record ${i + 1}`,
        subtitle: `${breakdownLabel} — ${siteName}`,
        status: 'Active',
        meta: '',
      });
    }
  }

  return records;
}

function aggregateAllSites(): SiteData {
  const allMetrics: Record<string, MetricData> = {};

  for (const site of DASHBOARD_SITES) {
    const data = siteMetrics[site];
    for (const metric of data.metrics) {
      if (!allMetrics[metric.key]) {
        allMetrics[metric.key] = {
          ...metric,
          total: 0,
          details: metric.details.map((d) => ({ ...d, value: 0 })),
        };
      }
      const agg = allMetrics[metric.key];
      if (typeof metric.total === 'number') {
        agg.total = (typeof agg.total === 'number' ? agg.total : 0) + metric.total;
      }
      for (let i = 0; i < metric.details.length; i++) {
        const detail = metric.details[i];
        const aggDetail = agg.details[i];
        if (aggDetail && typeof detail.value === 'number' && typeof aggDetail.value === 'number') {
          aggDetail.value += detail.value;
        }
      }
    }
  }

  return {
    siteName: 'All NMDC Sites',
    metrics: Object.values(allMetrics),
  };
}

export function getSiteData(site: DashboardSite): SiteData {
  if (site === 'All NMDC Sites') return aggregateAllSites();
  return siteMetrics[site];
}

export function getDrillDownData(
  site: DashboardSite,
  metricKey: string,
  breakdownLabel: string,
  count: number | string,
): DrillDownData {
  const siteData = getSiteData(site);
  const numCount = typeof count === 'number' ? count : 3;
  const records = generateDrillDownRecords(siteData.siteName, metricKey, breakdownLabel, numCount);

  return {
    metricKey,
    breakdownLabel,
    records,
  };
}
