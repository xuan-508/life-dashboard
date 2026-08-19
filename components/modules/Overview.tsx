'use client'

import { AccountRecord, HabitLog, ScheduleItem, ShoppingItem } from '@/types'
import { todayStr, formatDate, formatMoney } from '@/lib/storage'

interface OverviewProps {
  accounts: AccountRecord[]
  habitLogs: HabitLog[]
  schedules: ScheduleItem[]
  shopping: ShoppingItem[]
}

export default function Overview({ accounts, habitLogs, schedules, shopping }: OverviewProps) {
  const today = todayStr()
  const todayAccounts = accounts.filter((a) => a.date === today)
  const todayIncome = todayAccounts.filter((a) => a.type === 'income').reduce((s, a) => s + a.amount, 0)
  const todayExpense = todayAccounts.filter((a) => a.type === 'expense').reduce((s, a) => s + a.amount, 0)

  const todayHabits = habitLogs.filter((l) => l.date === today)
  const todaySchedules = schedules.filter((s) => s.date === today)
  const doneSchedules = todaySchedules.filter((s) => s.status === 'done')
  const pendingSchedules = todaySchedules.filter((s) => s.status !== 'done')

  const unbought = shopping.filter((s) => !s.bought)
  const unboughtTotal = unbought.reduce((s, i) => s + (i.price || 0), 0)

  const cards = [
    {
      label: '今日收入',
      value: `¥${formatMoney(todayIncome)}`,
      sub: todayIncome > 0 ? `${todayAccounts.filter((a) => a.type === 'income').length} 笔` : '—',
      color: '#3B9D4A',
    },
    {
      label: '今日支出',
      value: `¥${formatMoney(todayExpense)}`,
      sub: todayExpense > 0 ? `${todayAccounts.filter((a) => a.type === 'expense').length} 笔` : '—',
      color: '#D9534F',
    },
    {
      label: '习惯打卡',
      value: String(todayHabits.length),
      sub: todayHabits.length > 0 ? '今日已打卡' : '今日未打卡',
      color: '#3B9D4A',
    },
    {
      label: '今日日程',
      value: `${doneSchedules.length}/${todaySchedules.length}`,
      sub: pendingSchedules.length > 0 ? `${pendingSchedules.length} 项待完成` : '全部完成',
      color: '#3B9D4A',
    },
    {
      label: '待买清单',
      value: String(unbought.length),
      sub: unbought.length > 0 ? `预估 ¥${formatMoney(unboughtTotal)}` : '全部已买',
      color: '#E89B2F',
    },
  ]

  return (
    <div>
      <div className="mb-4">
        <span className="label">{formatDate(today)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c, i) => (
          <div key={i} className="card-sm">
            <div className="label mb-2">{c.label}</div>
            <div className="stat-sm" style={{ color: c.color }}>{c.value}</div>
            <div className="text-[11px] font-mono text-ink-faint mt-1">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
