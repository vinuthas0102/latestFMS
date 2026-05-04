import { UserRole } from '../types';
import { ROUTES } from '../constants/routes';

export interface ModuleTab {
  title: string;
  iconName: string;
  route: string;
  /** Prefix used for active-state detection */
  activePrefix: string;
}

export function getModuleTabs(role: UserRole): ModuleTab[] {
  switch (role) {
    case 'govt_official':
      return [
        {
          title: 'Facilities',
          iconName: 'Building2',
          route: ROUTES.DASHBOARD,
          activePrefix: '/dashboard',
        },
        {
          title: 'Quarters',
          iconName: 'Home',
          route: ROUTES.QUARTERS_FREEVIEW,
          activePrefix: '/quarters',
        },
        {
          title: 'Rent',
          iconName: 'IndianRupee',
          route: ROUTES.QUARTERS_RENT,
          activePrefix: '/quarters/rent',
        },
      ];

    case 'admin':
    case 'manager':
      return [
        {
          title: 'Facilities',
          iconName: 'Building2',
          route: ROUTES.PROPERTIES,
          activePrefix: '/properties',
        },
        {
          title: 'Quarters',
          iconName: 'Home',
          route: ROUTES.QUARTERS_MANAGER,
          activePrefix: '/quarters',
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
          activePrefix: '/dashboard',
        },
      ];
  }
}
