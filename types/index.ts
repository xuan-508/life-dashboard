// ============ 记账理财 ============
export interface AccountRecord {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  note: string
  date: string // YYYY-MM-DD
  createdAt: number
}

// ============ 习惯健康 ============
export type HabitType = 'check' | 'count' | 'value'

export interface Habit {
  id: string
  name: string
  type: HabitType
  unit: string
  target: number
  color: string
  createdAt: number
}

export interface HabitLog {
  id: string
  habitId: string
  date: string // YYYY-MM-DD
  value: number
  createdAt: number
}

// ============ 减脂健身 ============
export interface FitnessRecord {
  id: string
  date: string // YYYY-MM-DD
  weight: number
  bodyFat: number | null
  intake: number | null  // 摄入 kcal
  burn: number | null    // 消耗 kcal
  note: string
  createdAt: number
}

export interface FitnessGoal {
  targetWeight: number
  dailyCalorieTarget: number | null
}

// ============ 日程统筹 ============
export type ScheduleStatus = 'todo' | 'doing' | 'done'
export type SchedulePriority = 'low' | 'medium' | 'high'

export interface ScheduleItem {
  id: string
  title: string
  date: string // YYYY-MM-DD
  status: ScheduleStatus
  priority: SchedulePriority
  note: string
  createdAt: number
}

// ============ 待买清单 ============
export interface ShoppingItem {
  id: string
  name: string
  price: number | null
  bought: boolean
  url: string
  createdAt: number
}

// ============ 书影音 ============
export type MediaType = 'book' | 'movie' | 'music' | 'tv'
export type MediaStatus = 'wishlist' | 'reading' | 'done'

export interface MediaItem {
  id: string
  title: string
  type: MediaType
  status: MediaStatus
  rating: number // 0-5
  note: string
  cover: string
  createdAt: number
}
