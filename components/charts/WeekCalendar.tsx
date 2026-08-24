'use client'

import { useState, type CSSProperties } from 'react'

// 一天中可叠加展示的多种活动条目
export interface DayActivity {
  date: string // YYYY-MM-DD
  // 日程（用标题文本展示）
  schedules?: { id: string; title: string; done: boolean; priority: 'low' | 'medium' | 'high' }[]
  // 记账（收入/支出笔数 + 净额）
  income?: number
  expense?: number
  // 健身（是否有记录，如体重）
  hasFitness?: boolean
}

export interface WeekCalendarProps {
  // date -> 该日活动
  days: Record<string, DayActivity>
  // 当前选中日期（高亮）
  selectedDate?: string
  // 点击某一天（用于选中/快速添加）
  onSelect?: (date: string) => void
  // 拖拽某日程到此天（改日期）
  onDropDate?: (targetDate: string) => void
  // 颜色
  color?: string
  incomeColor?: string
  expenseColor?: string
  fitnessColor?: string
  // 以今天为基准显示的周偏移（0=本周，-1=上周，1=下周）
  weekOffset?: number
  onWeekChange?: (offset: number) => void
}

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']
const PRIORITY_DOT: Record<string, string> = {
  high: '#EC4899',
  medium: '#A855F7',
  low: '#B9A4C7',
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + n)
  return nd
}

export default function WeekCalendar({
  days,
  selectedDate,
  onSelect,
  onDropDate,
  color = '#D946EF',
  incomeColor = '#A855F7',
  expenseColor = '#EC4899',
  fitnessColor = '#8B5CF6',
  weekOffset = 0,
  onWeekChange,
}: WeekCalendarProps) {
  const [dragOver, setDragOver] = useState<string | null>(null)
  const now = new Date()
  // 当前周周一（周一是周起始）
  const monday = addDays(now, -((now.getDay() + 6) % 7))
  const weekStart = addDays(monday, weekOffset * 7)
  const todayStrLocal = toDateStr(now)

  // 生成这一周的 7 天
  const weekDates: string[] = []
  for (let i = 0; i < 7; i++) {
    weekDates.push(toDateStr(addDays(weekStart, i)))
  }

  // 周标题
  const weekStartLabel = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日`
  const weekEnd = addDays(weekStart, 6)
  const weekEndLabel = `${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
  const title = sameMonth
    ? `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月（${weekStart.getDate()} - ${weekEnd.getDate()}日）`
    : `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost px-2 py-1 text-xs"
            onClick={() => onWeekChange?.(weekOffset - 1)}
            aria-label="上一周"
          >
            ‹
          </button>
          <button
            className="btn btn-ghost px-2 py-1 text-xs"
            onClick={() => onWeekChange?.(weekOffset + 1)}
            aria-label="下一周"
          >
            ›
          </button>
        </div>
        <span className="text-sm font-medium text-ink">{title}</span>
        <button
          className="btn btn-ghost px-2 py-1 text-xs"
          onClick={() => onWeekChange?.(0)}
        >
          本周
        </button>
      </div>

      {/* Week labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK_LABELS.map((w) => (
          <div key={w} className="text-center text-[10px] font-mono text-ink-faint py-1">{w}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date) => {
          const info = days[date]
          const isToday = date === todayStrLocal
          const isSelected = date === selectedDate
          const dayNum = parseInt(date.slice(8), 10)
          const weekday = WEEK_LABELS[new Date(date + 'T00:00:00').getDay() === 0 ? 6 : new Date(date + 'T00:00:00').getDay() - 1]

          const bgStyle: CSSProperties = {}
          if (dragOver === date) {
            bgStyle.backgroundColor = color
            bgStyle.opacity = 0.15
          } else if (isToday) {
            bgStyle.backgroundColor = color
            bgStyle.opacity = 0.1
          }

          // 概览小圆点（显示有哪些活动）
          const hasAny = info && (info.schedules?.length || info.income || info.expense || info.hasFitness)
          const dots: { color: string; title: string }[] = []
          if (info?.schedules?.length) dots.push({ color: color, title: `${info.schedules.length} 项日程` })
          if (info?.expense) dots.push({ color: expenseColor, title: `支出 ¥${info.expense}` })
          if (info?.income) dots.push({ color: incomeColor, title: `收入 ¥${info.income}` })
          if (info?.hasFitness) dots.push({ color: fitnessColor, title: '健身记录' })

          return (
            <div
              key={date}
              onClick={() => onSelect?.(date)}
              onDragOver={(e) => {
                if (!onDropDate) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setDragOver(date)
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                if (!onDropDate) return
                e.preventDefault()
                setDragOver(null)
                onDropDate(date)
              }}
              className="relative flex flex-col rounded-sm-clean border p-1 cursor-pointer transition-colors hover:ring-1 hover:ring-accent"
              style={{
                ...bgStyle,
                minHeight: 84,
                border: isSelected
                  ? `1.5px solid ${color}`
                  : dragOver === date
                    ? `1.5px dashed ${color}`
                    : '1px solid transparent',
                boxShadow: isToday ? 'inset 0 0 0 1px ' + color : undefined,
              }}
              title={date}
            >
              {/* 日期 + 星期 */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs ${isToday ? 'font-bold' : ''}`}>{dayNum}</span>
                <span className="text-[9px] font-mono text-ink-faint">{weekday}</span>
              </div>

              {/* 日程标题（最多2条） */}
              <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                {info?.schedules?.slice(0, 2).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-0.5 rounded-sm px-0.5 py-px text-[9px] leading-tight overflow-hidden whitespace-nowrap"
                    style={{ backgroundColor: color + '22', color: '#333' }}
                    title={s.title}
                  >
                    <span
                      className="inline-block h-1 w-1 rounded-full shrink-0"
                      style={{ backgroundColor: PRIORITY_DOT[s.priority] || '#999' }}
                    />
                    <span className={`truncate ${s.done ? 'line-through opacity-50' : ''}`}>{s.title}</span>
                  </div>
                ))}
                {info?.schedules && info.schedules.length > 2 && (
                  <div className="text-[9px] font-mono text-ink-faint pl-0.5">+{info.schedules.length - 2}</div>
                )}
              </div>

              {/* 底部活动点 */}
              {hasAny && (
                <div className="flex items-center gap-1 mt-1">
                  {dots.slice(0, 4).map((d, i) => (
                    <span
                      key={i}
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                      title={d.title}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
