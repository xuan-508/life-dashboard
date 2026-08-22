'use client'

import { useState } from 'react'

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
  // 该日日程（用于在格子内直接展示标题）
  schedules?: { id: string; title: string; done: boolean; priority: 'low' | 'medium' | 'high' }[]
  // 该日是否拖拽悬停（高亮）
  dragOver?: boolean
}

interface MonthCalendarProps {
  // date -> DayInfo
  days: Record<string, DayInfo>
  color?: string
  onSelect?: (date: string) => void
  selectedDate?: string
  // 拖拽某日程到此天（改日期）
  onDropDate?: (targetDate: string) => void
}

const PRIORITY_DOT: Record<string, string> = {
  high: '#D9534F',
  medium: '#E89B2F',
  low: '#999999',
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

export default function MonthCalendar({ days, color = '#3B9D4A', onSelect, selectedDate, onDropDate }: MonthCalendarProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [dragOver, setDragOver] = useState<string | null>(null)
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
          const isDragOver = dragOver === date || info?.dragOver
          const dayNum = parseInt(date.slice(8), 10)

          const schedules = info?.schedules ?? []
          const shown = schedules.slice(0, 2)
          const extra = schedules.length - shown.length

          return (
            <div
              key={date}
              onClick={() => onSelect?.(date)}
              onDragOver={(e) => {
                if (!onDropDate) return
                e.preventDefault()
                setDragOver(date)
              }}
              onDragLeave={() => {
                if (dragOver === date) setDragOver(null)
              }}
              onDrop={(e) => {
                if (!onDropDate) return
                e.preventDefault()
                setDragOver(null)
                onDropDate(date)
              }}
              className="relative flex flex-col min-h-[54px] rounded-sm-clean text-xs cursor-pointer transition-colors hover:ring-1 hover:ring-accent p-0.5 overflow-hidden"
              style={{
                border: isDragOver
                  ? `1.5px dashed ${color}`
                  : isSelected
                    ? `1.5px solid ${color}`
                    : '1px solid transparent',
                boxShadow: isToday ? 'inset 0 0 0 1.5px ' + color : undefined,
              }}
              title={date}
            >
              <span className={`leading-tight pl-0.5 ${isToday ? 'font-bold' : ''}`} style={{ color: '#555' }}>
                {dayNum}
              </span>
              <div className="flex flex-col gap-px flex-1 min-h-0">
                {shown.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-0.5 px-0.5 leading-tight truncate"
                    style={{ color: s.done ? '#aaa' : '#333', textDecoration: s.done ? 'line-through' : 'none' }}
                  >
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_DOT[s.priority] || color }} />
                    <span className="truncate">{s.title}</span>
                  </div>
                ))}
                {extra > 0 && (
                  <div className="px-0.5 leading-tight" style={{ color: '#aaa' }}>
                    +{extra}
                  </div>
                )}
                {schedules.length === 0 && info?.badge && (
                  <div className="px-0.5 leading-tight" style={{ color: '#aaa' }}>
                    {info.badge}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
