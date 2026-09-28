import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { BIG_QUESTIONS, BIG_SECONDS } from '../engine/rules'
import type { BigState } from '../engine/types'

function caption(big: BigState): { label: string; hint: string } {
  const p1 = `Игрок 1 · ${BIG_QUESTIONS} вопроса за ${BIG_SECONDS[0]} секунд`
  const p2 = `Игрок 2 · те же вопросы за ${BIG_SECONDS[1]} секунд`
  if (big.player === 0) return { label: p1, hint: 'Enter — запустить таймер · X — совпавший ответ' }
  if (big.player === 1)
    return big.running
      ? { label: p1, hint: 'Enter — остановить таймер · X — совпавший ответ' }
      : {
          label: 'Игрок 1 завершил · те же вопросы у второго игрока',
          hint: 'Enter — таймер игрока 2 · X — совпавший ответ',
        }
  return big.running
    ? { label: p2, hint: 'Enter — остановить таймер · X — совпавший ответ' }
    : {
        label: 'Игрок 2 завершил · очки ведущий считает вручную',
        hint: 'Enter — завершить большую игру',
      }
}

export function BigGame() {
  const big = useGame((s) => s.big)
  const [now, setNow] = useState(() => Date.now())

  // Отсчёт живёт на кадрах, а движок хранит только абсолютный момент окончания.
  useEffect(() => {
    if (!big.running || big.endsAt === null) return
    setNow(Date.now())
    let raf = 0
    const loop = () => {
      setNow(Date.now())
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [big.running, big.endsAt])

  useEffect(() => {
    if (!big.running || big.endsAt === null) return
    const id = setTimeout(
      () => useGame.getState().dispatch({ type: 'BIG_TIMEUP' }),
      Math.max(0, big.endsAt - Date.now()),
    )
    return () => clearTimeout(id)
  }, [big.running, big.endsAt])

  const seconds = BIG_SECONDS[big.player === 2 ? 1 : 0]
  const left = big.running
    ? Math.max(0, (big.endsAt ?? 0) - now)
    : big.player === 0
      ? seconds * 1000
      : 0
  const shown = Math.ceil(left / 1000)
  const { label, hint } = caption(big)
  const danger = big.running && shown <= 5

  return (
    <div className="absolute inset-0">
      <img src="/img/waves.png" alt="" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[#1e2647a6]" />
      <div className="absolute left-0 top-[46px] w-full text-center text-[44px] tracking-wide text-gold">
        БОЛЬШАЯ ИГРА
      </div>
      <div className="absolute left-0 top-[132px] w-full text-center text-[30px] text-white">
        {label}
      </div>
      <div
        className={`absolute left-0 top-[180px] w-full text-center text-[210px] leading-[210px] tabular-nums ${
          danger ? 'text-x-red' : 'text-gold'
        } ${big.running ? '' : 'opacity-60'}`}
      >
        {shown}
      </div>
      <div className="absolute left-[230px] top-[430px] h-[16px] w-[820px] overflow-hidden rounded-[8px] bg-ink">
        <div
          className={`h-full rounded-[8px] ${danger ? 'bg-x-red' : 'bg-gold'}`}
          style={{ width: `${(left / (seconds * 1000)) * 100}%` }}
        />
      </div>
      {/* Кто сейчас отсчитывает: текущий игрок залит золотом, сыгравший — контуром */}
      <div className="absolute left-0 top-[466px] flex w-full justify-center gap-4">
        {[1, 2].map((n) => {
          const state = big.player === n ? 'now' : big.player > n ? 'done' : 'next'
          return (
            <span
              key={n}
              className={`rounded-[10px] border px-5 py-1 text-[20px] leading-[28px] ${
                state === 'now'
                  ? 'border-gold bg-gold text-ink'
                  : state === 'done'
                    ? 'border-gold/60 text-gold/70'
                    : 'border-white/25 text-white/45'
              }`}
            >
              Игрок {n}
            </span>
          )
        })}
      </div>
      <div className="absolute left-0 top-[640px] w-full text-center text-[22px] text-white/80">
        {hint}
      </div>
    </div>
  )
}
