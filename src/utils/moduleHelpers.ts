interface PropertyModule {
  code: string;
  name?: string;
}

export const requiresLoginForBooking = (moduleCode?: string): boolean => {
  return moduleCode === 'GOVT_FAC';
};

export const isPublicBooking = (moduleCode?: string): boolean => {
  return moduleCode === 'OTHER_FAC';
};

export const getBookingButtonText = (
  moduleCode?: string,
  isAuthenticated?: boolean
): string => {
  if (requiresLoginForBooking(moduleCode)) {
    return isAuthenticated ? 'Book Now' : 'Login to Book';
  }
  return 'Book Now';
};

export const getModuleBadgeText = (moduleCode?: string): string | null => {
  if (isPublicBooking(moduleCode)) {
    return 'Open to Public';
  }
  if (requiresLoginForBooking(moduleCode)) {
    return 'Login Required';
  }
  return null;
};

export const getModuleBadgeStyles = (moduleCode?: string): string => {
  if (isPublicBooking(moduleCode)) {
    return 'bg-green-100 text-green-700 border-green-200';
  }
  if (requiresLoginForBooking(moduleCode)) {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

export const canUserBookProperty = (
  moduleCode?: string,
  isAuthenticated?: boolean
): boolean => {
  if (requiresLoginForBooking(moduleCode)) {
    return isAuthenticated === true;
  }
  return true;
};
