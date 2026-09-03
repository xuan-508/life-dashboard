/**
 * 主题色系统
 *
 * 基于一组硬编码色板定义，运行时通过 CSS 自定义属性注入。
 * 默认主题（fuchsia）与 globals.css :root 保持一致，确保 SSR/首屏一致。
 *
 * 持久化 key：ld_theme_color（与 useLocalStorage 模式一致）
 */

export type ThemeKey = 'fuchsia' | 'teal' | 'blue' | 'rose' | 'amber' | 'violet';

export interface ThemePalette {
  /** 主题 key */
  key: ThemeKey;
  /** 展示名 */
  label: string;
  /** 主色（用于按钮、高亮） */
  accent: string;
  /** 浅主色 */
  accentLight: string;
  /** 深主色 */
  accentDark: string;
  /** 主色浅背景 */
  accentBg: string;
  /** 主色次浅背景 */
  accentBg2: string;
  /** 主色上的文字 */
  accentInk: string;
  /** 渐变起点 */
  gradientFrom: string;
  /** 渐变终点 */
  gradientTo: string;
  /** 页面底色 */
  paper: string;
  /** 主文字色 */
  ink: string;
  /** 次要文字色 */
  inkSoft: string;
  /** 微弱文字/占位色 */
  inkFaint: string;
  /** 边框色 */
  inkBorder: string;
  /** 卡片/浮层表面色 */
  surface: string;
  /** 次级表面色 */
  surface2: string;
  /** 阴影色（偏主色） */
  shadowColor: string;
}

const palettes: Record<ThemeKey, ThemePalette> = {
  fuchsia: {
    key: 'fuchsia',
    label: '粉紫',
    accent: '#D946EF',
    accentLight: '#F0ABFC',
    accentDark: '#A21CAF',
    accentBg: '#FAE8FF',
    accentBg2: '#F5D0FE',
    accentInk: '#FFFFFF',
    gradientFrom: '#C084FC',
    gradientTo: '#F472B6',
    paper: '#FDF7FF',
    ink: '#4B1D6B',
    inkSoft: '#7C5A8D',
    inkFaint: '#B9A4C7',
    inkBorder: '#EADCF6',
    surface: '#FFFFFF',
    surface2: '#F9F5FB',
    shadowColor: '#7C3AED',
  },
  teal: {
    key: 'teal',
    label: '青绿',
    accent: '#14B8A6',
    accentLight: '#5EEAD4',
    accentDark: '#0F766E',
    accentBg: '#CCFBF1',
    accentBg2: '#99F6E4',
    accentInk: '#FFFFFF',
    gradientFrom: '#2DD4BF',
    gradientTo: '#0EA5E9',
    paper: '#F0FDFA',
    ink: '#134E4A',
    inkSoft: '#3D8B84',
    inkFaint: '#86BFB8',
    inkBorder: '#CFF1EC',
    surface: '#FFFFFF',
    surface2: '#F5FAF9',
    shadowColor: '#0D9488',
  },
  blue: {
    key: 'blue',
    label: '天蓝',
    accent: '#3B82F6',
    accentLight: '#93C5FD',
    accentDark: '#1D4ED8',
    accentBg: '#DBEAFE',
    accentBg2: '#BFDBFE',
    accentInk: '#FFFFFF',
    gradientFrom: '#60A5FA',
    gradientTo: '#818CF8',
    paper: '#EFF6FF',
    ink: '#1E3A8A',
    inkSoft: '#4B6A9B',
    inkFaint: '#94A3B8',
    inkBorder: '#DBEAFE',
    surface: '#FFFFFF',
    surface2: '#F5F9FF',
    shadowColor: '#2563EB',
  },
  rose: {
    key: 'rose',
    label: '玫瑰',
    accent: '#F43F5E',
    accentLight: '#FDA4AF',
    accentDark: '#BE123C',
    accentBg: '#FFE4E6',
    accentBg2: '#FECDD3',
    accentInk: '#FFFFFF',
    gradientFrom: '#FB7185',
    gradientTo: '#F472B6',
    paper: '#FFF1F2',
    ink: '#881337',
    inkSoft: '#B54768',
    inkFaint: '#D48BA0',
    inkBorder: '#FCE7EB',
    surface: '#FFFFFF',
    surface2: '#FFF5F6',
    shadowColor: '#E11D48',
  },
  amber: {
    key: 'amber',
    label: '琥珀',
    accent: '#F59E0B',
    accentLight: '#FCD34D',
    accentDark: '#B45309',
    accentBg: '#FEF3C7',
    accentBg2: '#FDE68A',
    accentInk: '#451A03',
    gradientFrom: '#FBBF24',
    gradientTo: '#F97316',
    paper: '#FFFBEB',
    ink: '#451A03',
    inkSoft: '#8C5E24',
    inkFaint: '#C19A60',
    inkBorder: '#FDE68A',
    surface: '#FFFFFF',
    surface2: '#FFFCF5',
    shadowColor: '#D97706',
  },
  violet: {
    key: 'violet',
    label: '罗兰',
    accent: '#8B5CF6',
    accentLight: '#C4B5FD',
    accentDark: '#6D28D9',
    accentBg: '#EDE9FE',
    accentBg2: '#DDD6FE',
    accentInk: '#FFFFFF',
    gradientFrom: '#A78BFA',
    gradientTo: '#818CF8',
    paper: '#F5F3FF',
    ink: '#3B0764',
    inkSoft: '#6B4C8C',
    inkFaint: '#A89BBF',
    inkBorder: '#E9E5FE',
    surface: '#FFFFFF',
    surface2: '#FAFAFF',
    shadowColor: '#7C3AED',
  },
};

