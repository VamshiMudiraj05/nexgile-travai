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
      '/guests',
      '/rooms',
      '/properties',
      '/operations',
    ];
    return frontDeskAllowed.some((prefix) => pathname.startsWith(prefix));
  }

  if (role === 'FINANCE') {
    return pathname.startsWith('/finance') || pathname.startsWith('/corporate');
  }

  if (role === 'HOUSEKEEPING') {
    return pathname.startsWith('/housekeeping') || pathname.startsWith('/rooms');
  }

  if (role === 'MAINTENANCE') {
    return pathname.startsWith('/maintenance') || pathname.startsWith('/rooms');
  }

  if (role === 'REVENUE_MANAGER') {
    return (
      pathname.startsWith('/revenue') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/distribution')
    );
  }

  return false;
};
