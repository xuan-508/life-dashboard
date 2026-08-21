'use client'

/**
 * 开屏动画组件（临时功能）
 *
 * 应用打开时全屏展示一次开屏画面：
 * - 有自定义开屏图（ld_splash_image）时居中展示图片
 * - 无自定义图时展示默认“生活工作台”文字 logo
 * - 淡入(0.3s) → 停留(1.2s) → 淡出(0.5s)，动画结束后自动卸载
 *
 * 删除方式：从 app/page.tsx 移除 import 与 <SplashScreen />，
 * 删除 globals.css 中 splash 相关 keyframes，再删除本文件即可。
 */

import { useEffect, useState } from 'react'
import { useLocalStorage } from '@/lib/storage'

const SPLASH_TOTAL_MS = 2000 // 淡入0.3s + 停留1.2s + 淡出0.5s

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [splashImage] = useLocalStorage<string>('ld_splash_image', '')

  // 总时长后卸载组件
  useEffect(() => {
    const total = setTimeout(() => setVisible(false), SPLASH_TOTAL_MS)
    const startFadeOut = setTimeout(() => setLeaving(true), SPLASH_TOTAL_MS - 500)
    return () => {
      clearTimeout(total)
      clearTimeout(startFadeOut)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-paper transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'animate-splash-in'
      }`}
      aria-hidden="true"
    >
      {splashImage ? (
        <img
          src={splashImage}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-3 animate-splash-in">
          <svg className="h-14 w-14 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
          </svg>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">生活工作台</span>
          </div>
          <p className="font-mono text-xs text-ink/40">LIFE · WORK · BALANCE</p>
        </div>
      )}
    </div>
  )
}
