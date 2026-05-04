import { UserRole } from '../types';
import { ROUTES } from '../constants/routes';

export interface SidebarItem {
  label: string;
  route: string;
  iconName: string;
}

export interface SidebarModule {
  title: string;
  iconName: string;
  route: string;
  items: SidebarItem[];
}

export function getSidebarModules(role: UserRole): SidebarModule[] {
  switch (role) {
    case 'govt_official':
      return [
        {
          title: 'Quarters',
          iconName: 'Home',
          route: ROUTES.QUARTERS_FREEVIEW,
          items: [
            { label: 'Browse Quarters', route: ROUTES.QUARTERS_FREEVIEW, iconName: 'Home' },
            { label: 'My Requests', route: ROUTES.QUARTERS_REQUESTS, iconName: 'FileText' },
            { label: 'Rent', route: ROUTES.QUARTERS_RENT, iconName: 'IndianRupee' },
          ],
        },
        {
          title: 'Facilities',
          iconName: 'Building2',
          route: ROUTES.DASHBOARD,
          items: [
            { label: 'Browse Properties', route: ROUTES.DASHBOARD, iconName: 'LayoutDashboard' },
            { label: 'My Bookings', route: '/bookings/history', iconName: 'Calendar' },
          ],
        },
      ];

    case 'admin':
      return [
        {
          title: 'Facilities',
          iconName: 'Building2',
          route: ROUTES.PROPERTIES,
          items: [
            { label: 'Properties', route: ROUTES.PROPERTIES, iconName: 'Building2' },
            { label: 'Check-In', route: ROUTES.CHECK_IN, iconName: 'UserCheck' },
            { label: 'Manager', route: ROUTES.MANAGER, iconName: 'Settings' },
            { label: 'Maintenance', route: ROUTES.MAINTENANCE, iconName: 'Wrench' },
            { label: 'Links', route: '/ad-hoc-links', iconName: 'Link' },
          ],
        },
        {
          title: 'Quarters',
          iconName: 'Home',
          route: ROUTES.QUARTERS_MANAGER,
          items: [
            { label: 'Quarters Manager', route: ROUTES.QUARTERS_MANAGER, iconName: 'Home' },
          ],
        },
        {
          title: 'Admin',
          iconName: 'Shield',
          route: ROUTES.ADMIN,
          items: [
            { label: 'Admin Panel', route: ROUTES.ADMIN, iconName: 'Shield' },
          ],
        },
      ];

    case 'manager':
      return [
        {
          title: 'Facilities',
          iconName: 'Building2',
          route: ROUTES.PROPERTIES,
          items: [
            { label: 'Properties', route: ROUTES.PROPERTIES, iconName: 'Building2' },
            { label: 'Check-In', route: ROUTES.CHECK_IN, iconName: 'UserCheck' },
            { label: 'Manager', route: ROUTES.MANAGER, iconName: 'Settings' },
            { label: 'Maintenance', route: ROUTES.MAINTENANCE, iconName: 'Wrench' },
            { label: 'Links', route: '/ad-hoc-links', iconName: 'Link' },
          ],
        },
        {
          title: 'Quarters',
          iconName: 'Home',
          route: ROUTES.QUARTERS_MANAGER,
          items: [
            { label: 'Quarters Manager', route: ROUTES.QUARTERS_MANAGER, iconName: 'Home' },
          ],
        },
      ];

    case 'dept_user':
    case 'public':
    default:
      return [
        {
          title: 'Facilities',
          iconName: 'Building2',
          route: ROUTES.DASHBOARD,
          items: [
            { label: 'My Dashboard', route: ROUTES.DASHBOARD, iconName: 'LayoutDashboard' },
            { label: 'My Bookings', route: '/bookings/history', iconName: 'Calendar' },
          ],
        },
      ];
  }
}
