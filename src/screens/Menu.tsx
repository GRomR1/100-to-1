import { useGame } from '../store'
import type { Mode } from '../engine/types'

const LABELS: Record<Mode, string> = {
  simple: 'ПРОСТАЯ ИГРА',
  double: 'ДВОЙНАЯ ИГРА',
  triple: 'ТРОЙНАЯ ИГРА',
  'vice-versa': 'ИГРА НАОБОРОТ',
  big: 'БОЛЬШАЯ ИГРА',
}

export function Menu({ asOverlay = false }: { asOverlay?: boolean }) {
  const { teams, scores, rounds, roundIndex, phase, bigGameQueued } = useGame()
  return (
    <div className="absolute inset-0">
      <img src="/img/logo.png" alt="" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[#1e2647a6]" />
      <div className="absolute inset-0">
        {/* Команды */}
        <div className="absolute left-[68px] top-[30px] h-[52px] w-[254px] rounded-[10px] border border-gold bg-brick text-center text-[26px] leading-[50px] text-white">
          {teams[0]}
        </div>
        <div className="absolute left-[958px] top-[30px] h-[52px] w-[254px] rounded-[10px] border border-gold bg-teal-dark text-center text-[26px] leading-[50px] text-white">
          {teams[1]}
        </div>
        {/* Счёт-N: фиксированная ширина, чтобы 99→100 не дёргалось */}
        <div className="absolute left-[135px] top-[97px] flex h-[63px] w-[120px] items-center justify-center rounded-[10px] bg-white text-[36px] font-bold text-ink tabular-nums">
          {scores[0]}
        </div>
        <div className="absolute left-[1022px] top-[97px] flex h-[63px] w-[120px] items-center justify-center rounded-[10px] bg-white text-[36px] font-bold text-ink tabular-nums">
          {scores[1]}
        </div>
        {/* Порядок раундов из questions.yaml; текущий подсвечен, когда меню открыто поверх игры */}
        {rounds.map((r, i) => (
          <div
            key={i}
            className={`absolute left-[36px] w-[222px] rounded-[14px] border text-center text-[22px] leading-[70px] tracking-wide ${
              i === roundIndex && phase !== 'Menu'
                ? 'border-gold bg-slate text-white'
                : 'border-slate bg-slate/60 text-white/50'
            }`}
            style={{ top: 200 + i * 96, height: 72 }}
          >
            {LABELS[r.mode]}
          </div>
        ))}
        {!asOverlay && (
          <div className="absolute bottom-[16px] left-0 w-full text-center text-[16px] text-white/40">
            {phase === 'Closed'
              ? 'Игра окончена · R — начать заново'
              : phase === 'Final'
                ? 'Enter — финал выпуска (звук) · R — начать заново · F — полный экран'
                : bigGameQueued
                  ? 'Enter — большая игра · F — полный экран'
                  : 'Enter — начать · R — сброс очков · F — полный экран'}
          </div>
        )}
      </div>
    </div>
  )
}
