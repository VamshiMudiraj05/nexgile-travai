import React, { useState } from 'react';

export default function SvgAreaChart({
  data = [],
  xKey = 'date',
  yKey = 'value',
  label = 'Value',
  color = '#13152C', // Deep navy primary line
  secondaryColor = '#DFB76C', // Antique gold accent
  unit = '',
  height = 200,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[3px] bg-[#FAF6F0] border border-[#DFB76C]/20 text-xs font-cinzel tracking-wider text-[#13152C]/50 uppercase">
        No metric timeline recorded
      </div>
    );
  }

  const values = data.map((d) => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 10);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const padding = 20;
  const width = 600;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Generate SVG coordinates
  const points = data.map((item, idx) => {
    const val = Number(item[yKey]) || 0;
    const x = padding + (idx / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding + chartHeight - ((val - minVal) / range) * chartHeight;
    return { x, y, item, val, idx };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = points[idx - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

  const gradientId = `area-grad-${xKey}-${yKey}-${Math.random().toString(36).substr(2, 5)}`;

  return (
    <div className="relative w-full overflow-hidden bg-[#FFFFFF] p-2 rounded-[3px] border border-[#DFB76C]/20">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DFB76C" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#FAF6F0" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FAF6F0" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Subtle Luxury Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + chartHeight * ratio;
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#ECE5DA"
              strokeDasharray="2 3"
              strokeWidth="0.75"
            />
          );
        })}

        {/* Filled Area */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Smooth Navy/Gold Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#13152C"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Data points */}
        {points.map((pt) => {
          const isHovered = hoveredIdx === pt.idx;
          return (
            <g key={pt.idx} className="cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 5 : 2.5}
                fill={isHovered ? '#DFB76C' : '#13152C'}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />
              <rect
                x={pt.x - 15}
                y={0}
                width={30}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(pt.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating editorial tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="pointer-events-none absolute -top-1 z-20 -translate-x-1/2 rounded-[2px] border border-[#DFB76C]/40 bg-[#13152C] px-3 py-1.5 shadow-xl text-[#FAF6F0] transition-all duration-100"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
          }}
        >
          <p className="font-cinzel text-[9px] font-semibold text-[#DFB76C] tracking-widest uppercase">
            {points[hoveredIdx].item[xKey]}
          </p>
          <p className="font-editorial text-sm font-normal text-white">
            {unit}
            {typeof points[hoveredIdx].val === 'number'
              ? points[hoveredIdx].val.toLocaleString()
              : points[hoveredIdx].val}
          </p>
        </div>
      )}
    </div>
  );
}

export { SvgAreaChart };
