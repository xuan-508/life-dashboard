'use client';

import { useState } from 'react';

interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  size?: number;
  format?: (n: number) => string;
}

export default function DonutChart({ data, size = 140, format }: DonutChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 16;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-2 text-ink-faint">
        <div className="flex items-center justify-center rounded-full border-4 border-ink-border" style={{ width: size, height: size }}>
          <span className="text-[10px] font-mono">暂无数据</span>
        </div>
      </div>
    );
  }

  let cumulativeAngle = -90;
  const segments = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const largeArc = angle > 180 ? 1 : 0;
    const rad = (deg: number) => (deg * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(rad(startAngle));
    const y1 = cy + radius * Math.sin(rad(startAngle));
    const x2 = cx + radius * Math.cos(rad(endAngle));
    const y2 = cy + radius * Math.sin(rad(endAngle));

    const innerR = radius - strokeWidth;
    const x3 = cx + innerR * Math.cos(rad(endAngle));
    const y3 = cy + innerR * Math.sin(rad(endAngle));
    const x4 = cx + innerR * Math.cos(rad(startAngle));
    const y4 = cy + innerR * Math.sin(rad(startAngle));

    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    return { path, color: d.color, label: d.label, value: d.value, idx: i };
  });

  const fmt = format ?? ((n: number) => String(n));
  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="flex-shrink-0">
        {segments.map((s) => (
          <path
            key={s.idx}
            d={s.path}
            fill={s.color}
            opacity={hoverIdx === null || hoverIdx === s.idx ? 1 : 0.4}
            onMouseEnter={() => setHoverIdx(s.idx)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
          />
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="font-mono text-[13px] font-bold fill-ink"
        >
          {hovered ? fmt(hovered.value) : fmt(total)}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="font-mono text-[9px] fill-ink-faint"
        >
          {hovered ? hovered.label : '总计'}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-2 cursor-pointer transition-opacity"
            style={{ opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.4 }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] font-mono text-ink-soft">{d.label}</span>
            <span className="text-[11px] font-mono font-bold text-ink">{fmt(d.value)}</span>
            <span className="text-[10px] font-mono text-ink-faint">
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