export const themeList = Object.values(palettes);

export function getTheme(key: ThemeKey): ThemePalette {
  return palettes[key] ?? palettes.fuchsia;
}

export function isThemeKey(value: string): value is ThemeKey {
  return value in palettes;
}

/** 将 #RRGGBB 转为 'R G B' 字符串，用于 CSS var(--xxx) */
function hexToRgbSpace(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** 将色板应用到目标元素（默认 document.documentElement） */
export function applyThemePalette(key: ThemeKey, target: HTMLElement = document.documentElement) {
  const p = getTheme(key);
  target.style.setProperty('--accent', hexToRgbSpace(p.accent));
  target.style.setProperty('--accent-light', hexToRgbSpace(p.accentLight));
  target.style.setProperty('--accent-dark', hexToRgbSpace(p.accentDark));
  target.style.setProperty('--accent-bg', hexToRgbSpace(p.accentBg));
  target.style.setProperty('--accent-bg2', hexToRgbSpace(p.accentBg2));
  target.style.setProperty('--accent-ink', hexToRgbSpace(p.accentInk));
  target.style.setProperty('--accent-gradient-from', hexToRgbSpace(p.gradientFrom));
  target.style.setProperty('--accent-gradient-to', hexToRgbSpace(p.gradientTo));
  target.style.setProperty('--paper', hexToRgbSpace(p.paper));
  target.style.setProperty('--ink', hexToRgbSpace(p.ink));
  target.style.setProperty('--ink-soft', hexToRgbSpace(p.inkSoft));
  target.style.setProperty('--ink-faint', hexToRgbSpace(p.inkFaint));
  target.style.setProperty('--ink-border', hexToRgbSpace(p.inkBorder));
  target.style.setProperty('--surface', hexToRgbSpace(p.surface));
  target.style.setProperty('--surface-2', hexToRgbSpace(p.surface2));
  target.style.setProperty('--shadow-color', hexToRgbSpace(p.shadowColor));
}

/** 同步更新 theme-color meta，参数为主题主色 hex */
export function updateThemeColorMeta(color: string) {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}
