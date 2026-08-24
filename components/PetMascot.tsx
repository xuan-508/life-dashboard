'use client'

import { useEffect, useRef, useState } from 'react'

const BUBBLES = [
  '今天也要开心呀～',
  '记得喝水哦 💧',
  '目标进度如何？',
  '辛苦啦，休息一下',
  '喵～',
  '你的小助手上线',
  '别忘了记账 ✨',
  '加油，你很棒！',
  '按颜色分类会更快',
  '小口呼吸，放轻松',
]

export default function PetMascot() {
  const [bubble, setBubble] = useState<string | null>(null)
  const [jumping, setJumping] = useState(false)
  const leftPupilRef = useRef<SVGGElement>(null)
  const rightPupilRef = useRef<SVGGElement>(null)
  const wrapRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const maxOffset = 3.5

    function handleMove(e: MouseEvent) {
      if (!wrapRef.current || !leftPupilRef.current || !rightPupilRef.current) return
      const rect = wrapRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const dist = Math.min(maxOffset, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 40)
      const x = Math.cos(angle) * dist
      const y = Math.sin(angle) * dist
      leftPupilRef.current.style.transform = `translate(${x}px, ${y}px)`
      rightPupilRef.current.style.transform = `translate(${x}px, ${y}px)`
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  useEffect(() => {
    if (!bubble) return
    const t = setTimeout(() => setBubble(null), 3000)
    return () => clearTimeout(t)
  }, [bubble])

  function handleClick() {
    if (jumping) return
    setBubble(BUBBLES[Math.floor(Math.random() * BUBBLES.length)])
    setJumping(true)
    setTimeout(() => setJumping(false), 500)
  }

  return (
    <button
      ref={wrapRef}
      onClick={handleClick}
      className={`fixed bottom-6 right-6 z-50 h-24 w-24 cursor-pointer select-none rounded-full bg-white/30 p-2 shadow-lg backdrop-blur-sm transition-transform duration-200 hover:scale-105 focus:outline-none sm:bottom-8 sm:right-8 ${
        jumping ? 'animate-pet-jump' : ''
      }`}
      aria-label='互动宠物'
      title='点我互动'
    >
      {/* 对话气泡 */}
      {bubble && (
        <div className='absolute -top-12 left-1/2 z-10 w-max max-w-[10rem] -translate-x-1/2 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-medium text-purple-600 shadow-md backdrop-blur-sm animate-bubble-pop'>
          {bubble}
          <span className='absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white/90' />
        </div>
      )}

      <svg
        viewBox='0 0 100 100'
        className='h-full w-full animate-pet-breathe'
        aria-hidden='true'
      >
        {/* 尾巴 */}
        <path
          d='M70 68 Q88 55 85 38 Q82 25 72 32 Q66 38 68 52 Q70 62 66 70'
          fill='#FFD1A9'
          stroke='#FF9E6D'
          strokeWidth='2.5'
          strokeLinecap='round'
          className='origin-bottom-left animate-pet-tail'
        />

        {/* 身体 */}
        <ellipse cx='50' cy='72' rx='26' ry='20' fill='#FFF4E6' stroke='#FF9E6D' strokeWidth='2.5' />

        {/* 左耳 */}
        <path d='M28 28 L22 8 L42 18 Z' fill='#FFF4E6' stroke='#FF9E6D' strokeWidth='2.5' strokeLinejoin='round' />
        <path d='M28 26 L24 12 L38 19 Z' fill='#FFB7D5' />

        {/* 右耳 */}
        <path d='M72 28 L78 8 L58 18 Z' fill='#FFF4E6' stroke='#FF9E6D' strokeWidth='2.5' strokeLinejoin='round' />
        <path d='M72 26 L76 12 L62 19 Z' fill='#FFB7D5' />

        {/* 头 */}
        <circle cx='50' cy='42' r='28' fill='#FFF4E6' stroke='#FF9E6D' strokeWidth='2.5' />

        {/* 刘海花纹 */}
        <path
          d='M36 20 Q44 30 50 22 Q56 30 64 20'
          fill='none'
          stroke='#FFB7D5'
          strokeWidth='3'
          strokeLinecap='round'
        />

        {/* 左眼 */}
        <g>
          <ellipse cx='38' cy='40' rx='7' ry='8' fill='#FFFFFF' stroke='#FF9E6D' strokeWidth='1.5' />
          <g ref={leftPupilRef} className='transition-transform duration-75 ease-out'>
            <circle cx='38' cy='40' r='4' fill='#7C3AED' />
            <circle cx='39.5' cy='38.5' r='1.3' fill='#FFFFFF' />
          </g>
          {/* 眨眼遮罩 */}
          <rect
            x='29'
            y='30'
            width='18'
            height='20'
            fill='#FFF4E6'
            className='origin-center animate-pet-blink'
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        </g>

        {/* 右眼 */}
        <g>
          <ellipse cx='62' cy='40' rx='7' ry='8' fill='#FFFFFF' stroke='#FF9E6D' strokeWidth='1.5' />
          <g ref={rightPupilRef} className='transition-transform duration-75 ease-out'>
            <circle cx='62' cy='40' r='4' fill='#7C3AED' />
            <circle cx='63.5' cy='38.5' r='1.3' fill='#FFFFFF' />
          </g>
          {/* 眨眼遮罩 */}
          <rect
            x='53'
            y='30'
            width='18'
            height='20'
            fill='#FFF4E6'
            className='origin-center animate-pet-blink'
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        </g>

        {/* 腮红 */}
        <ellipse cx='30' cy='52' rx='4' ry='2.5' fill='#FFB7D5' opacity='0.7' />
        <ellipse cx='70' cy='52' rx='4' ry='2.5' fill='#FFB7D5' opacity='0.7' />

        {/* 鼻子 */}
        <path d='M47 50 L53 50 L50 54 Z' fill='#FF9E6D' />

        {/* 嘴巴 */}
        <path
          d='M50 54 Q45 59 41 56 M50 54 Q55 59 59 56'
          fill='none'
          stroke='#FF9E6D'
          strokeWidth='1.8'
          strokeLinecap='round'
        />

        {/* 爪子 */}
        <ellipse cx='36' cy='86' rx='5' ry='3.5' fill='#FFFFFF' stroke='#FF9E6D' strokeWidth='1.8' />
        <ellipse cx='64' cy='86' rx='5' ry='3.5' fill='#FFFFFF' stroke='#FF9E6D' strokeWidth='1.8' />
      </svg>
    </button>
  )
}
