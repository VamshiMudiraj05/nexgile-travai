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
  ADMIN: 'bg-[#13152C] text-[#DFB76C] border-[#DFB76C]/40',
  FRONT_DESK: 'bg-[#1B1E3D] text-[#FAF6F0] border-[#2C315E]',
  REVENUE_MANAGER: 'bg-[#F4EFE6] text-[#B88E43] border-[#DFB76C]/50',
  HOUSEKEEPING: 'bg-[#ECE5DA] text-[#13152C] border-[#2C315E]/30',
  MAINTENANCE: 'bg-[#F4EFE6] text-[#8C5E32] border-[#8C5E32]/30',
  FINANCE: 'bg-[#13152C] text-[#F2D59B] border-[#2C315E]',
  TRAVELER: 'bg-[#FAF6F0] text-[#13152C] border-[#DFB76C]/60',
};
