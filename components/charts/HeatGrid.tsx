'use client';

interface HeatGridProps {
  data: { date: string; value: number }[];
  max?: number;
  color?: string;
}

export default function HeatGrid({ data, max: maxProp, color = '#3B9D4A' }: HeatGridProps) {
  const max = maxProp ?? Math.max(...data.map((d) => d.value), 1);

  const getOpacity = (v: number) => {
    if (v === 0) return 0.08;
    return 0.25 + (v / max) * 0.75;
  };

  return (
    <div className="flex gap-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-sm-clean transition-all duration-150"
            style={{
              backgroundColor: color,
              opacity: getOpacity(d.value),
              aspectRatio: '1',
              minHeight: 28,
            }}
            title={`${d.date}: ${d.value}`}
          />
          <span className="text-[9px] font-mono text-ink-faint">{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}
