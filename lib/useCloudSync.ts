'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  loadAllFromCloud,
  saveAllToCloud,
  debouncedSaveToCloud,
  isCloudSyncEnabled,
  CLOUD_KEYS,
} from './cloudStorage'

export type CloudSyncStatus = 'idle' | 'loading' | 'synced' | 'error' | 'disabled'

export interface CloudSyncState {
  /** 当前同步状态 */
  status: CloudSyncStatus
  /** 云端加载的模块数量 */
  loadedCount: number
  /** 上传到云端的模块数量（初始化时） */
  uploadedCount: number
  /** 错误信息 */
  error: string | null
  /** 是否已启用云同步 */
  enabled: boolean
}

/**
 * 云同步 Hook — 管理页面级的数据加载与自动保存
 *
 * 生命周期：
 * 1. 页面加载时 → loadAllFromCloud()
 *    - 云端有数据 → 写入 localStorage，触发组件刷新
 *    - 云端为空 + 本地有数据 → saveAllToCloud() 上传本地数据初始化
 * 2. 之后监听 'local-storage-sync' 事件 → 防抖保存变更的模块
 *
 * 用法：
 *   const { status, enabled } = useCloudSync()
 */
export function useCloudSync(): CloudSyncState {
  const [status, setStatus] = useState<CloudSyncStatus>('idle')
  const [loadedCount, setLoadedCount] = useState(0)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const initializedRef = useRef(false)

  const enabled = isCloudSyncEnabled()

  // ========== 1. 初始加载 + 本地数据上传 ==========
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    if (!enabled) {
      setStatus('disabled')
      return
    }

    setStatus('loading')

    ;(async () => {
      try {
        // Step 1: 从云端加载所有数据
        const loaded = await loadAllFromCloud()
        setLoadedCount(loaded)

        // Step 2: 如果云端无数据，检查本地是否有数据，有则上传
        if (loaded === 0) {
          const hasLocalData = CLOUD_KEYS.some(
            (key) => {
              try {
                const raw = localStorage.getItem(key)
                if (!raw) return false
                const parsed = JSON.parse(raw)
                // 空数组/空对象/空字符串视为无数据
                if (Array.isArray(parsed)) return parsed.length > 0
                if (typeof parsed === 'object' && parsed !== null) return Object.keys(parsed).length > 0
                return parsed !== '' && parsed !== null
              } catch {
                return false
              }
            }
          )

          if (hasLocalData) {
            console.info('[useCloudSync] 云端为空，检测到本地数据，自动上传初始化')
            const uploaded = await saveAllToCloud()
            setUploadedCount(uploaded)
          }
        }

        setStatus('synced')
      } catch (err) {
        console.error('[useCloudSync] 初始化失败:', err)
        setError(String(err))
        setStatus('error')
      }
    })()
  }, [enabled])

  // ========== 2. 监听数据变更 → 防抖自动保存 ==========
  useEffect(() => {
    if (!enabled || status !== 'synced') return

    function onSync(e: Event) {
      const ce = e as CustomEvent
      const changedKey = ce.detail?.key as string | undefined
      const source = ce.detail?.source as string | undefined

      // 跳过云加载事件，避免 save → load → save 循环
      if (source === 'cloud-load') return

      if (changedKey && CLOUD_KEYS.includes(changedKey as never)) {
        // 指定了变更的 key → 只保存该模块
        try {
          const raw = localStorage.getItem(changedKey)
          if (raw) {
            const data = JSON.parse(raw)
            debouncedSaveToCloud(changedKey, data)
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    window.addEventListener('local-storage-sync', onSync)
    return () => window.removeEventListener('local-storage-sync', onSync)
  }, [enabled, status])

  return {
    status,
    loadedCount,
    uploadedCount,
    error,
    enabled,
  }
}

/**
 * 手动触发全量同步（可用于"立即同步"按钮）
 */
export function useManualSync() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ loaded: number; saved: number } | null>(null)

  const sync = useCallback(async (direction: 'load' | 'save' | 'both' = 'both') => {
    if (!isCloudSyncEnabled()) return
    setSyncing(true)
    try {
      let loaded = 0
      let saved = 0
      if (direction === 'load' || direction === 'both') {
        loaded = await loadAllFromCloud()
      }
      if (direction === 'save' || direction === 'both') {
        saved = await saveAllToCloud()
      }
      setResult({ loaded, saved })
    } finally {
      setSyncing(false)
    }
  }, [])

  return { syncing, result, sync }
}
