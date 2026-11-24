import React, { useState } from 'react';

const PROPERTY_PALETTE = [
  '#DFB76C', // Royal Gold
  '#38BDF8', // Sky Sapphire
  '#10B981', // Emerald
  '#A78BFA', // Violet
  '#F59E0B', // Amber
  '#F472B6', // Rose
  '#34D399', // Mint
  '#60A5FA', // Marine Blue
  '#FB7185', // Coral
  '#C084FC', // Purple
];

export default function SvgBarChart({
  data = [],
  xKey = 'property_name',
  yKey = 'revenue',
  label = 'Revenue',
  unit = '₹',
  height = 240,
  palette = PROPERTY_PALETTE,
  className = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className={`flex h-48 items-center justify-center rounded-[3px] bg-[#0D0E20]/80 border border-[#2C315E] text-xs font-cinzel tracking-wider text-white/50 uppercase ${className}`}>
        No property revenue data recorded
      </div>
    );
  }

  const values = data.map((d) => Number(d[yKey]) || 0);
  const totalVal = values.reduce((sum, v) => sum + v, 0) || 1;
  const maxVal = Math.max(...values, 1000);

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 45;
  const width = 640;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barWidth = Math.min((chartWidth / data.length) * 0.58, 42);

  // Helper to format currency in INR
  const formatINR = (num) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className={`relative w-full flex flex-col gap-3 rounded-[3px] bg-[#0D0E20]/80 p-3 border border-[#2C315E] ${className}`}>
      <div className="relative w-full" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {data.map((_, idx) => {
              const baseColor = palette[idx % palette.length];
              return (
                <linearGradient
                  key={idx}
                  id={`bar-grad-${idx}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={baseColor} stopOpacity="0.95" />
                  <stop offset="60%" stopColor={baseColor} stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#13152C" stopOpacity="0.9" />
                </linearGradient>
              );
            })}
          </defs>

          {/* Grid lines and Y-axis scale */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const scaleVal = maxVal * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#2C315E"
                  strokeDasharray="2 3"
                  strokeWidth="0.75"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#8E92BC"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  {formatINR(scaleVal)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const val = Number(item[yKey]) || 0;
            const barH = (val / maxVal) * chartHeight;
            const slotWidth = chartWidth / data.length;
            const x = paddingLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = paddingTop + chartHeight - barH;
            const isHovered = hoveredIdx === idx;
            const color = palette[idx % palette.length];

            // Truncate name for x-axis
            const rawName = String(item[xKey] || `Estate ${idx + 1}`);
            const shortName = rawName.length > 10 ? rawName.slice(0, 9) + '…' : rawName;

            return (
              <g
                key={idx}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Bar rect */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, 3)}
                  rx="3"
                  fill={`url(#bar-grad-${idx})`}
                  stroke={isHovered ? '#FAF6F0' : color}
                  strokeWidth={isHovered ? 1.5 : 0.75}
                  className="transition-all duration-150"
                  filter={isHovered ? 'drop-shadow(0 0 6px rgba(223, 183, 108, 0.5))' : undefined}
                />

                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={paddingTop + chartHeight + 14}
                  textAnchor="middle"
                  fill={isHovered ? '#DFB76C' : '#FAF6F0'}
                  fontSize="9.5"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  fontFamily="sans-serif"
                >
                  {shortName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="pointer-events-none absolute -top-2 z-30 -translate-x-1/2 rounded-[3px] border border-[#DFB76C]/60 bg-[#13152C] px-3.5 py-2 shadow-2xl text-[#FAF6F0] transition-all duration-150 backdrop-blur-md"
            style={{
              left: `${
                ((paddingLeft +
                  (hoveredIdx + 0.5) * (chartWidth / data.length)) /
                  width) *
                100
              }%`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: palette[hoveredIdx % palette.length] }}
              />
              <span className="font-cinzel text-[9.5px] font-bold text-[#DFB76C] tracking-wider uppercase truncate max-w-[180px]">
                {data[hoveredIdx][xKey]}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 font-sans">
              <span className="text-sm font-bold text-white font-editorial tracking-wide">
                ₹{Number(data[hoveredIdx][yKey] || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-white/60">
                ({(((Number(data[hoveredIdx][yKey]) || 0) / totalVal) * 100).toFixed(1)}% share)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Property Palette Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-2 border-t border-[#2C315E]/60 text-[11px] font-sans">
        {data.slice(0, 6).map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
              hoveredIdx === idx ? 'bg-[#1B1E3D] text-[#DFB76C]' : 'text-white/70 hover:text-white'
            }`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span
              className="w-2.5 h-2.5 rounded-[2px] shrink-0"
              style={{ backgroundColor: palette[idx % palette.length] }}
            />
            <span className="truncate max-w-[120px] font-medium">{item[xKey]}</span>
          </div>
        ))}
        {data.length > 6 && (
          <span className="text-[10px] text-white/40">+{data.length - 6} more estates</span>
        )}
      </div>
    </div>
  );
}
