/**
 * 导出 / 导入工具 — 支持JSON全量备份和CSV多模块导出
 * 所有数据均存储在localStorage中，key前缀为 ld_
 */

// 所有已知的数据key及其模块名（用于CSV导出）
const STORAGE_KEYS: Record<string, string> = {
  ld_accounts: '记账理财',
  ld_habits: '习惯定义',
  ld_habit_logs: '习惯打卡',
  ld_fitness: '健身记录',
  ld_fitness_goal: '健身目标',
  ld_fitness_height: '身高',
  ld_schedule: '日程统筹',
  ld_shopping: '待买清单',
  ld_media: '书影音',
}

// ============ JSON 导出 / 导入 ============

/** 导出所有 ld_ 前缀的 localStorage 数据为 JSON 文件 */
export function exportAllJSON() {
  const data: Record<string, unknown> = {}
  const exportTime = new Date().toISOString()

  // 收集所有已知key
  for (const key of Object.keys(STORAGE_KEYS)) {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw)
      } catch {
        data[key] = raw
      }
    }
  }
  // 也收集其他 ld_ 前缀但未列出的key（以防未来扩展）
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('ld_') && !(key in data)) {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        try {
          data[key] = JSON.parse(raw)
        } catch {
          data[key] = raw
        }
      }
    }
  }

  const payload = {
    _meta: {
      app: 'life-dashboard',
      version: 1,
      exportTime,
      keyCount: Object.keys(data).length,
    },
    data,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `life-dashboard-backup-${exportTime.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 从JSON文件导入数据，覆盖localStorage */
export function importFromJSON(file: File): Promise<{ imported: number; keys: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        const data = parsed.data ?? parsed // 兼容有无 _meta 的情况
        if (typeof data !== 'object' || data === null) {
          throw new Error('文件格式不正确')
        }

        const keys: string[] = []
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith('ld_')) {
            localStorage.setItem(key, JSON.stringify(value))
            keys.push(key)
            // 触发同步事件，让已挂载的组件刷新
            window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }))
          }
        }

        resolve({ imported: keys.length, keys })
      } catch (err) {
        reject(new Error('无法解析JSON文件: ' + (err as Error).message))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// ============ CSV 导出 / 导入 ============

/** 将对象数组转为CSV字符串 */
function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escapeCell = (val: unknown): string => {
    const s = val === null || val === undefined ? '' : String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ]
  return lines.join('\n')
}

/** 解析CSV字符串为对象数组 */
function fromCSV(csv: string): Record<string, string>[] {
  const lines = csv.split('\n').filter((l) => l.trim() !== '')
  if (lines.length < 2) return []

  // 简单CSV解析，支持引号转义
  function parseLine(line: string): string[] {
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = false
          }
        } else {
          current += ch
        }
      } else {
        if (ch === '"') {
          inQuotes = true
        } else if (ch === ',') {
          cells.push(current)
          current = ''
        } else {
          current += ch
        }
      }
    }
    cells.push(current)
    return cells
  }

  const headers = parseLine(lines[0])
  return lines.slice(1).map((line) => {
    const cells = parseLine(line)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = cells[i] ?? ''
    })
    return obj
  })
 }

/** 导出所有模块数据为一个多段CSV文件 */
export function exportAllCSV() {
  const sections: string[] = []
  const exportTime = new Date().toISOString().slice(0, 19)

  for (const [key, label] of Object.entries(STORAGE_KEYS)) {
    const raw = localStorage.getItem(key)
    let rows: Record<string, unknown>[] = []
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          rows = parsed as Record<string, unknown>[]
        } else if (typeof parsed === 'object' && parsed !== null) {
          rows = [parsed as Record<string, unknown>]
        }
      } catch {
        // skip
      }
    }
    const csv = rows.length > 0 ? toCSV(rows) : '(无数据)'
    sections.push(`### ${label} (${key})\n${csv}`)
  }

  const content = `# 生活工作台 CSV 导出\n# 导出时间: ${exportTime}\n\n${sections.join('\n\n---\n\n')}\n`
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `life-dashboard-export-${exportTime.slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 从CSV文件导入数据 */
export function importFromCSV(file: File): Promise<{ imported: number; keys: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        // 去除BOM
        const cleanText = text.replace(/^\ufeff/, '')
        // 按分隔线分割段落
        const sections = cleanText.split(/^---$/m)
        const keys: string[] = []

        for (const section of sections) {
          // 查找 ### 标题行获取key
          const headerMatch = section.match(/^### .+?\((ld_\w+)\)/m)
          if (!headerMatch) continue
          const key = headerMatch[1]

          // 去掉标题行和空行，提取CSV部分
          const csvPart = section
            .split('\n')
            .filter((l) => !l.startsWith('#') && !l.startsWith('### ') && l.trim() !== '---')
            .join('\n')
            .trim()

          if (csvPart === '' || csvPart === '(无数据)') continue

          const rows = fromCSV(csvPart)
          if (rows.length === 0) continue

          // 对于非数组型数据（如ld_fitness_goal, ld_fitness_height），取第一行
          const raw = localStorage.getItem(key)
          let wasArray = true
          if (raw) {
            try {
              const parsed = JSON.parse(raw)
              if (!Array.isArray(parsed)) wasArray = false
            } catch {
              // skip
            }
          }

          // 尝试将字符串值转换为合适的类型
          const convertedRows = rows.map((row) => {
            const obj: Record<string, unknown> = {}
            for (const [k, v] of Object.entries(row)) {
              if (v === '') {
                obj[k] = null
              } else if (v === 'true') {
                obj[k] = true
              } else if (v === 'false') {
                obj[k] = false
              } else if (v !== null && !isNaN(Number(v)) && v.trim() !== '') {
                obj[k] = Number(v)
              } else {
                obj[k] = v
              }
            }
            return obj
          })

          const valueToStore = wasArray ? convertedRows : convertedRows[0]
          localStorage.setItem(key, JSON.stringify(valueToStore))
          keys.push(key)
          window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }))
        }

        resolve({ imported: keys.length, keys })
      } catch (err) {
        reject(new Error('CSV解析失败: ' + (err as Error).message))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// ============ 账单模块专用导出/导入 ============

import type { AccountRecord } from '@/types'

const ACCOUNTS_KEY = 'ld_accounts'

/** 导出账单为JSON */
export function exportAccountsJSON(records: AccountRecord[]) {
  const exportTime = new Date().toISOString()
  const payload = {
    _meta: { app: 'life-dashboard', module: 'accounts', version: 1, exportTime, count: records.length },
    data: records,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `accounts-export-${exportTime.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 从JSON文件导入账单，返回 { imported: number; records: AccountRecord[] } */
export function importAccountsJSON(file: File): Promise<{ imported: number; records: AccountRecord[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        const data = parsed.data ?? parsed
        if (!Array.isArray(data)) {
          throw new Error('文件格式不正确：数据应为数组')
        }
        const records = data
          .map((row: Record<string, unknown>): AccountRecord => ({
            id: String(row.id || `acct_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
            type: row.type === 'income' ? 'income' : 'expense',
            amount: Number(row.amount) || 0,
            category: String(row.category || '其他'),
            note: String(row.note || ''),
            date: String(row.date || new Date().toISOString().slice(0, 10)),
            createdAt: Number(row.createdAt) || Date.now(),
            updatedAt: row.updatedAt ? Number(row.updatedAt) : undefined,
          }))
          .filter((r) => r.amount > 0)
        resolve({ imported: records.length, records })
      } catch (err) {
        reject(new Error('无法解析JSON文件: ' + (err as Error).message))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

/** 导出账单为CSV */
export function exportAccountsCSV(records: AccountRecord[]) {
  const exportTime = new Date().toISOString()
  const rows = records.map((r) => ({
    id: r.id,
    type: r.type,
    amount: r.amount,
    category: r.category,
    note: r.note,
    date: r.date,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt ?? '',
  }))
  const csv = toCSV(rows)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `accounts-export-${exportTime.slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 从CSV文件导入账单 */
export function importAccountsCSV(file: File): Promise<{ imported: number; records: AccountRecord[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = (reader.result as string).replace(/^\ufeff/, '')
        const rows = fromCSV(text)
        if (rows.length === 0) throw new Error('CSV为空或格式不正确')
        const records = rows
          .map((row): AccountRecord => ({
            id: String(row.id || `acct_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
            type: row.type === 'income' ? 'income' : 'expense',
            amount: Number(row.amount) || 0,
            category: String(row.category || '其他'),
            note: String(row.note || ''),
            date: String(row.date || new Date().toISOString().slice(0, 10)),
            createdAt: Number(row.createdAt) || Date.now(),
            updatedAt: row.updatedAt ? Number(row.updatedAt) : undefined,
          }))
          .filter((r) => r.amount > 0)
        resolve({ imported: records.length, records })
      } catch (err) {
        reject(new Error('CSV解析失败: ' + (err as Error).message))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// ============ 清空数据 ============

/** 清空所有 ld_ 前缀的数据 */
export function clearAllData(): string[] {
  const keys: string[] = []
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && key.startsWith('ld_')) {
      localStorage.removeItem(key)
      keys.push(key)
      window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }))
    }
  }
  return keys
}
