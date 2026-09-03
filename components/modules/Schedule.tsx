'use client'

import { useState, useMemo } from 'react'
import { useLocalStorage, uid, todayStr, formatDate } from '@/lib/storage'
import type { ScheduleItem, ScheduleStatus, SchedulePriority, AccountRecord, FitnessRecord } from '@/types'
import MonthCalendar from '@/components/charts/MonthCalendar'
import WeekCalendar from '@/components/charts/WeekCalendar'

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; bg: string; text: string; border: string }> = {
  todo:  { label: '待办', bg: 'bg-surface-2',  text: 'text-purple-600',  border: 'border-purple-200' },
  doing: { label: '进行中', bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-300' },
  done:  { label: '已完成', bg: 'bg-surface-2', text: 'text-purple-300', border: 'border-purple-100' },
}

const STATUS_ORDER: ScheduleStatus[] = ['todo', 'doing', 'done']

const PRIORITY_CONFIG: Record<SchedulePriority, { label: string; color: string }> = {
  low:    { label: '低', color: '#C084FC' },
  medium: { label: '中', color: '#F472B6' },
  high:   { label: '高', color: '#D946EF' },
}

interface ScheduleProps {
  accounts?: AccountRecord[]
  fitness?: FitnessRecord[]
}

export default function Schedule({ accounts = [], fitness = [] }: ScheduleProps) {
  const [items, setItems] = useLocalStorage<ScheduleItem[]>('ld_schedule', [])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayStr())
  const [priority, setPriority] = useState<SchedulePriority>('medium')
  const [note, setNote] = useState('')
  const [filterDate, setFilterDate] = useState<string>('')
  // 月历 / 周历 切换
  const [calMode, setCalMode] = useState<'month' | 'week'>('month')
  const [weekOffset, setWeekOffset] = useState(0)

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return b.createdAt - a.createdAt
    })
  }, [items])

  const grouped = useMemo(() => {
    const filtered = filterDate ? sorted.filter((i) => i.date === filterDate) : sorted
    const map = new Map<string, ScheduleItem[]>()
    filtered.forEach((item) => {
      if (!map.has(item.date)) map.set(item.date, [])
      map.get(item.date)!.push(item)
    })
    return Array.from(map.entries())
  }, [sorted, filterDate])

  const stats = useMemo(() => {
    const todo = items.filter((i) => i.status === 'todo').length
    const doing = items.filter((i) => i.status === 'doing').length
    const done = items.filter((i) => i.status === 'done').length
    return { todo, doing, done, total: items.length }
  }, [items])

  // 聚合记账与健身记录：date -> 每日收支净额与是否有健身记录
  const accountByDate = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {}
    accounts.forEach((a) => {
      if (!map[a.date]) map[a.date] = { income: 0, expense: 0 }
      if (a.type === 'income') map[a.date].income += a.amount
      else map[a.date].expense += a.amount
    })
    return map
  }, [accounts])

  const fitnessDates = useMemo(() => {
    return new Set(fitness.map((f) => f.date))
  }, [fitness])

  // Calendar data: date -> DayInfo，含日程标题 + 记账 + 健身叠加
  const calDays = useMemo(() => {
    const map: Record<string, {
      date: string
      has: boolean
      intensity?: number
      done?: boolean
      badge?: string
      schedules?: { id: string; title: string; done: boolean; priority: 'low' | 'medium' | 'high' }[]
      income?: number
      expense?: number
      hasFitness?: boolean
    }> = {}
    items.forEach((item) => {
      if (!map[item.date]) map[item.date] = { date: item.date, has: true, intensity: 1, schedules: [] }
      map[item.date].schedules!.push({
        id: item.id,
        title: item.title,
        done: item.status === 'done',
        priority: item.priority,
      })
    })
    // 叠加记账
    Object.entries(accountByDate).forEach(([d, v]) => {
      if (!map[d]) map[d] = { date: d, has: true, intensity: 1, schedules: [] }
      map[d].income = v.income
      map[d].expense = v.expense
    })
    // 叠加健身
    fitnessDates.forEach((d) => {
      if (!map[d]) map[d] = { date: d, has: true, intensity: 1, schedules: [] }
      map[d].hasFitness = true
    })
    // 日程数量角标
    Object.values(map).forEach((day) => {
      const n = day.schedules?.length ?? 0
      if (n > 0) day.badge = String(n)
    })
    return map
  }, [items, accountByDate, fitnessDates])

  const hasFilter = filterDate !== ''

  function handleAdd() {
    if (!title.trim()) return
    const newItem: ScheduleItem = {
      id: uid(),
      title: title.trim(),
      date: date || todayStr(),
      status: 'todo',
      priority,
      note: note.trim(),
      createdAt: Date.now(),
    }
    setItems((prev) => [...prev, newItem])
    setTitle('')
    setNote('')
  }

  function cycleStatus(id: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const idx = STATUS_ORDER.indexOf(item.status)
        const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
        return { ...item, status: next, updatedAt: Date.now() }
      })
    )
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  // 拖拽改日期
  function handleDropDate(targetDate: string) {
    const dragId = dragIdRef.current
    dragIdRef.current = null
    if (!dragId) return
    setItems((prev) =>
      prev.map((item) =>
        item.id === dragId && item.date !== targetDate
          ? { ...item, date: targetDate, updatedAt: Date.now() }
          : item
      )
    )
  }

  // 点击日历格子：选中 + 预填添加表单日期
  function handleSelectDate(d: string) {
    setDate(d)
    setFilterDate(d === filterDate ? '' : d)
  }

  const dragIdRef = { current: null as string | null }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card-sm">
          <div className="label">全部</div>
          <div className="stat-sm mt-1">{stats.total}</div>
        </div>
        <div className="card-sm">
          <div className="label">待办</div>
          <div className="stat-sm mt-1">{stats.todo}</div>
        </div>
        <div className="card-sm">
          <div className="label">进行中</div>
          <div className="stat-sm mt-1 text-accent-dark">{stats.doing}</div>
        </div>
        <div className="card-sm">
          <div className="label">已完成</div>
          <div className="stat-sm mt-1 text-ink-faint">{stats.done}</div>
        </div>
      </div>

      {/* Add form */}
      <div className="card">
        <div className="label mb-3">添加日程</div>
        <div className="flex flex-wrap gap-2">
          <input
            className="input flex-1 min-w-[160px]"
            placeholder="日程标题…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="date"
            className="input w-[150px]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select
            className="input w-[100px]"
            value={priority}
            onChange={(e) => setPriority(e.target.value as SchedulePriority)}
          >
            <option value="low">优先级 低</option>
            <option value="medium">优先级 中</option>
            <option value="high">优先级 高</option>
          </select>
          <button className="btn btn-accent" onClick={handleAdd}>添加</button>
        </div>
        <input
          className="input mt-2"
          placeholder="备注（可选）…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Calendar: 月/周切换 */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div className="label">日历视图</div>
          <div className="flex gap-1 rounded-clean border border-ink-border bg-surface p-0.5">
            <button
              onClick={() => setCalMode('month')}
              className={`rounded-clean px-2.5 py-1 text-xs font-medium transition-colors ${
                calMode === 'month' ? 'bg-accent text-white' : 'text-ink/60 hover:text-accent'
              }`}
            >
              月历
            </button>
            <button
              onClick={() => setCalMode('week')}
              className={`rounded-clean px-2.5 py-1 text-xs font-medium transition-colors ${
                calMode === 'week' ? 'bg-accent text-white' : 'text-ink/60 hover:text-accent'
              }`}
            >
              周历
            </button>
          </div>
        </div>

        {calMode === 'month' ? (
          <MonthCalendar
            days={calDays}
            color="#D946EF"
            onSelect={handleSelectDate}
            onDropDate={handleDropDate}
            selectedDate={filterDate || undefined}
          />
        ) : (
          <WeekCalendar
            days={calDays}
            color="#D946EF"
            onSelect={handleSelectDate}
            onDropDate={handleDropDate}
            selectedDate={filterDate || undefined}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
          />
        )}

        {/* 日历图例 */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-border pt-2 text-[11px] text-ink-faint">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#D946EF' }} /> 日程
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#E11D48' }} /> 支出
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#A855F7' }} /> 收入
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#EC4899' }} /> 健身
          </span>
          <span className="ml-auto">拖拽日程可调整日期</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="label">筛选日期</span>
        <input
          type="date"
          className="input w-[150px]"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        {hasFilter && (
          <>
            <button className="btn btn-ghost" onClick={() => setFilterDate('')}>清除</button>
            <button className="btn btn-accent" onClick={() => setFilterDate('')}>查看全部日程</button>
          </>
        )}
        {!hasFilter && items.length > 0 && (
          <span className="text-xs font-mono text-ink-faint ml-auto">{items.length} 条日程</span>
        )}
      </div>

      {/* Grouped list */}
      <div className="space-y-4">
        {grouped.length === 0 && (
          <div className="card text-center text-ink-faint text-sm py-8">
            暂无日程，添加一个开始吧
          </div>
        )}
        {grouped.map(([date, group]) => (
          <div key={date}>
            <div className="label mb-2">{formatDate(date)}</div>
            <div className="space-y-2">
              {group.map((item) => {
                const st = STATUS_CONFIG[item.status]
                const pr = PRIORITY_CONFIG[item.priority]
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item.id)
                      e.dataTransfer.effectAllowed = 'move'
                      dragIdRef.current = item.id
                    }}
                    onDragEnd={() => { dragIdRef.current = null }}
                    className={`card-sm flex items-center gap-3 ${item.status === 'done' ? 'opacity-60' : ''} cursor-grab active:cursor-grabbing`}
                    title="拖拽可调整日期"
                  >
                    {/* Status toggle */}
                    <button
                      onClick={() => cycleStatus(item.id)}
                      className={`shrink-0 w-[72px] text-center text-xs font-mono py-1 rounded-sm-clean border ${st.bg} ${st.text} ${st.border} transition-colors cursor-pointer hover:opacity-80`}
                    >
                      {st.label}
                    </button>

                    {/* Priority dot */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pr.color }} />
                      <span className="text-[10px] font-mono text-ink-faint mt-0.5">{pr.label}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${item.status === 'done' ? 'line-through text-ink-faint' : 'text-ink'}`}>
                        {item.title}
                      </div>
                      {item.note && (
                        <div className="text-xs text-ink-faint mt-0.5 truncate">{item.note}</div>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="shrink-0 text-ink-faint hover:text-[#E11D48] text-sm cursor-pointer transition-colors px-1"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
