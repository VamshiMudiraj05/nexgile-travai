import React, { useState, useId } from 'react';

export default function SvgAreaChart({
  data = [],
  xKey = 'date',
  yKey = 'value',
  _label = 'Value',
  color = '#DFB76C', // Antique gold accent line
  _secondaryColor = '#13152C',
  unit = '',
  height = 200,
  className = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const reactId = useId().replace(/:/g, '');

  if (!data || data.length === 0) {
    return (
      <div className={`flex h-48 items-center justify-center rounded-[3px] bg-[#0D0E20]/80 border border-[#2C315E] text-xs font-cinzel tracking-wider text-white/50 uppercase ${className}`}>
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

  const gradientId = `area-grad-${xKey}-${yKey}-${reactId}`;

  return (
    <div className={`relative w-full overflow-hidden bg-[#0D0E20]/80 p-2 rounded-[3px] border border-[#2C315E] ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="60%" stopColor={color} stopOpacity="0.08" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
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
              stroke="#2C315E"
              strokeDasharray="2 3"
              strokeWidth="0.75"
            />
          );
        })}

        {/* Filled Area */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Smooth Colored Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
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
                fill={isHovered ? '#FFFFFF' : color}
                stroke="#0D0E20"
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
          className="pointer-events-none absolute -top-1 z-20 -translate-x-1/2 rounded-[2px] border border-[#DFB76C]/60 bg-[#13152C] px-3 py-1.5 shadow-xl text-[#FAF6F0] transition-all duration-100"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
          }}
        >
          <p className="font-cinzel text-[9px] font-semibold text-[#DFB76C] tracking-widest uppercase">
            {points[hoveredIdx].item[xKey]}
          </p>
          <p className="font-editorial text-sm font-bold text-white">
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
