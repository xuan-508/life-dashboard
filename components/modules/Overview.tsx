'use client'

import { AccountRecord, HabitLog, ScheduleItem, ShoppingItem } from '@/types'
import { todayStr, formatDate, formatMoney } from '@/lib/storage'
import KPICard from '@/components/ui/KPICard'

interface OverviewProps {
  accounts: AccountRecord[]
  habitLogs: HabitLog[]
  schedules: ScheduleItem[]
  shopping: ShoppingItem[]
  onNavigate?: (tab: string) => void
}

const ICONS = {
  income: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  expense: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  habit: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  schedule: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  shopping: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
}

export default function Overview({ accounts, habitLogs, schedules, shopping, onNavigate }: OverviewProps) {
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

  const scheduleProgress = todaySchedules.length > 0 ? (doneSchedules.length / todaySchedules.length) * 100 : 0

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-ink">今日概览</h2>
        <span className="rounded-full border border-ink-border bg-surface px-3 py-1 text-xs font-medium text-ink-soft shadow-soft">
          {formatDate(today)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KPICard
          label="今日收入"
          value={`¥${formatMoney(todayIncome)}`}
          sub={todayIncome > 0 ? `${todayAccounts.filter((a) => a.type === 'income').length} 笔收入` : '暂无收入'}
          color="#D946EF"
          icon={ICONS.income}
          trend={{ value: '0.0%', up: true }}
          onClick={() => onNavigate?.('accounting')}
        />
        <KPICard
          label="今日支出"
          value={`¥${formatMoney(todayExpense)}`}
          sub={todayExpense > 0 ? `${todayAccounts.filter((a) => a.type === 'expense').length} 笔支出` : '暂无支出'}
          color="#A855F7"
          icon={ICONS.expense}
          trend={{ value: '0.0%', up: false }}
          onClick={() => onNavigate?.('accounting')}
        />
        <KPICard
          label="习惯打卡"
          value={todayHabits.length}
          sub={todayHabits.length > 0 ? '今日已打卡' : '今日未打卡'}
          color="#EC4899"
          icon={ICONS.habit}
          progress={todayHabits.length > 0 ? 100 : 0}
          trend={{ value: '0', up: true }}
          onClick={() => onNavigate?.('habits')}
        />
        <KPICard
          label="今日日程"
          value={`${doneSchedules.length}/${todaySchedules.length}`}
          sub={pendingSchedules.length > 0 ? `${pendingSchedules.length} 项待完成` : '全部完成'}
          color="#F472B6"
          icon={ICONS.schedule}
          progress={scheduleProgress}
          trend={{ value: '0', up: true }}
          onClick={() => onNavigate?.('schedule')}
        />
        <KPICard
          label="待买清单"
          value={unbought.length}
          sub={unbought.length > 0 ? `预估 ¥${formatMoney(unboughtTotal)}` : '全部已买'}
          color="#8B5CF6"
          icon={ICONS.shopping}
          trend={{ value: '0', up: false }}
          onClick={() => onNavigate?.('shopping')}
        />
      </div>
    </section>
  )
}
