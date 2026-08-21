/* eslint-disable @next/next/no-img-element */
/**
 * 外观与图片管理弹窗（临时功能）
 *
 * 提供三处图片的可视化更换入口：
 *  - 开屏动画图（ld_splash_image）：SplashScreen 组件消费
 *  - 应用图标（ld_icon_image）：page.tsx 的 favicon 与标题旁图标消费，
 *    仅前端展示层生效，不影响 manifest 定义的安装态 PWA 图标
 *  - 背景图（ld_bg_image）：page.tsx 根容器背景消费
 *
 * 上传的图片经 canvas 压缩（长边 ≤ 1024px、JPEG 质量 0.85）后以
 * base64 形式存入 localStorage，并通过 useLocalStorage 的跨组件
 * 同步机制（local-storage-sync 事件）在其他消费端实时生效。
 *
 * 临时性说明：后续如需移除本功能，删除本组件、page.tsx 中的引用
 * 以及 globals.css 中的 appearance-pop-in 动画即可，不影响任何业务逻辑。
 */

'use client';

import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useLocalStorage } from '@/lib/storage';

/** 压缩后图片的最长边（px），防止 localStorage（约 5MB）溢出 */
const MAX_EDGE = 1024;
/** JPEG 压缩质量 */
const JPEG_QUALITY = 0.85;

/** 将图片文件压缩为 base64 JPEG（长边 ≤ MAX_EDGE） */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if (width > MAX_EDGE || height > MAX_EDGE) {
          if (width >= height) {
            height = Math.round((height * MAX_EDGE) / width);
            width = MAX_EDGE;
          } else {
            width = Math.round((width * MAX_EDGE) / height);
            height = MAX_EDGE;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建画布'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = () => reject(new Error('图片解析失败'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

interface SlotConfig {
  /** 槽位名称 */
  label: string;
  /** 槽位说明 */
  hint: string;
  /** 当前图片（base64 data URL，空串表示使用默认） */
  value: string;
  /** 图标槽位使用方形预览，其余使用横向预览 */
  square: boolean;
  /** 隐藏 file input 的 ref */
  inputRef: RefObject<HTMLInputElement>;
  /** 上传处理（压缩后写入 localStorage） */
  onUpload: (file?: File) => Promise<void>;
  /** 恢复默认（写回空串） */
  onReset: () => void;
}

interface AppearanceManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function AppearanceManager({ open, onClose }: AppearanceManagerProps) {
  const [splashImage, setSplashImage] = useLocalStorage<string>('ld_splash_image', '');
  const [iconImage, setIconImage] = useLocalStorage<string>('ld_icon_image', '');
  const [bgImage, setBgImage] = useLocalStorage<string>('ld_bg_image', '');
  const [error, setError] = useState('');

  const splashInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleFile(file: File | undefined, setter: (val: string) => void) {
    if (!file) return;
    setError('');
    try {
      const dataUrl = await compressImage(file);
      setter(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片处理失败，请换一张试试');
    }
  }

  function resetValue(setter: (val: string) => void) {
    setError('');
    setter('');
  }

  const slots: SlotConfig[] = [
    {
      label: '开屏动画图',
      hint: '应用启动时展示约 2 秒，未设置时显示默认文字标识',
      value: splashImage,
      square: false,
      inputRef: splashInputRef,
      onUpload: (file) => handleFile(file, setSplashImage),
      onReset: () => resetValue(setSplashImage),
    },
    {
      label: '应用图标',
      hint: '更换浏览器标签图标与标题旁小图标，不影响已安装的应用图标',
      value: iconImage,
      square: true,
      inputRef: iconInputRef,
      onUpload: (file) => handleFile(file, setIconImage),
      onReset: () => resetValue(setIconImage),
    },
    {
      label: '背景图',
      hint: '页面整体背景，未设置时使用纸墨底色',
      value: bgImage,
      square: false,
      inputRef: bgInputRef,
      onUpload: (file) => handleFile(file, setBgImage),
      onReset: () => resetValue(setBgImage),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="外观与图片管理"
    >
      <div
        className="animate-appearance-in w-full max-w-md rounded-card border border-ink-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold">外观与图片管理</h3>
            <p className="mt-0.5 text-xs text-ink-faint">上传后立即生效，仅保存在本机浏览器</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm-clean text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="关闭"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {slots.map((slot) => (
            <div key={slot.label} className="rounded-sm-clean border border-ink-border bg-paper p-3">
              <div className="flex items-center gap-3">
                <div
                  className={`shrink-0 overflow-hidden border border-ink-border bg-surface-2 ${
                    slot.square ? 'h-14 w-14 rounded-sm-clean' : 'h-14 w-24 rounded-sm-clean'
                  }`}
                >
                  {slot.value ? (
                    <img src={slot.value} alt={slot.label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-faint">
                      {slot.square ? '·' : '默认'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{slot.label}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{slot.hint}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-accent px-3 py-1.5 text-xs"
                      onClick={() => slot.inputRef.current?.click()}
                    >
                      上传图片
                    </button>
                    {slot.value ? (
                      <button
                        type="button"
                        className="btn btn-ghost px-3 py-1.5 text-xs"
                        onClick={slot.onReset}
                      >
                        恢复默认
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <input
                ref={slot.inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void slot.onUpload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          ))}
        </div>

        {error ? (
          <p className="mt-3 rounded-sm-clean bg-accent-bg px-3 py-2 text-xs text-accent-dark">{error}</p>
        ) : null}

        <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
          临时功能：图片压缩后存入本机，不参与云同步；后续移除本功能时删除此组件即可。
        </p>
      </div>
    </div>
  );
}
