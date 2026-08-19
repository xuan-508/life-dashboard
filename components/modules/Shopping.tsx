'use client'

import { useState, useMemo } from 'react'
import { useLocalStorage, uid, formatMoney } from '@/lib/storage'
import type { ShoppingItem } from '@/types'

export default function Shopping() {
  const [items, setItems] = useLocalStorage<ShoppingItem[]>('ld_shopping', [])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.bought !== b.bought) return a.bought ? 1 : -1
      return b.createdAt - a.createdAt
    })
  }, [items])

  const stats = useMemo(() => {
    const pending = items.filter((i) => !i.bought)
    const bought = items.filter((i) => i.bought)
    const pendingTotal = pending.reduce((sum, i) => sum + (i.price || 0), 0)
    const boughtTotal = bought.reduce((sum, i) => sum + (i.price || 0), 0)
    return {
      pendingCount: pending.length,
      boughtCount: bought.length,
      pendingTotal,
      boughtTotal,
    }
  }, [items])

  function handleAdd() {
    if (!name.trim()) return
    const newItem: ShoppingItem = {
      id: uid(),
      name: name.trim(),
      price: price ? parseFloat(price) : null,
      bought: false,
      url: url.trim(),
      createdAt: Date.now(),
    }
    setItems((prev) => [...prev, newItem])
    setName('')
    setPrice('')
    setUrl('')
  }

  function toggleBought(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, bought: !i.bought } : i))
    )
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-sm">
          <div className="label">待买预估</div>
          <div className="stat mt-1 text-accent-dark">¥{formatMoney(stats.pendingTotal)}</div>
          <div className="text-xs text-ink-faint mt-1">{stats.pendingCount} 件</div>
        </div>
        <div className="card-sm">
          <div className="label">已买花费</div>
          <div className="stat mt-1 text-ink-faint">¥{formatMoney(stats.boughtTotal)}</div>
          <div className="text-xs text-ink-faint mt-1">{stats.boughtCount} 件</div>
        </div>
      </div>

      {/* Add form */}
      <div className="card">
        <div className="label mb-3">添加待买</div>
        <div className="flex flex-wrap gap-2">
          <input
            className="input flex-1 min-w-[140px]"
            placeholder="商品名称…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="number"
            className="input w-[120px]"
            placeholder="预估价格"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button className="btn btn-accent" onClick={handleAdd}>添加</button>
        </div>
        <input
          className="input mt-2"
          placeholder="链接（可选）…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="card text-center text-ink-faint text-sm py-8">
            清单空空如也，添加点什么吧
          </div>
        )}
        {sorted.map((item) => (
          <div
            key={item.id}
            className={`card-sm flex items-center gap-3 ${item.bought ? 'opacity-50' : ''}`}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleBought(item.id)}
              className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                item.bought
                  ? 'bg-accent border-accent'
                  : 'bg-surface border-ink-border hover:border-accent'
              }`}
            >
              {item.bought && (
                <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6L5 9L10 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${item.bought ? 'line-through text-ink-faint' : 'text-ink'}`}>
                {item.name}
              </div>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline mt-0.5 inline-block"
                  onClick={(e) => e.stopPropagation()}
                >
                  打开链接 ↗
                </a>
              )}
            </div>

            {/* Price */}
            {item.price !== null && (
              <div className={`font-mono text-sm shrink-0 ${item.bought ? 'text-ink-faint' : 'text-ink'}`}>
                ¥{formatMoney(item.price)}
              </div>
            )}

            {/* Delete */}
            <button
              onClick={() => handleDelete(item.id)}
              className="shrink-0 text-ink-faint hover:text-[#D9534F] text-sm cursor-pointer transition-colors px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
