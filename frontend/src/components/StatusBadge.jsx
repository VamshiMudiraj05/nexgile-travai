import React from 'react';

const STATUS_CONFIGS = {
  // Room Statuses
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-[#F2F8F4]',
    text: 'text-[#2D5A40]',
    border: 'border-[#2D5A40]/30',
    dot: 'bg-[#3E7D59]',
  },
  OCCUPIED: {
    label: 'Occupied',
    bg: 'bg-[#13152C]/10',
    text: 'text-[#13152C]',
    border: 'border-[#13152C]/25',
    dot: 'bg-[#DFB76C]',
  },
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-[#F4EFE6]',
    text: 'text-[#B88E43]',
    border: 'border-[#DFB76C]/40',
    dot: 'bg-[#B88E43]',
  },
  CLEANING: {
    label: 'Cleaning',
    bg: 'bg-[#FBF6ED]',
    text: 'text-[#A0702A]',
    border: 'border-[#DFB76C]/35',
    dot: 'bg-[#DFB76C]',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    bg: 'bg-[#FDF3EE]',
    text: 'text-[#9A4E2B]',
    border: 'border-[#9A4E2B]/25',
    dot: 'bg-[#9A4E2B]',
  },
  OUT_OF_ORDER: {
    label: 'Out of Order',
    bg: 'bg-[#F4F4F5]',
    text: 'text-[#52525B]',
    border: 'border-[#52525B]/25',
    dot: 'bg-[#71717A]',
  },

  // Reservation Statuses
  PENDING: {
    label: 'Pending',
    bg: 'bg-[#FBF6ED]',
    text: 'text-[#A0702A]',
    border: 'border-[#DFB76C]/35',
    dot: 'bg-[#DFB76C]',
  },
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'bg-[#13152C]',
    text: 'text-[#DFB76C]',
    border: 'border-[#2C315E]',
    dot: 'bg-[#DFB76C]',
  },
  CHECKED_IN: {
    label: 'Checked In',
    bg: 'bg-[#F2F8F4]',
    text: 'text-[#2D5A40]',
    border: 'border-[#2D5A40]/30',
    dot: 'bg-[#3E7D59]',
  },
  CHECKED_OUT: {
    label: 'Checked Out',
    bg: 'bg-[#ECE5DA]',
    text: 'text-[#4A4740]',
    border: 'border-[#4A4740]/25',
    dot: 'bg-[#78746D]',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-[#FDF2F2]',
    text: 'text-[#993A3A]',
    border: 'border-[#993A3A]/25',
    dot: 'bg-[#993A3A]',
  },
  NO_SHOW: {
    label: 'No Show',
    bg: 'bg-[#F5F3F7]',
    text: 'text-[#685278]',
    border: 'border-[#685278]/25',
    dot: 'bg-[#685278]',
  },

  // Property Status
  ACTIVE: {
    label: 'Active',
    bg: 'bg-[#F2F8F4]',
    text: 'text-[#2D5A40]',
    border: 'border-[#2D5A40]/30',
    dot: 'bg-[#3E7D59]',
  },
  INACTIVE: {
    label: 'Inactive',
    bg: 'bg-[#ECE5DA]',
    text: 'text-[#5C5750]',
    border: 'border-[#5C5750]/25',
    dot: 'bg-[#8A847C]',
  },
};

export const StatusBadge = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIGS[status] || {
    label: status ? String(status).replace(/_/g, ' ') : 'Unknown',
    bg: 'bg-[#ECE5DA]',
    text: 'text-[#5C5750]',
    border: 'border-[#5C5750]/25',
    dot: 'bg-[#8A847C]',
  };

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[9px] tracking-[0.14em]'
      : 'px-2.5 py-1 text-[10px] tracking-[0.16em]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] font-semibold uppercase border font-cinzel ${config.bg} ${config.text} ${config.border} ${sizeClass}`}
      style={{ letterSpacing: '0.14em' }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
