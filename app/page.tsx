'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocalStorage } from '@/lib/storage'
import { AccountRecord, HabitLog, ScheduleItem, ShoppingItem } from '@/types'
import { exportAllJSON, importFromJSON, exportAllCSV, importFromCSV, clearAllData } from '@/lib/exportImport'
import { useCloudSync, useManualSync } from '@/lib/useCloudSync'
import Overview from '@/components/modules/Overview'
import Accounting from '@/components/modules/Accounting'
import Habits from '@/components/modules/Habits'
import Fitness from '@/components/modules/Fitness'
import Schedule from '@/components/modules/Schedule'
import Shopping from '@/components/modules/Shopping'
import Media from '@/components/modules/Media'

const TABS = [
  { key: 'overview', label: '今日概览', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6' },
  { key: 'accounting', label: '记账理财', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 01-6.001 0M18 7l-3 9m-6 0V5a2 2 0 012-2h6a2 2 0 012 2v11' },
  { key: 'habits', label: '习惯健康', icon: 'M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'fitness', label: '减脂健身', icon: 'M6 5c0-1 .5-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2zM3 8l3-1 3 1 2-3M12 21l4-8 4 8M10 13c0-2 1-3 3-3s3 1 3 3-1 4-3 4-3-2-3-4z' },
  { key: 'schedule', label: '日程统筹', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'shopping', label: '待买清单', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'media', label: '书影音', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2' },
] as const

type TabKey = typeof TABS[number]['key']

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileJSONRef = useRef<HTMLInputElement>(null)
  const fileCSVRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Overview需要的共享数据 — 使用与各模块相同的localStorage key
  const [accounts] = useLocalStorage<AccountRecord[]>('ld_accounts', [])
  const [habitLogs] = useLocalStorage<HabitLog[]>('ld_habit_logs', [])
  const [schedules] = useLocalStorage<ScheduleItem[]>('ld_schedule', [])
  const [shopping] = useLocalStorage<ShoppingItem[]>('ld_shopping', [])

  // 云同步：页面加载时自动从云端加载，数据变更时自动保存
  const cloudSync = useCloudSync()
  const manualSync = useManualSync()

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [menuOpen])

  // toast自动消失
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
  }, [])

  const handleExportJSON = useCallback(() => {
    try {
      exportAllJSON()
      showToast('JSON 已导出')
    } catch {
      showToast('导出失败', 'error')
    }
    setMenuOpen(false)
  }, [showToast])

  const handleExportCSV = useCallback(() => {
    try {
      exportAllCSV()
      showToast('CSV 已导出')
    } catch {
      showToast('导出失败', 'error')
    }
    setMenuOpen(false)
  }, [showToast])

  const handleImportJSON = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importFromJSON(file)
      showToast(`已导入 ${result.imported} 项数据`)
    } catch (err) {
      showToast((err as Error).message, 'error')
    }
    // 重置input以便重复导入同一文件
    e.target.value = ''
  }, [showToast])

  const handleImportCSV = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importFromCSV(file)
      showToast(`已导入 ${result.imported} 项数据`)
    } catch (err) {
      showToast((err as Error).message, 'error')
    }
    e.target.value = ''
  }, [showToast])

  const handleClearData = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm('确认清空所有数据？此操作不可撤销，建议先导出备份。')) {
      const keys = clearAllData()
      showToast(`已清空 ${keys.length} 项数据`)
    }
    setMenuOpen(false)
  }, [showToast])

  const handleManualSync = useCallback(async () => {
    if (!cloudSync.enabled) return
    showToast('正在同步...', 'success')
    await manualSync.sync('both')
    if (manualSync.result) {
      showToast(`同步完成：加载 ${manualSync.result.loaded} 项，保存 ${manualSync.result.saved} 项`)
    }
  }, [cloudSync.enabled, manualSync, showToast])

  // 云同步状态指示器配置
  const syncIndicator = (() => {
    if (!cloudSync.enabled) {
      return { dot: 'bg-ink/20', text: '仅本地', title: '云同步未启用（未配置 API_SECRET）' }
    }
    switch (cloudSync.status) {
      case 'loading':
        return { dot: 'bg-amber-400 animate-pulse', text: '同步中', title: '正在从云端加载数据...' }
      case 'synced':
        return { dot: 'bg-green-500', text: '已同步', title: '数据已与云端同步' }
      case 'error':
        return { dot: 'bg-red-500', text: '同步失败', title: cloudSync.error ?? '同步出错' }
      default:
        return { dot: 'bg-ink/20', text: '等待中', title: '等待初始化' }
    }
  })()

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-ink/8 bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              <span className="text-accent">·</span> 生活工作台
            </h1>
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-xs text-ink/50 sm:inline">
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </span>

              {/* 云同步状态指示器 */}
              <button
                onClick={handleManualSync}
                disabled={!cloudSync.enabled || manualSync.syncing}
                className="flex items-center gap-1.5 rounded-clean border border-ink/10 px-2.5 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                title={syncIndicator.title}
              >
                <span className={`h-2 w-2 rounded-full ${syncIndicator.dot}`} />
                <span className="hidden sm:inline">{manualSync.syncing ? '同步中...' : syncIndicator.text}</span>
              </button>

              {/* 导出/导入菜单 */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1 rounded-clean border border-ink/10 px-2.5 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-accent/30 hover:text-accent"
                  aria-label="数据管理"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                  </svg>
                  <span className="hidden sm:inline">数据</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 overflow-hidden rounded-lg border border-ink/10 bg-paper shadow-lg">
                    <button
                      onClick={handleExportJSON}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-ink/80 transition-colors hover:bg-accent/5 hover:text-accent"
                    >
                      <svg className="h-4 w-4 shrink-0 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                      </svg>
                      导出 JSON
                    </button>
                    <button
                      onClick={() => { fileJSONRef.current?.click() }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-ink/80 transition-colors hover:bg-accent/5 hover:text-accent"
                    >
                      <svg className="h-4 w-4 shrink-0 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 0l-4 4m4-4l4 4M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                      </svg>
                      导入 JSON
                    </button>
                    <div className="border-t border-ink/5" />
                    <button
                      onClick={handleExportCSV}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-ink/80 transition-colors hover:bg-accent/5 hover:text-accent"
                    >
                      <svg className="h-4 w-4 shrink-0 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                      </svg>
                      导出 CSV
                    </button>
                    <button
                      onClick={() => { fileCSVRef.current?.click() }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-ink/80 transition-colors hover:bg-accent/5 hover:text-accent"
                    >
                      <svg className="h-4 w-4 shrink-0 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 0l-4 4m4-4l4 4M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                      </svg>
                      导入 CSV
                    </button>
                    <div className="border-t border-ink/5" />
                    <button
                      onClick={handleClearData}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600/70 transition-colors hover:bg-red-50"
                    >
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                      </svg>
                      清空数据
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 隐藏的文件选择input */}
      <input ref={fileJSONRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportJSON} />
      <input ref={fileCSVRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportCSV} />

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 animate-fadeIn">
          <div className={`rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${
            toast.type === 'success' ? 'bg-accent text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.msg}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="sticky top-[57px] z-40 border-b border-ink/8 bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-2 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-ink/50 hover:text-ink'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === 'overview' && (
          <Overview
            accounts={accounts}
            habitLogs={habitLogs}
            schedules={schedules}
            shopping={shopping}
          />
        )}
        {activeTab === 'accounting' && <Accounting />}
        {activeTab === 'habits' && <Habits />}
        {activeTab === 'fitness' && <Fitness />}
        {activeTab === 'schedule' && <Schedule />}
        {activeTab === 'shopping' && <Shopping />}
        {activeTab === 'media' && <Media />}
      </main>

      {/* Footer */}
      <footer className="border-t border-ink/8 py-6">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="font-mono text-xs text-ink/40">
            生活工作台 · {cloudSync.enabled
              ? `云端同步已${cloudSync.status === 'synced' ? '连接' : cloudSync.status === 'loading' ? '连接中' : cloudSync.status === 'error' ? '异常' : '等待中'}`
              : '数据存储于本地浏览器'} · Next.js
          </p>
        </div>
      </footer>
    </div>
  )
}
