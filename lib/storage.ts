'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * localStorage-backed state hook with SSR safety.
 * Each module gets its own storage key.
 *
 * Anti-feedback-loop design:
 * - A `serializedRef` holds the last JSON string we wrote to localStorage.
 * - The write effect only writes + dispatches when the serialized value
 *   actually differs from what we last wrote (prevents self-triggered loops).
 * - The onSync listener only calls setValue when the incoming JSON differs
 *   from what we already hold (prevents setValue → write → onSync → setValue
 *   infinite loops, since JSON.parse always creates a new reference).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue)
  const [loaded, setLoaded] = useState(false)

  // Track the last serialized value to break feedback loops
  const serializedRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T
        serializedRef.current = raw
        setValue(parsed)
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true)
  }, [key])

  // Write effect: persist value to localStorage + notify other instances
  useEffect(() => {
    if (!loaded) return
    try {
      const serialized = JSON.stringify(value)
      // Only write + dispatch if the serialized value actually changed
      if (serializedRef.current === serialized) return
      serializedRef.current = serialized
      localStorage.setItem(key, serialized)
      // notify other hook instances sharing the same key
      window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }))
    } catch {
      // storage full or unavailable
    }
  }, [key, value, loaded])

  // cross-component sync: when another instance writes to the same key, reload
  useEffect(() => {
    function onSync(e: Event) {
      const ce = e as CustomEvent
      if (ce.detail?.key !== key) return
      try {
        const raw = localStorage.getItem(key)
        if (raw === null) return
        // Only update if the incoming value differs from what we already have
        if (serializedRef.current === raw) return
        serializedRef.current = raw
        setValue(JSON.parse(raw) as T)
      } catch {
        // ignore
      }
    }
    // also listen to native storage events (e.g. from other tabs)
    function onStorage(e: StorageEvent) {
      if (e.key !== key) return
      try {
        const raw = e.newValue
        if (raw === null) {
          // Key was deleted; reset to initial value
          if (serializedRef.current !== null) {
            serializedRef.current = null
            setValue(initialValue)
          }
          return
        }
        if (serializedRef.current === raw) return
        serializedRef.current = raw
        setValue(JSON.parse(raw) as T)
      } catch {
        // ignore
      }
    }
    window.addEventListener('local-storage-sync', onSync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('local-storage-sync', onSync)
      window.removeEventListener('storage', onStorage)
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((val: T | ((prev: T) => T)) => {
    setValue(val)
  }, [])

  return [value, update]
}

// ============ Utilities ============

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${month}月${day}日 周${weekdays[d.getDay()]}`
}

export function monthStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function last7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    days.push(`${y}-${m}-${day}`)
  }
  return days
}

export function last30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    days.push(`${y}-${m}-${day}`)
  }
  return days
}

export function shortDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return String(d.getDate())
}

export function weekdayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return weekdays[d.getDay()]
}

export function formatMoney(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function calcBMI(weight: number, heightCm: number): number {
  if (!heightCm || heightCm <= 0) return 0
  const h = heightCm / 100
  return Math.round((weight / (h * h)) * 10) / 10
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: '偏瘦', color: '#B9A4C7' }
  if (bmi < 24) return { label: '正常', color: '#A855F7' }
  if (bmi < 28) return { label: '偏胖', color: '#D946EF' }
  return { label: '肥胖', color: '#EC4899' }
}
