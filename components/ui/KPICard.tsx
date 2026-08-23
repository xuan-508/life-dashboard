'use client'

import { ReactNode } from 'react'

export interface KPICardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon?: ReactNode
  progress?: number
  trend?: { value: string; up?: boolean }
  className?: string
  onClick?: () => void
}

export default function KPICard({
  label,
  value,
  sub,
  color = '#14B8A6',
  icon,
  progress,
  trend,
  className = '',
  onClick,
}: KPICardProps) {
  const hasProgress = progress !== undefined && progress >= 0
  const clickableClass = onClick
    ? 'cursor-pointer hover:ring-1 hover:ring-accent/40 active:scale-[0.99]'
    : ''

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-card border border-ink-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md ${clickableClass} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {value}
          </div>
          {sub && (
            <div className="mt-1 truncate text-[12px] font-medium text-ink-soft">
              {sub}
            </div>
          )}
        </div>
        {icon && (
          <div
            className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm-clean text-white"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4">
        {hasProgress && (
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color }}
            />
          </div>
        )}
        {trend ? (
          <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{
              backgroundColor: trend.up ? '#CCFBF1' : '#FEE2E2',
              color: trend.up ? '#0D9488' : '#DC2626',
            }}
          >
            <span>{trend.up ? '↑' : '↓'} {trend.value}</span>
            <span className="opacity-70">环比</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 rounded-full bg-accent-bg px-2 py-0.5 text-[11px] font-semibold text-accent-dark">
            <span>—</span>
            <span className="opacity-70">环比</span>
          </div>
        )}
      </div>
    </div>
  )
}
