'use client'

import { useState, type CSSProperties } from 'react'

interface DayInfo {
  date: string // YYYY-MM-DD
  // 是否有内容（打卡/日程）
  has: boolean
  // 内容程度（0-1），用于颜色深浅
  intensity?: number
  // 是否全部完成（习惯勾选类）
  done?: boolean
  // 附加角标文字（如日程数量）
  badge?: string
}

interface MonthCalendarProps {
  // date -> DayInfo
  days: Record<string, DayInfo>
  color?: string
  onSelect?: (date: string) => void
  selectedDate?: string
}

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export function monthTitle(year: number, month: number): string {
  return `${year}年${month + 1}月`
}

export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function MonthCalendar({ days, color = '#3B9D4A', onSelect, selectedDate }: MonthCalendarProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const today = todayStr()

  const firstDay = new Date(year, month, 1)
  const startWeekday = (firstDay.getDay() + 6) % 7 // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (string | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push(ds)
  }

  const prevMonth = () => {
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
  }
  const nextMonth = () => {
    if (month === 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(month + 1)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost px-2 py-1 text-xs" onClick={prevMonth} aria-label="上个月">‹</button>
          <button className="btn btn-ghost px-2 py-1 text-xs" onClick={nextMonth} aria-label="下个月">›</button>
        </div>
        <span className="text-sm font-medium text-ink">{monthTitle(year, month)}</span>
        <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()) }}>今天</button>
      </div>

      {/* Week labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK_LABELS.map((w) => (
          <div key={w} className="text-center text-[10px] font-mono text-ink-faint py-1">{w}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} className="aspect-square" />
          const info = days[date]
          const isToday = date === today
          const isSelected = date === selectedDate
          const dayNum = parseInt(date.slice(8), 10)

          let bgStyle: CSSProperties = {}
          if (info?.has) {
            const intensity = info.intensity ?? 0.5
            const op = info.done ? 0.85 : 0.2 + intensity * 0.6
            bgStyle = { backgroundColor: color, opacity: op }
          }

          return (
            <button
              key={date}
              onClick={() => onSelect?.(date)}
              className="relative flex flex-col items-center justify-center aspect-square rounded-sm-clean text-xs cursor-pointer transition-colors hover:ring-1 hover:ring-accent"
              style={{
                ...bgStyle,
                color: info?.has && (info.done || (info.intensity ?? 0) > 0.5) ? '#fff' : '#555',
                border: isSelected ? `1.5px solid ${color}` : '1px solid transparent',
                boxShadow: isToday ? 'inset 0 0 0 1.5px ' + color : undefined,
              }}
              title={date}
            >
              <span className={isToday ? 'font-bold' : ''}>{dayNum}</span>
              {info?.badge && (
                <span className="absolute top-0.5 right-0.5 text-[8px] font-mono leading-none">
                  {info.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
