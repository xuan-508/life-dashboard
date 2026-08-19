// 前端云存储工具库
// 通过 fetch('/api/save') 和 fetch('/api/load') 调用 Cloudflare Pages Functions
// NEXT_PUBLIC_ 前缀变量在构建时内联到 JS bundle，与硬编码安全性等价
// 直接使用常量避免环境变量配置问题（Cloudflare Pages token 权限不足无法设置）

const API_SECRET = 'lixuan50811+';

// 9 个模块的 localStorage key 列表
export const CLOUD_KEYS = [
  'ld_accounts',
  'ld_habits',
  'ld_habit_logs',
  'ld_fitness',
  'ld_fitness_goal',
  'ld_fitness_height',
  'ld_schedule',
  'ld_shopping',
  'ld_media',
] as const;

type CloudKey = (typeof CLOUD_KEYS)[number];

/**
 * 将单个模块的数据保存到 KV
 * @param module localStorage key，如 'ld_accounts'
 * @param data 要保存的数据（任意可序列化对象）
 * @returns { ok: boolean }
 */
export async function saveToCloud(module: string, data: unknown): Promise<{ ok: boolean; error?: string }> {
  if (!API_SECRET) {
    console.warn('[cloudStorage] NEXT_PUBLIC_API_SECRET 未设置，跳过云同步');
    return { ok: false, error: 'NO_SECRET' };
  }

  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, data, secret: API_SECRET }),
    });
    const json = await res.json();
    if (!json.ok) {
      console.error(`[cloudStorage] 保存 ${module} 失败:`, json.error);
      return { ok: false, error: json.error };
    }
    return { ok: true };
  } catch (err) {
    console.error(`[cloudStorage] 保存 ${module} 网络错误:`, err);
    return { ok: false, error: String(err) };
  }
}

/**
 * 从 KV 加载单个模块的数据
 * @param module localStorage key，如 'ld_accounts'
 * @returns data 或 null
 */
export async function loadFromCloud<T = unknown>(module: string): Promise<T | null> {
  if (!API_SECRET) {
    console.warn('[cloudStorage] NEXT_PUBLIC_API_SECRET 未设置，跳过云同步');
    return null;
  }

  try {
    const res = await fetch('/api/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, secret: API_SECRET }),
    });
    const json = await res.json();
    if (!json.ok) {
      console.error(`[cloudStorage] 加载 ${module} 失败:`, json.error);
      return null;
    }
    return (json.data as T) ?? null;
  } catch (err) {
    console.error(`[cloudStorage] 加载 ${module} 网络错误:`, err);
    return null;
  }
}

/**
 * 从云端加载所有模块数据，并写入 localStorage
 * @returns 成功加载的模块数量
 */
export async function loadAllFromCloud(): Promise<number> {
  let count = 0;
  for (const key of CLOUD_KEYS) {
    const data = await loadFromCloud(key);
    if (data !== null) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        count++;
      } catch {
        // localStorage 写入失败（可能空间不足）
        console.warn(`[cloudStorage] localStorage 写入 ${key} 失败`);
      }
    }
  }
  if (count > 0) {
    // Dispatch per-key events so useLocalStorage hooks refresh their state
    // Include source: 'cloud-load' to prevent auto-save loops
    for (const key of CLOUD_KEYS) {
      window.dispatchEvent(
        new CustomEvent('local-storage-sync', { detail: { key, source: 'cloud-load' } })
      );
    }
  }
  return count;
}

/**
 * 将所有 localStorage 数据保存到云端
 * @returns 成功保存的模块数量
 */
export async function saveAllToCloud(): Promise<number> {
  let count = 0;
  for (const key of CLOUD_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        const result = await saveToCloud(key, data);
        if (result.ok) count++;
      } catch {
        console.warn(`[cloudStorage] localStorage 读取 ${key} 解析失败`);
      }
    }
  }
  return count;
}

/**
 * 防抖保存：在数据变更后延迟保存，避免频繁请求
 */
let saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function debouncedSaveToCloud(module: string, data: unknown, delay = 2000): void {
  if (saveTimers[module]) {
    clearTimeout(saveTimers[module]);
  }
  saveTimers[module] = setTimeout(() => {
    saveToCloud(module, data);
    delete saveTimers[module];
  }, delay);
}

/**
 * 检查云同步是否可用（API_SECRET 是否已配置）
 */
export function isCloudSyncEnabled(): boolean {
  return !!API_SECRET;
}

export type { CloudKey };
