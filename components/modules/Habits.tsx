'use client'

import { useState } from 'react'
import { Habit, HabitLog, HabitType } from '@/types'
import { useLocalStorage, uid, todayStr } from '@/lib/storage'
import MonthCalendar from '@/components/charts/MonthCalendar'

const HABIT_COLORS = ['#3B9D4A', '#4A90D9', '#E89B2F', '#9B59B6', '#1ABC9C', '#E74C3C']

export default function Habits() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('ld_habits', [])
  const [logs, setLogs] = useLocalStorage<HabitLog[]>('ld_habit_logs', [])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'check' as HabitType,
    unit: '次',
    target: 1,
  })

  const today = todayStr()

  const handleSubmit = () => {
    if (!form.name.trim()) return
    const habit: Habit = {
      id: uid(),
      name: form.name.trim(),
      type: form.type,
      unit: form.type === 'value' ? form.unit : '',
      target: form.type === 'check' ? 1 : form.target,
      color: HABIT_COLORS[habits.length % HABIT_COLORS.length],
      createdAt: Date.now(),
    }
    setHabits((prev) => [...prev, habit])
    setShowForm(false)
    setForm({ name: '', type: 'check', unit: '次', target: 1 })
  }

  const handleDelete = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
    setLogs((prev) => prev.filter((l) => l.habitId !== id))
  }

  const getLogForDate = (habitId: string, date: string) => {
    return logs.find((l) => l.habitId === habitId && l.date === date)
  }

  // Check-in for an arbitrary date (today or a past make-up date)
  const handleCheck = (habit: Habit, targetDate: string = today) => {
    const existing = getLogForDate(habit.id, targetDate)
    if (existing) {
      // Toggle off for check type
      if (habit.type === 'check') {
        setLogs((prev) => prev.filter((l) => l.id !== existing.id))
      } else {
        // For count/value, increment
        const newValue = existing.value >= habit.target ? 0 : existing.value + 1
        if (newValue === 0) {
          setLogs((prev) => prev.filter((l) => l.id !== existing.id))
        } else {
          setLogs((prev) => prev.map((l) => l.id === existing.id ? { ...l, value: newValue, updatedAt: Date.now() } : l))
        }
      }
    } else {
      const log: HabitLog = {
        id: uid(),
        habitId: habit.id,
        date: targetDate,
        value: 1,
        createdAt: Date.now(),
      }
      setLogs((prev) => [...prev, log])
    }
  }

  const handleValueChange = (habit: Habit, delta: number, targetDate: string = today) => {
    const existing = getLogForDate(habit.id, targetDate)
    const current = existing?.value || 0
    const newValue = Math.max(0, current + delta)
    if (existing) {
      if (newValue === 0) {
        setLogs((prev) => prev.filter((l) => l.id !== existing.id))
      } else {
        setLogs((prev) => prev.map((l) => l.id === existing.id ? { ...l, value: newValue, updatedAt: Date.now() } : l))
      }
    } else if (newValue > 0) {
      const log: HabitLog = {
        id: uid(),
        habitId: habit.id,
        date: targetDate,
        value: newValue,
        createdAt: Date.now(),
      }
      setLogs((prev) => [...prev, log])
    }
  }

  // Calculate streak for a habit
  const calcStreak = (habitId: string): number => {
    const habitLogs = logs.filter((l) => l.habitId === habitId && l.value > 0)
    const dates = new Set(habitLogs.map((l) => l.date))
    let streak = 0
    const d = new Date()
    // Check from today backwards
    while (true) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${day}`
      if (dates.has(dateStr)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  // Build calendar data for one habit: date -> DayInfo
  const buildCalendar = (habit: Habit): Record<string, { date: string; has: boolean; intensity?: number; done?: boolean; badge?: string }> => {
    const map: Record<string, { date: string; has: boolean; intensity?: number; done?: boolean; badge?: string }> = {}
    logs
      .filter((l) => l.habitId === habit.id && l.value > 0)
      .forEach((l) => {
        const ratio = habit.target > 0 ? Math.min(1, l.value / habit.target) : 1
        map[l.date] = { date: l.date, has: true, intensity: ratio, done: l.value >= habit.target }
      })
    return map
  }

  // Which habit is currently being make-up checked (per habit)
  const [makeupDate, setMakeupDate] = useState<Record<string, string>>({})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button className="btn btn-accent" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '+ 新增习惯'}
        </button>
        {habits.length > 0 && (
          <span className="text-xs font-mono text-ink-faint">{habits.length} 个习惯</span>
        )}
      </div>

      {showForm && (
        <div className="card space-y-3">
          <input
            className="input"
            type="text"
            placeholder="习惯名称（如：喝水、跑步、阅读）"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="flex gap-2">
            {([
              { type: 'check' as HabitType, label: '勾选' },
              { type: 'count' as HabitType, label: '计数' },
              { type: 'value' as HabitType, label: '数值' },
            ]).map((opt) => (
              <button
                key={opt.type}
                className={`chip ${form.type === opt.type ? 'chip-active' : 'chip-idle'}`}
                onClick={() => setForm({ ...form, type: opt.type })}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {form.type !== 'check' && (
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                type="number"
                placeholder="目标值"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: parseInt(e.target.value) || 1 })}
              />
              {form.type === 'value' && (
                <input
                  className="input"
                  type="text"
                  placeholder="单位（如：ml、页、分钟）"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              )}
            </div>
          )}
          <button className="btn btn-accent w-full" onClick={handleSubmit}>确认添加</button>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="card text-center text-sm text-ink-faint py-8">
          还没有习惯，点击上方按钮添加第一个吧
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const todayLog = getLogForDate(habit.id, today)
            const streak = calcStreak(habit.id)
            const isDone = todayLog && todayLog.value >= habit.target
            const calData = buildCalendar(habit)
            const mDate = makeupDate[habit.id] || today

            return (
              <div key={habit.id} className="card group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <span className="font-medium">{habit.name}</span>
                    {habit.type !== 'check' && habit.target > 1 && (
                      <span className="text-xs font-mono text-ink-faint">
                        目标 {habit.target}{habit.unit}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {streak > 0 && (
                      <span className="text-xs font-mono text-accent">
                        🔥 连续 {streak} 天
                      </span>
                    )}
                    <button
                      className="opacity-0 group-hover:opacity-100 text-xs text-ink-faint hover:text-red-500 transition-opacity cursor-pointer"
                      onClick={() => handleDelete(habit.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>

                {/* Today's check-in */}
                <div className="flex items-center gap-3 mb-3">
                  {habit.type === 'check' ? (
                    <button
                      className="btn w-full"
                      style={{
                        backgroundColor: isDone ? habit.color : 'transparent',
                        color: isDone ? '#fff' : '#555',
                        border: `1px solid ${isDone ? habit.color : '#E5E2DA'}`,
                      }}
                      onClick={() => handleCheck(habit, today)}
                    >
                      {isDone ? '✓ 今日已完成' : '点击打卡'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        className="btn btn-ghost px-3"
                        onClick={() => handleValueChange(habit, -1, today)}
                      >
                        −
                      </button>
                      <div className="flex-1 text-center">
                        <span className="stat-sm" style={{ color: isDone ? habit.color : '#1A1A1A' }}>
                          {todayLog?.value || 0}
                        </span>
                        <span className="text-xs font-mono text-ink-faint ml-1">
                          / {habit.target}{habit.unit}
                        </span>
                      </div>
                      <button
                        className="btn btn-ghost px-3"
                        onClick={() => handleValueChange(habit, 1, today)}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Make-up (补卡) controls */}
                <div className="flex flex-wrap items-center gap-2 mb-3 p-2 rounded-sm-clean bg-surface">
                  <span className="text-xs text-ink-soft">补卡</span>
                  <input
                    type="date"
                    className="input flex-1 min-w-[140px]"
                    value={mDate}
                    max={today}
                    onChange={(e) => setMakeupDate({ ...makeupDate, [habit.id]: e.target.value })}
                  />
                  {habit.type === 'check' ? (
                    <button
                      className="btn btn-ghost"
                      onClick={() => mDate && handleCheck(habit, mDate)}
                    >
                      为所选日期打卡
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        className="btn btn-ghost px-3"
                        onClick={() => mDate && handleValueChange(habit, -1, mDate)}
                      >
                        −
                      </button>
                      <span className="stat-sm text-xs">
                        {getLogForDate(habit.id, mDate)?.value || 0}
                      </span>
                      <button
                        className="btn btn-ghost px-3"
                        onClick={() => mDate && handleValueChange(habit, 1, mDate)}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Calendar */}
                <div className="mt-3">
                  <MonthCalendar
                    days={calData}
                    color={habit.color}
                    onSelect={(d) => setMakeupDate({ ...makeupDate, [habit.id]: d })}
                    selectedDate={mDate}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
