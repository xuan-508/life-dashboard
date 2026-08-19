'use client'

import { useState, useMemo } from 'react'
import { useLocalStorage, uid, todayStr, formatDate } from '@/lib/storage'
import type { ScheduleItem, ScheduleStatus, SchedulePriority } from '@/types'

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; bg: string; text: string; border: string }> = {
  todo:  { label: '待办', bg: 'bg-surface-2',  text: 'text-ink-soft',  border: 'border-ink-border' },
  doing: { label: '进行中', bg: 'bg-accent-bg', text: 'text-accent-dark', border: 'border-accent' },
  done:  { label: '已完成', bg: 'bg-[#F0F0EC]', text: 'text-ink-faint', border: 'border-ink-border' },
}

const STATUS_ORDER: ScheduleStatus[] = ['todo', 'doing', 'done']

const PRIORITY_CONFIG: Record<SchedulePriority, { label: string; color: string }> = {
  low:    { label: '低', color: '#999999' },
  medium: { label: '中', color: '#E89B2F' },
  high:   { label: '高', color: '#D9534F' },
}

export default function Schedule() {
  const [items, setItems] = useLocalStorage<ScheduleItem[]>('ld_schedule', [])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayStr())
  const [priority, setPriority] = useState<SchedulePriority>('medium')
  const [note, setNote] = useState('')
  const [filterDate, setFilterDate] = useState<string>('')

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
        return { ...item, status: next }
      })
    )
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

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

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="label">筛选日期</span>
        <input
          type="date"
          className="input w-[150px]"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        {filterDate && (
          <button className="btn btn-ghost" onClick={() => setFilterDate('')}>清除</button>
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
                    className={`card-sm flex items-center gap-3 ${item.status === 'done' ? 'opacity-60' : ''}`}
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
                      className="shrink-0 text-ink-faint hover:text-[#D9534F] text-sm cursor-pointer transition-colors px-1"
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
