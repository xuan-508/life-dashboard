'use client'

import { ReactNode } from 'react'

export interface SidebarItem {
  key: string
  label: string
  icon: string
  badge?: number
}

export interface SidebarProps {
  items: SidebarItem[]
  active: string
  onChange: (key: string) => void
  logo?: ReactNode
  footer?: ReactNode
  collapsed?: boolean
  onToggleCollapse?: () => void
  /**
   * 为 true 时表示作为移动端抽屉内容渲染，不使用 fixed / hidden lg:flex，
   * 而是占满父容器 flex 高度，宽度由外部抽屉控制。
   */
  mobile?: boolean
}

export default function Sidebar({
  items,
  active,
  onChange,
  logo,
  footer,
  collapsed = false,
  onToggleCollapse,
  mobile = false,
}: SidebarProps) {
  return (
    <aside
      className={
        mobile
          ? 'flex h-full w-full flex-col bg-surface'
          : `fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-ink-border bg-surface shadow-soft transition-all duration-300 lg:flex ${
              collapsed ? 'w-16' : 'w-60'
            }`
      }
    >
      <div
        className={`flex h-16 items-center justify-between border-b border-ink-border px-3 ${
          collapsed ? 'px-3' : 'px-4'
        }`}
      >
        <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}>
          {logo}
        </div>
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className='rounded-clean bg-surface-2 p-1.5 text-ink-faint transition-colors hover:bg-surface hover:text-ink'
            title='收起目录'
          >
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
            </svg>
          </button>
        )}
      </div>

      <nav className='flex-1 overflow-y-auto py-4 px-2'>
        <ul className='space-y-1'>
          {items.map((item) => {
            const isActive = active === item.key
            return (
              <li key={item.key}>
                <button
                  onClick={() => onChange(item.key)}
                  title={collapsed ? item.label : undefined}
                  className={`group flex w-full items-center rounded-clean transition-colors ${
                    collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                  } text-sm font-medium ${
                    isActive
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <svg
                    className={`h-5 w-5 shrink-0 ${collapsed ? 'mx-auto' : ''}`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={1.8}
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d={item.icon} />
                  </svg>
                  {!collapsed && (
                    <>
                      <span className='flex-1 text-left truncate'>{item.label}</span>
                      {item.badge ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                            isActive ? 'bg-white/30 text-white' : 'bg-accent-bg text-accent-dark'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 悬浮展开按钮（折叠后显示在侧边栏右下角外侧） */}
      {collapsed && onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className='absolute -right-3 bottom-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-ink-border bg-surface text-ink-faint shadow-soft transition-colors hover:bg-surface-2 hover:text-ink'
          title='展开目录'
        >
          <svg className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
          </svg>
        </button>
      )}

      {!collapsed && footer && (
        <div className='border-t border-ink-border p-4 text-xs text-ink-faint'>
          {footer}
        </div>
      )}
    </aside>
  )
}
