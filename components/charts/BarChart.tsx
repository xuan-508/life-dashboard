'use client';

import { useState } from 'react';

interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  format?: (n: number) => string;
  height?: number;
}

export default function BarChart({ data, format, height = 120 }: BarChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = format ?? ((n: number) => String(n));

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => {
        const h = max > 0 ? (d.value / max) * (height - 24) : 0;
        const isHover = hoverIdx === i;
        return (
          <div
            key={i}
            className="flex flex-1 flex-col items-center justify-end gap-1"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <span className="text-[10px] font-mono text-ink-faint transition-opacity" style={{ opacity: isHover ? 1 : 0 }}>
              {fmt(d.value)}
            </span>
            <div
              className="w-full rounded-t-sm-clean transition-all duration-200"
              style={{
                height: Math.max(h, 2),
                backgroundColor: d.color || '#3B9D4A',
                opacity: isHover ? 1 : 0.85,
              }}
            />
            <span className="text-[10px] font-mono text-ink-soft">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
