/**
 * Centralized Role-Based Routing & Access Rules
 * Ensures users are always directed to their designated workspace
 * and prevents cross-role session leaks or stale return-path redirects.
 */

export const getRoleHomePath = (role) => {
  switch (role) {
    case 'FRONT_DESK':
      return '/frontdesk/dashboard';
    case 'FINANCE':
      return '/finance';
    case 'MAINTENANCE':
      return '/maintenance';
    case 'HOUSEKEEPING':
      return '/housekeeping';
    case 'TRAVELER':
      return '/traveler/dashboard';
    case 'REVENUE_MANAGER':
      return '/revenue/recommendations';
    case 'ADMIN':
    default:
      return '/dashboard';
  }
};

export const isPathCompatibleWithRole = (pathname, role) => {
  if (
    !pathname ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/dashboard' ||
    pathname === '/app'
  ) {
    return false;
  }

  // System Administrator has access to all operational consoles
  if (role === 'ADMIN') return true;

  if (role === 'TRAVELER') {
    const travelerAllowed = [
      '/traveler',
      '/marketplace',
      '/my-trips',
      '/loyalty',
      '/profile',
      '/superapp',
      '/concierge',
      '/corporate/expenses',
    ];
    return travelerAllowed.some((prefix) => pathname.startsWith(prefix));
  }

  if (role === 'FRONT_DESK') {
    const frontDeskAllowed = [
      '/frontdesk',
      '/reservations',
      '/housekeeping',
      '/maintenance',
      '/guests',
      '/corporate',
      '/operations',
      '/rooms',
      '/properties',
    ];
    return frontDeskAllowed.some((prefix) => pathname.startsWith(prefix));
  }

  if (role === 'FINANCE') {
    const financeAllowed = [
      '/finance',
      '/reservations',
      '/corporate',
      '/analytics',
    ];
    return financeAllowed.some((prefix) => pathname.startsWith(prefix));
  }

  if (role === 'HOUSEKEEPING') {
    const housekeepingAllowed = ['/housekeeping', '/rooms'];
    return housekeepingAllowed.some((prefix) => pathname.startsWith(prefix));
  }

  if (role === 'MAINTENANCE') {
    const maintenanceAllowed = ['/maintenance', '/rooms'];
    return maintenanceAllowed.some((prefix) => pathname.startsWith(prefix));
  }

  if (role === 'REVENUE_MANAGER') {
    const revenueAllowed = [
      '/revenue',
      '/analytics',
      '/distribution',
      '/properties',
      '/corporate',
      '/marketplace',
    ];
    return revenueAllowed.some((prefix) => pathname.startsWith(prefix));
  }

  return false;
};
