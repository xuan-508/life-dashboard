'use client';

interface MiniBar {
  label: string;
  value: number;
  color?: string;
}

interface MiniBarChartProps {
  data: MiniBar[];
  height?: number;
  format?: (n: number) => string;
}

export default function MiniBarChart({ data, height = 80, format }: MiniBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = format ?? ((n: number) => String(n));

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = max > 0 ? (d.value / max) * (height - 16) : 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-0.5">
            <span className="text-[9px] font-mono text-ink-faint">{d.value > 0 ? fmt(d.value) : ''}</span>
            <div
              className="w-full rounded-t-sm-clean"
              style={{ height: Math.max(h, 2), backgroundColor: d.color || '#3B9D4A' }}
            />
            <span className="text-[9px] font-mono text-ink-soft">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
