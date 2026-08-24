'use client'

import { useState, useMemo } from 'react'
import { FitnessRecord, FitnessGoal } from '@/types'
import { useLocalStorage, uid, todayStr, last7Days, shortDay, calcBMI, bmiCategory } from '@/lib/storage'
import LineChart from '@/components/charts/LineChart'
import MiniBarChart from '@/components/charts/MiniBarChart'

export default function Fitness() {
  const [records, setRecords] = useLocalStorage<FitnessRecord[]>('ld_fitness', [])
  const [goal, setGoal] = useLocalStorage<FitnessGoal>('ld_fitness_goal', {
    targetWeight: 65,
    dailyCalorieTarget: 1800,
  })
  const [height, setHeight] = useLocalStorage<number>('ld_fitness_height', 170)
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState(false)
  const [form, setForm] = useState({
    weight: '',
    bodyFat: '',
    intake: '',
    burn: '',
    note: '',
    date: todayStr(),
  })

  const days7 = last7Days()

  // 7-day weight data for line chart
  const weightData = useMemo(() => {
    return days7.map((date) => {
      const rec = records.find((r) => r.date === date)
      return { label: shortDay(date), value: rec?.weight || 0 }
    }).filter((d) => d.value > 0)
  }, [records, days7])

  // 7-day calorie deficit for mini bar chart
  const calorieData = useMemo(() => {
    return days7.map((date) => {
      const rec = records.find((r) => r.date === date)
      const intake = rec?.intake || 0
      const burn = rec?.burn || 0
      const deficit = burn - intake
      return { label: shortDay(date), value: Math.max(deficit, 0), color: '#D946EF' }
    })
  }, [records, days7])

  // Latest record
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const bmi = latest ? calcBMI(latest.weight, height) : 0
  const bmiInfo = bmiCategory(bmi)

  const handleSubmit = () => {
    const weight = parseFloat(form.weight)
    if (!weight || weight <= 0) return
    const rec: FitnessRecord = {
      id: uid(),
      date: form.date,
      weight,
      bodyFat: form.bodyFat ? parseFloat(form.bodyFat) : null,
      intake: form.intake ? parseInt(form.intake) : null,
      burn: form.burn ? parseInt(form.burn) : null,
      note: form.note,
      createdAt: Date.now(),
    }
    setRecords((prev) => [rec, ...prev])
    setShowForm(false)
    setForm({ weight: '', bodyFat: '', intake: '', burn: '', note: '', date: todayStr() })
  }

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card-sm">
          <div className="label mb-1">当前体重</div>
          <div className="stat-sm text-ink">{latest ? `${latest.weight}` : '—'} <span className="text-xs text-ink-faint">kg</span></div>
        </div>
        <div className="card-sm">
          <div className="label mb-1">目标体重</div>
          <div className="stat-sm text-accent">{goal.targetWeight} <span className="text-xs text-ink-faint">kg</span></div>
        </div>
        <div className="card-sm">
          <div className="label mb-1">BMI</div>
          <div className="stat-sm" style={{ color: bmi > 0 ? bmiInfo.color : '#C084FC' }}>
            {bmi > 0 ? bmi : '—'}
          </div>
          {bmi > 0 && <div className="text-[11px] font-mono mt-0.5" style={{ color: bmiInfo.color }}>{bmiInfo.label}</div>}
        </div>
        <div className="card-sm">
          <div className="label mb-1">体脂率</div>
          <div className="stat-sm text-ink">{latest?.bodyFat != null ? `${latest.bodyFat}%` : '—'}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="label mb-3">近7日体重趋势</div>
          {weightData.length > 0 ? (
            <LineChart data={weightData} height={120} color="#D946EF" format={(n) => `${n}kg`} />
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-ink-faint">暂无记录</div>
          )}
        </div>
        <div className="card">
          <div className="label mb-3">近7日热量缺口</div>
          <MiniBarChart data={calorieData} height={120} format={(n) => `${n}`} />
        </div>
      </div>

      {/* Goal editor */}
      {editGoal && (
        <div className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label mb-1">目标体重 (kg)</div>
              <input
                className="input"
                type="number"
                value={goal.targetWeight}
                onChange={(e) => setGoal({ ...goal, targetWeight: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <div className="label mb-1">每日热量目标 (kcal)</div>
              <input
                className="input"
                type="number"
                value={goal.dailyCalorieTarget ?? ''}
                onChange={(e) => setGoal({ ...goal, dailyCalorieTarget: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
          </div>
          <div>
            <div className="label mb-1">身高 (cm)</div>
            <input
              className="input max-w-32"
              type="number"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
            />
          </div>
          <button className="btn btn-ghost w-full" onClick={() => setEditGoal(false)}>完成</button>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <button className="btn btn-accent" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '+ 记录数据'}
        </button>
        <button className="btn btn-ghost" onClick={() => setEditGoal(!editGoal)}>
          {editGoal ? '取消' : '编辑目标'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <div className="label mb-1">体重 (kg)</div>
              <input
                className="input"
                type="number"
                step="0.1"
                placeholder="如 65.5"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
            <div>
              <div className="label mb-1">体脂率 (%)</div>
              <input
                className="input"
                type="number"
                step="0.1"
                placeholder="可选"
                value={form.bodyFat}
                onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
              />
            </div>
            <div>
              <div className="label mb-1">日期</div>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <div className="label mb-1">摄入 (kcal)</div>
              <input
                className="input"
                type="number"
                placeholder="可选"
                value={form.intake}
                onChange={(e) => setForm({ ...form, intake: e.target.value })}
              />
            </div>
            <div>
              <div className="label mb-1">消耗 (kcal)</div>
              <input
                className="input"
                type="number"
                placeholder="可选"
                value={form.burn}
                onChange={(e) => setForm({ ...form, burn: e.target.value })}
              />
            </div>
            <div>
              <div className="label mb-1">备注</div>
              <input
                className="input"
                type="text"
                placeholder="可选"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-accent w-full" onClick={handleSubmit}>确认记录</button>
        </div>
      )}

      {/* Records list */}
      <div className="space-y-1">
        {sorted.length === 0 ? (
          <div className="card text-center text-sm text-ink-faint py-8">暂无记录</div>
        ) : (
          sorted.slice(0, 30).map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 border-b border-white/60 py-2 px-1 hover:bg-white/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{r.weight}kg</span>
                  {r.bodyFat != null && <span className="text-xs font-mono text-ink-faint">体脂 {r.bodyFat}%</span>}
                  {r.intake != null && r.burn != null && (
                    <span className="text-xs font-mono" style={{ color: r.burn - r.intake >= 0 ? '#D946EF' : '#E11D48' }}>
                      缺口 {r.burn - r.intake}kcal
                    </span>
                  )}
                  {r.note && <span className="text-xs text-ink-faint truncate">{r.note}</span>}
                </div>
                <div className="text-[11px] font-mono text-ink-faint">{r.date}</div>
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
