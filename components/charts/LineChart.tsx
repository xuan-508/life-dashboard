'use client';

interface Point {
  label: string;
  value: number;
}

interface LineChartProps {
  data: Point[];
  height?: number;
  color?: string;
  format?: (n: number) => string;
}

export default function LineChart({ data, height = 120, color = '#3B9D4A', format }: LineChartProps) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center text-[11px] font-mono text-ink-faint" style={{ height }}>暂无数据</div>;
  }

  const width = 100; // viewBox width units
  const padding = 8;
  const chartH = height - 24; // leave room for labels
  const values = data.map((d) => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = padding + (data.length > 1 ? step * i : (width - padding * 2) / 2);
    const y = chartH - ((d.value - min) / range) * (chartH - padding) - padding;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        <defs>
          <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#lineArea)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="1.5" fill="#fff" stroke={color} strokeWidth="1" />
          </g>
        ))}
      </svg>
      <div className="flex justify-between px-1 mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] font-mono text-ink-faint">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
