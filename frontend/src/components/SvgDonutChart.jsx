import React, { useState } from 'react';

const CHANNEL_PALETTE = [
  '#DFB76C', // Gold - Direct Web
  '#38BDF8', // Sky Blue - OTA / Extranet
  '#10B981', // Emerald - Corporate Travel
  '#A78BFA', // Purple - Travel Agent / GDS
  '#F59E0B', // Amber - Mobile Super App
  '#F472B6', // Rose - Walk-in & Direct Phone
  '#34D399', // Mint - Wholesale & Group
];

export default function SvgDonutChart({
  data = [],
  nameKey = 'source',
  valueKey = 'count',
  size = 200,
  strokeWidth = 24,
  centerLabel = 'Total Bookings',
  palette = CHANNEL_PALETTE,
  className = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = data.reduce((acc, d) => acc + (Number(d[valueKey]) || 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className={`flex h-48 items-center justify-center rounded-[3px] bg-[#0D0E20]/80 border border-[#2C315E] text-xs font-cinzel uppercase tracking-wider text-white/50 ${className}`}>
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
      color: palette[idx % palette.length],
      idx,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className={`relative flex flex-col items-center justify-between gap-6 sm:flex-row p-5 rounded-[4px] bg-[#0D0E20]/80 border border-[#2C315E] w-full ${className}`}>
      {/* Circular SVG Donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
          {/* Subtle track background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1B1E3D"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
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
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="butt"
                className="cursor-pointer transition-all duration-200"
                style={{
                  filter: isHovered ? `drop-shadow(0 0 8px ${slice.color})` : undefined,
                  opacity: hoveredIdx !== null && !isHovered ? 0.6 : 1,
                }}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Readout */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          <span className="font-cinzel text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#DFB76C] truncate max-w-[120px]">
            {activeSlice ? activeSlice.item[nameKey] : centerLabel}
          </span>
          <span className="font-editorial text-2xl font-bold text-white mt-0.5">
            {activeSlice ? activeSlice.val : total}
          </span>
          <span className="text-[10px] font-sans text-white/60">
            {activeSlice ? `${activeSlice.pct}% of total` : 'Direct & Channels'}
          </span>
        </div>
      </div>

      {/* Legend & Channel Breakdown List */}
      <div className="flex flex-col gap-2 min-w-[200px] flex-1">
        <span className="font-cinzel text-[9.5px] font-semibold text-[#DFB76C] tracking-widest uppercase mb-1">
          Channel Contributions
        </span>
        {slices.map((slice) => {
          const isHovered = hoveredIdx === slice.idx;
          return (
            <div
              key={slice.idx}
              className={`flex items-center gap-2.5 rounded-[3px] px-3 py-1.5 text-xs transition-all cursor-pointer border ${
                isHovered
                  ? 'bg-[#1B1E3D] border-[#DFB76C]/60 text-white shadow-sm'
                  : 'bg-[#13152C]/60 border-[#2C315E]/60 text-white/80 hover:bg-[#1B1E3D] hover:text-white'
              }`}
              onMouseEnter={() => setHoveredIdx(slice.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: slice.color }}
              />
              <span className="font-sans text-xs font-medium truncate max-w-[130px]">
                {slice.item[nameKey]}
              </span>
              <div className="ml-auto flex items-baseline gap-2">
                <span className="font-sans font-bold text-white">{slice.val}</span>
                <span className="text-[#DFB76C] font-mono text-[11px] font-medium">
                  {slice.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { SvgDonutChart };
