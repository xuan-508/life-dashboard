'use client'

import { useState, useMemo } from 'react'
import { useLocalStorage, uid } from '@/lib/storage'
import type { MediaItem, MediaType, MediaStatus } from '@/types'

const TYPE_CONFIG: Record<MediaType, { label: string; icon: string }> = {
  book:  { label: '书籍', icon: 'B' },
  movie: { label: '电影', icon: 'M' },
  music: { label: '音乐', icon: 'S' },
  tv:    { label: '剧集', icon: 'T' },
}

const STATUS_CONFIG: Record<MediaStatus, { label: string; color: string }> = {
  wishlist: { label: '想看', color: '#C084FC' },
  reading:  { label: '在看', color: '#D946EF' },
  done:     { label: '看完', color: '#A855F7' },
}

const TYPE_FILTERS: { value: MediaType | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'book', label: '书籍' },
  { value: 'movie', label: '电影' },
  { value: 'music', label: '音乐' },
  { value: 'tv', label: '剧集' },
]

const STATUS_FILTERS: { value: MediaStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'wishlist', label: '想看' },
  { value: 'reading', label: '在看' },
  { value: 'done', label: '看完' },
]

export default function Media() {
  const [items, setItems] = useLocalStorage<MediaItem[]>('ld_media', [])
  const [title, setTitle] = useState('')
  const [type, setType] = useState<MediaType>('book')
  const [note, setNote] = useState('')
  const [cover, setCover] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<MediaStatus | 'all'>('all')

  const filtered = useMemo(() => {
    return items
      .filter((i) => filterType === 'all' || i.type === filterType)
      .filter((i) => filterStatus === 'all' || i.status === filterStatus)
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [items, filterType, filterStatus])

  const stats = useMemo(() => {
    return {
      total: items.length,
      wishlist: items.filter((i) => i.status === 'wishlist').length,
      reading: items.filter((i) => i.status === 'reading').length,
      done: items.filter((i) => i.status === 'done').length,
    }
  }, [items])

  function handleAdd() {
    if (!title.trim()) return
    const newItem: MediaItem = {
      id: uid(),
      title: title.trim(),
      type,
      status: 'wishlist',
      rating: 0,
      note: note.trim(),
      cover: cover.trim(),
      createdAt: Date.now(),
    }
    setItems((prev) => [...prev, newItem])
    setTitle('')
    setNote('')
    setCover('')
  }

  function cycleStatus(id: string) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const order: MediaStatus[] = ['wishlist', 'reading', 'done']
        const idx = order.indexOf(i.status)
        return { ...i, status: order[(idx + 1) % order.length], updatedAt: Date.now() }
      })
    )
  }

  function setRating(id: string, rating: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, rating, updatedAt: Date.now() } : i))
    )
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card-sm">
          <div className="label">收藏</div>
          <div className="stat-sm mt-1">{stats.total}</div>
        </div>
        <div className="card-sm">
          <div className="label">想看</div>
          <div className="stat-sm mt-1 text-ink-faint">{stats.wishlist}</div>
        </div>
        <div className="card-sm">
          <div className="label">在看</div>
          <div className="stat-sm mt-1 text-accent-dark">{stats.reading}</div>
        </div>
        <div className="card-sm">
          <div className="label">看完</div>
          <div className="stat-sm mt-1 text-[#F472B6]">{stats.done}</div>
        </div>
      </div>

      {/* Add form */}
      <div className="card">
        <div className="label mb-3">添加收藏</div>
        <div className="flex flex-wrap gap-2">
          <input
            className="input flex-1 min-w-[140px]"
            placeholder="标题…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <select
            className="input w-[100px]"
            value={type}
            onChange={(e) => setType(e.target.value as MediaType)}
          >
            <option value="book">书籍</option>
            <option value="movie">电影</option>
            <option value="music">音乐</option>
            <option value="tv">剧集</option>
          </select>
          <button className="btn btn-accent" onClick={handleAdd}>添加</button>
        </div>
        <div className="flex gap-2 mt-2">
          <input
            className="input"
            placeholder="封面链接（可选）…"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
          />
          <input
            className="input"
            placeholder="备注（可选）…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`chip ${filterType === f.value ? 'chip-active' : 'chip-idle'} cursor-pointer transition-colors`}
              onClick={() => setFilterType(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-ink-border mx-1" />
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`chip ${filterStatus === f.value ? 'chip-active' : 'chip-idle'} cursor-pointer transition-colors`}
              onClick={() => setFilterStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex gap-1">
          <button
            className={`chip ${viewMode === 'grid' ? 'chip-active' : 'chip-idle'} cursor-pointer transition-colors`}
            onClick={() => setViewMode('grid')}
          >
            封面墙
          </button>
          <button
            className={`chip ${viewMode === 'list' ? 'chip-active' : 'chip-idle'} cursor-pointer transition-colors`}
            onClick={() => setViewMode('list')}
          >
            列表
          </button>
        </div>
      </div>

      {/* Grid view */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.length === 0 && (
            <div className="col-span-full card text-center text-ink-faint text-sm py-8">
              还没有收藏，添加一些吧
            </div>
          )}
          {filtered.map((item) => {
            const tc = TYPE_CONFIG[item.type]
            const sc = STATUS_CONFIG[item.status]
            return (
              <div key={item.id} className="card-sm group relative">
                {/* Cover */}
                <div className="aspect-[3/4] mb-2 rounded-sm-clean overflow-hidden bg-surface-2 flex items-center justify-center">
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-3xl font-mono text-ink-faint">{tc.icon}</div>
                  )}
                </div>

                {/* Title */}
                <div className="text-sm text-ink truncate">{item.title}</div>

                {/* Status toggle */}
                <button
                  onClick={() => cycleStatus(item.id)}
                  className="text-xs font-mono mt-1 cursor-pointer transition-opacity hover:opacity-70"
                  style={{ color: sc.color }}
                >
                  {sc.label}
                </button>

                {/* Rating */}
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(item.id, star === item.rating ? star - 1 : star)}
                      className={`text-sm cursor-pointer ${star <= item.rating ? 'text-[#F472B6]' : 'text-ink-border'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* Delete on hover */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-1 right-1 text-ink-faint hover:text-[#E11D48] text-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity px-1"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="card text-center text-ink-faint text-sm py-8">
              还没有收藏，添加一些吧
            </div>
          )}
          {filtered.map((item) => {
            const tc = TYPE_CONFIG[item.type]
            const sc = STATUS_CONFIG[item.status]
            return (
              <div key={item.id} className="card-sm flex items-center gap-3">
                {/* Mini cover */}
                <div className="shrink-0 w-10 h-14 rounded-sm-clean overflow-hidden bg-surface-2 flex items-center justify-center">
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-sm font-mono text-ink-faint">{tc.icon}</div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink truncate">{item.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-ink-faint">{tc.label}</span>
                    <button
                      onClick={() => cycleStatus(item.id)}
                      className="text-xs font-mono cursor-pointer transition-opacity hover:opacity-70"
                      style={{ color: sc.color }}
                    >
                      {sc.label}
                    </button>
                  </div>
                  {item.note && (
                    <div className="text-xs text-ink-faint mt-0.5 truncate">{item.note}</div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(item.id, star === item.rating ? star - 1 : star)}
                      className={`text-sm cursor-pointer ${star <= item.rating ? 'text-[#F472B6]' : 'text-ink-border'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="shrink-0 text-ink-faint hover:text-[#E11D48] text-sm cursor-pointer transition-colors px-1"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
