'use client'

/* eslint-disable @next/next/no-img-element */
import { ReactNode } from 'react'

export interface HeaderProps {
  title: string
  updatedAt?: string
  actions?: ReactNode
  search?: ReactNode
  extra?: ReactNode
  onMenuClick?: () => void
  logo?: ReactNode
}

export default function Header({ title, updatedAt, actions, search, extra, onMenuClick, logo }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-ink-border bg-surface px-4 shadow-soft sm:px-6">
      {/* 左侧：汉堡菜单 + Logo + 页面标题 */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-soft transition-colors hover:bg-accent-bg hover:text-ink lg:hidden"
          title="菜单"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {logo && <div className="hidden shrink-0 items-center gap-2 lg:flex">{logo}</div>}

        <div className="hidden h-6 w-px bg-ink-border/60 sm:block" />

        <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-3">
          <h1 className="truncate text-base font-semibold text-ink sm:text-lg">
            {title}
          </h1>
          {updatedAt && (
            <span className="hidden shrink-0 text-xs text-ink-faint sm:inline">
              更新于 {updatedAt}
            </span>
          )}
        </div>
      </div>

      {/* 中间：长搜索框 */}
      <div className="hidden flex-1 justify-center px-8 lg:flex">
        {search && (
          <div className="w-full max-w-xl">
            {search}
          </div>
        )}
      </div>

      {/* 右侧：通知 + 头像 + 操作按钮 */}
      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          {extra}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

export function HeaderAction({
  children,
  onClick,
  title,
  primary = false,
}: {
  children: ReactNode
  onClick?: () => void
  title?: string
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        primary
          ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-soft hover:shadow-md hover:brightness-105'
          : 'border border-ink-border bg-surface-2 text-ink-soft shadow-sm hover:border-accent/30 hover:bg-accent-bg hover:text-accent'
      }`}
    >
      {children}
    </button>
  )
}

export function SearchInput({ value, onChange, placeholder = '搜索…' }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative w-full">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-ink-border bg-surface-2 py-2 pl-10 pr-4 text-sm text-ink shadow-sm placeholder:text-ink-faint focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
      />
    </div>
  )
}

export function IconButton({
  icon,
  onClick,
  title,
  dot,
}: {
  icon: string
  onClick?: () => void
  title?: string
  dot?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-ink-border bg-surface-2 text-ink-soft shadow-sm transition-all hover:border-accent/30 hover:bg-accent-bg hover:text-accent"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {dot && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pink-500 ring-2 ring-white" />}
    </button>
  )
}

export function Avatar({ src, fallback }: { src?: string; fallback?: string }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-medium text-white ring-2 ring-accent/20">
      {src ? <img src={src} alt="avatar" className="h-full w-full object-cover" /> : fallback}
    </div>
  )
}
