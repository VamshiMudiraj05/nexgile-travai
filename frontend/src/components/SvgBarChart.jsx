import React, { useState } from 'react';

export default function SvgBarChart({
  data = [],
  xKey = 'name',
  yKey = 'value',
  label = 'Metric',
  unit = '',
  height = 200,
  barColor = '#13152C',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[3px] bg-[#FAF6F0] border border-[#DFB76C]/20 text-xs font-cinzel tracking-wider text-[#13152C]/50 uppercase">
        No bar distribution data recorded
      </div>
    );
  }

  const values = data.map((d) => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 10);

  const padding = 20;
  const width = 600;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = Math.min((chartWidth / data.length) * 0.52, 32);

  return (
    <div className="relative w-full overflow-hidden bg-[#FFFFFF] p-2 rounded-[3px] border border-[#DFB76C]/20">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Horizontal subtle grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio) => {
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

        {/* Bars */}
        {data.map((item, idx) => {
          const val = Number(item[yKey]) || 0;
          const barH = (val / maxVal) * chartHeight;
          const slotWidth = chartWidth / data.length;
          const x = padding + idx * slotWidth + (slotWidth - barWidth) / 2;
          const y = padding + chartHeight - barH;
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={idx}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Bar Body */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 3)}
                rx="1"
                fill={isHovered ? '#DFB76C' : '#13152C'}
                stroke={isHovered ? '#B88E43' : 'transparent'}
                strokeWidth="1"
              />
            </g>
          );
        })}
      </svg>

      {/* Editorial Tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="pointer-events-none absolute -top-1 z-20 -translate-x-1/2 rounded-[2px] border border-[#DFB76C]/40 bg-[#13152C] px-3 py-1.5 shadow-xl text-[#FAF6F0] transition-all duration-100"
          style={{
            left: `${((padding + (hoveredIdx + 0.5) * (chartWidth / data.length)) / width) * 100}%`,
          }}
        >
          <p className="font-cinzel text-[9px] font-semibold text-[#DFB76C] tracking-widest uppercase">
            {data[hoveredIdx][xKey]}
          </p>
          <p className="font-editorial text-sm font-normal text-white">
            {unit}
            {typeof data[hoveredIdx][yKey] === 'number'
              ? data[hoveredIdx][yKey].toLocaleString()
              : data[hoveredIdx][yKey]}
          </p>
        </div>
      )}
    </div>
  );
}

export { SvgBarChart };
