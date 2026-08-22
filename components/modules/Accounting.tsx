'use client'

import { useState, useMemo } from 'react'
import { AccountRecord } from '@/types'
import { useLocalStorage, uid, todayStr, monthStr, formatMoney } from '@/lib/storage'
import BarChart from '@/components/charts/BarChart'
import DonutChart from '@/components/charts/DonutChart'
import KPICard from '@/components/ui/KPICard'

const ICONS = {
  income: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  expense: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" transform="rotate(180 12 12)"/></svg>
  ),
  balance: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
  ),
}

const EXPENSE_CATEGORIES = ['餐饮', '交通', '购物', '住房', '娱乐', '医疗', '教育', '其他']
const INCOME_CATEGORIES = ['工资', '兼职', '投资', '红包', '其他']

const CATEGORY_COLORS: Record<string, string> = {
  '餐饮': '#3B9D4A',
  '交通': '#4A90D9',
  '购物': '#E89B2F',
  '住房': '#9B59B6',
  '娱乐': '#E74C3C',
  '医疗': '#1ABC9C',
  '教育': '#34495E',
  '其他': '#999999',
  '工资': '#3B9D4A',
  '兼职': '#4A90D9',
  '投资': '#E89B2F',
  '红包': '#E74C3C',
}

export default function Accounting() {
  const [records, setRecords] = useLocalStorage<AccountRecord[]>('ld_accounts', [])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '餐饮',
    note: '',
    date: todayStr(),
  })

  const thisMonth = monthStr()

  const monthRecords = useMemo(() => records.filter((r) => r.date.startsWith(thisMonth)), [records, thisMonth])

  const totalIncome = monthRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = monthRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const balance = totalIncome - totalExpense

  // Last 6 months comparison
  const monthlyData = useMemo(() => {
    const now = new Date()
    const months: { label: string; value: number; color?: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const expense = records
        .filter((r) => r.type === 'expense' && r.date.startsWith(prefix))
        .reduce((s, r) => s + r.amount, 0)
      months.push({ label: `${d.getMonth() + 1}月`, value: expense, color: '#3B9D4A' })
    }
    return months
  }, [records])

  // Category breakdown for donut
  const donutData = useMemo(() => {
    const map: Record<string, number> = {}
    monthRecords
      .filter((r) => r.type === 'expense')
      .forEach((r) => {
        map[r.category] = (map[r.category] || 0) + r.amount
      })
    return Object.entries(map)
      .map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label] || '#999999' }))
      .sort((a, b) => b.value - a.value)
  }, [monthRecords])

  // Filtered records for list
  const filtered = useMemo(() => {
    return records
      .filter((r) => filterType === 'all' || r.type === filterType)
      .filter((r) => filterCategory === 'all' || r.category === filterCategory)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
  }, [records, filterType, filterCategory])

  const handleSubmit = () => {
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return
    const record: AccountRecord = {
      id: uid(),
      type: form.type,
      amount,
      category: form.category,
      note: form.note,
      date: form.date,
      createdAt: Date.now(),
    }
    setRecords((prev) => [record, ...prev])
    setShowForm(false)
    setForm({ type: 'expense', amount: '', category: '餐饮', note: '', date: todayStr() })
  }

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const categories = form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard
          label="本月收入"
          value={`¥${formatMoney(totalIncome)}`}
          color="#3B9D4A"
          icon={ICONS.income}
          sub="当月累计"
        />
        <KPICard
          label="本月支出"
          value={`¥${formatMoney(totalExpense)}`}
          color="#D9534F"
          icon={ICONS.expense}
          sub="当月累计"
        />
        <KPICard
          label="本月结余"
          value={`¥${formatMoney(balance)}`}
          color={balance >= 0 ? '#3B9D4A' : '#D9534F'}
          icon={ICONS.balance}
          sub={balance >= 0 ? '盈余' : '赤字'}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="label mb-3">近6月支出趋势</div>
          <BarChart data={monthlyData} format={(n) => `¥${formatMoney(n)}`} />
        </div>
        <div className="card">
          <div className="label mb-3">本月消费结构</div>
          {donutData.length > 0 ? (
            <DonutChart data={donutData} format={(n) => `¥${formatMoney(n)}`} />
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-ink-faint">暂无消费记录</div>
          )}
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn btn-accent"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '取消' : '+ 记一笔'}
        </button>
        <div className="flex gap-1">
          {(['all', 'expense', 'income'] as const).map((t) => (
            <button
              key={t}
              className={`chip ${filterType === t ? 'chip-active' : 'chip-idle'}`}
              onClick={() => setFilterType(t)}
            >
              {t === 'all' ? '全部' : t === 'expense' ? '支出' : '收入'}
            </button>
          ))}
        </div>
        <select
          className="input max-w-32 py-0.5 text-xs"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">全部分类</option>
          {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].filter((v, i, a) => a.indexOf(v) === i).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card space-y-3">
          <div className="flex gap-2">
            <button
              className={`chip ${form.type === 'expense' ? 'chip-active' : 'chip-idle'}`}
              onClick={() => setForm({ ...form, type: 'expense', category: '餐饮' })}
            >
              支出
            </button>
            <button
              className={`chip ${form.type === 'income' ? 'chip-active' : 'chip-idle'}`}
              onClick={() => setForm({ ...form, type: 'income', category: '工资' })}
            >
              收入
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input
              className="input"
              type="number"
              placeholder="金额"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              className="input"
              type="text"
              placeholder="备注"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <button className="btn btn-accent w-full" onClick={handleSubmit}>
            确认记录
          </button>
        </div>
      )}

      {/* Records List */}
      <div className="space-y-1">
        {filtered.length === 0 ? (
          <div className="card text-center text-sm text-ink-faint py-8">暂无记录</div>
        ) : (
          filtered.slice(0, 50).map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 border-b border-ink-border py-2 px-1 hover:bg-surface-2 transition-colors group"
            >
              <div
                className="w-1 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: r.type === 'income' ? '#3B9D4A' : '#D9534F' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{r.category}</span>
                  {r.note && <span className="text-xs text-ink-faint truncate">{r.note}</span>}
                </div>
                <div className="text-[11px] font-mono text-ink-faint">{r.date}</div>
              </div>
              <div className="font-mono text-sm" style={{ color: r.type === 'income' ? '#3B9D4A' : '#1A1A1A' }}>
                {r.type === 'income' ? '+' : '-'}¥{formatMoney(r.amount)}
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 text-xs text-ink-faint hover:text-red-500 transition-opacity cursor-pointer"
                onClick={() => handleDelete(r.id)}
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
