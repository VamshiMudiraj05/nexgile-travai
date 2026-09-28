import React, { useState } from 'react';

const LUXURY_PALETTE = [
  '#13152C', // Deep navy
  '#DFB76C', // Antique gold
  '#3E7D59', // Muted sage
  '#9A4E2B', // Terracotta
  '#B88E43', // Dark gold
  '#2C315E', // Navy border/tone
  '#78746D', // Warm stone
];

export default function SvgDonutChart({
  data = [],
  nameKey = 'source',
  valueKey = 'count',
  size = 180,
  strokeWidth = 20,
  centerLabel = 'Total',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = data.reduce((acc, d) => acc + (Number(d[valueKey]) || 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs font-cinzel uppercase tracking-wider text-[#13152C]/40">
        No channel segments recorded
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const slices = data.map((item, idx) => {
    const val = Number(item[valueKey]) || 0;
    const pct = val / total;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle * circumference;
    accumulatedAngle += pct;

    return {
      item,
      val,
      pct: (pct * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length],
      idx,
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around bg-[#FFFFFF] p-4 rounded-[3px] border border-[#DFB76C]/20">
      {/* Donut SVG */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F4EFE6"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.idx;
            return (
              <circle
                key={slice.idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-cinzel text-[9px] font-bold uppercase tracking-[0.2em] text-[#13152C]/60">
            {hoveredIdx !== null ? slices[hoveredIdx].item[nameKey] : centerLabel}
          </span>
          <span className="font-editorial text-xl font-normal text-[#13152C]">
            {hoveredIdx !== null ? slices[hoveredIdx].val : total}
          </span>
        </div>
      </div>

      {/* Legend List */}
      <div className="flex flex-col gap-2 min-w-[140px]">
        {slices.map((slice) => (
          <div
            key={slice.idx}
            className={`flex items-center gap-2.5 rounded-[2px] px-2.5 py-1 text-xs transition-colors cursor-pointer ${
              hoveredIdx === slice.idx ? 'bg-[#F4EFE6]' : 'hover:bg-[#FAF6F0]'
            }`}
            onMouseEnter={() => setHoveredIdx(slice.idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="font-sans text-xs text-[#13152C]/80 font-medium truncate max-w-[90px]">
              {slice.item[nameKey]}
            </span>
            <span className="ml-auto font-sans font-semibold text-[#13152C]">{slice.val}</span>
            <span className="text-[#13152C]/50 text-[10px]">({slice.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { SvgDonutChart };
