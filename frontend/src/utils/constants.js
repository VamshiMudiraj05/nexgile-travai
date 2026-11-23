export const USER_ROLES = {
  ADMIN: 'ADMIN',
  FRONT_DESK: 'FRONT_DESK',
  REVENUE_MANAGER: 'REVENUE_MANAGER',
  HOUSEKEEPING: 'HOUSEKEEPING',
  MAINTENANCE: 'MAINTENANCE',
  FINANCE: 'FINANCE',
  TRAVELER: 'TRAVELER',
};

export const ROLE_OPTIONS = [
  { value: USER_ROLES.ADMIN, label: 'Administrator (Full Access)' },
  { value: USER_ROLES.FRONT_DESK, label: 'Front Desk Agent' },
  { value: USER_ROLES.REVENUE_MANAGER, label: 'Revenue Manager' },
  { value: USER_ROLES.HOUSEKEEPING, label: 'Housekeeping Staff' },
  { value: USER_ROLES.MAINTENANCE, label: 'Maintenance Specialist' },
  { value: USER_ROLES.FINANCE, label: 'Finance & Accounts' },
  { value: USER_ROLES.TRAVELER, label: 'Traveler / Guest' },
];

export const ROLE_BADGE_COLORS = {
  ADMIN: 'bg-[#1B1E3D] text-[#DFB76C] border-[#DFB76C]/40 shadow-xs',
  FRONT_DESK: 'bg-[#1B1E3D] text-[#E0E2F0] border-[#2C315E] shadow-xs',
  REVENUE_MANAGER: 'bg-[#1B1E3D] text-[#DFB76C] border-[#2C315E] shadow-xs',
  HOUSEKEEPING: 'bg-[#1B1E3D] text-[#FAF6F0]/80 border-[#2C315E] shadow-xs',
  MAINTENANCE: 'bg-[#1B1E3D] text-[#E5C396] border-[#2C315E] shadow-xs',
  FINANCE: 'bg-[#1B1E3D] text-[#DFB76C] border-[#2C315E] shadow-xs',
  TRAVELER: 'bg-[#1B1E3D] text-[#DFB76C] border-[#2C315E] shadow-xs',
};
