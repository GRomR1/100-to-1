import { useGame } from '../store'
import { GAME_LABEL } from '../engine/rules'
import type { Phase, Row } from '../engine/types'
import { Menu } from './Menu'

const PHASE_HINTS: Partial<Record<Phase, string>> = {
  TeamPlay: '1–6 — открыть строку · X — промах · T — меню',
  Chance: 'Один ответ соперников: 1–6 — верно (банк раунда переходит) · X — промах',
  VicePlay: '1–6 — открыть строку без очков · A/B — засчитать, по одному ответу на команду · X — промах',
  ScoreUpdate: 'Enter — следующий раунд · M — в меню',
}

const END_HINT = ' · Enter — итог раунда'

// Пока ход не разыгран, строки не открываются: на поле только выбор команды и звук промаха.
const FACEOFF_HINT = (teams: [string, string]) =>
  `A — отвечает «${teams[0]}» · B — отвечает «${teams[1]}» · X — промах`

function Cross({ used }: { used: boolean }) {
  return (
    <svg viewBox="0 0 66 66" className="h-full w-full">
      <path
        d="M20 20 L46 46 M46 20 L20 46"
        stroke={used ? '#B33025' : '#F2C230'}
        strokeOpacity={used ? 1 : 0.35}
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Card({ row, index, credited }: { row: Row; index: number; credited: boolean }) {
  const top = 120 + index * 80
  if (row.isOpen)
    return (
      <div
        className="absolute left-[230px] flex h-[65px] w-[820px] items-center justify-between rounded-[14px] border border-slate/40 bg-ink px-6"
        style={{ top }}
      >
        <span className="text-[28px] text-white">{row.text}</span>
        {/* в «Игре наоборот» очки ещё не разыграны — цифра ждёт нажатия A/B */}
        <span className={`text-[28px] tabular-nums ${credited ? 'text-white' : 'text-gold/70'}`}>
          {row.points}
        </span>
      </div>
    )
  return (
    <div
      className="absolute left-[230px] flex h-[65px] w-[820px] items-center justify-center rounded-[14px] bg-gold"
      style={{ top }}
    >
      <span className="text-[30px] text-ink">{index + 1}</span>
    </div>
  )
}

// Бейдж-иконка команды: активная команда яркая, ждущая хода — приглушена.
// Цифра — номер игры (1/2/3), «Игра наоборот» — знак «?».
function Badge({ side, active, label }: { side: 'left' | 'right'; active: boolean; label: string }) {
  const pos = side === 'left' ? 'left-[57px] border-gold bg-brick' : 'left-[1088px] border-gold bg-teal-dark'
  return (
    <div
      className={`absolute top-[45px] flex h-[90px] w-[135px] items-center justify-center rounded-[14px] border transition-opacity duration-300 ${pos} ${
        active ? 'opacity-100' : 'opacity-40'
      }`}
    >
      <span className="flex items-baseline gap-2">
        {label !== '?' && <span className="text-[20px] text-white">x</span>}
        <span className="text-[48px] leading-none text-gold">{label}</span>
      </span>
    </div>
  )
}

export function Field() {
  const { rows, misses, phase, mode, currentTeam, menuShown, uncredited, teams } = useGame()
  const label = GAME_LABEL[mode]
  const faceoff = phase === 'TeamPlay' && currentTeam === null
  // Enter закрывает раунд только когда табло открыто полностью или разыгран последний шанс.
  const canEnd = phase === 'Chance' || (phase !== 'ScoreUpdate' && rows.every((r) => r.isOpen))
  return (
    <div className="absolute inset-0">
      <img src="/img/waves.png" alt="" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[#1e2647a6]" />
      <Badge side="left" active={currentTeam === 0} label={label} />
      <Badge side="right" active={currentTeam === 1} label={label} />
      {rows.map((r, i) => (
        <Card key={i} row={r} index={i} credited={mode !== 'vice-versa' || !uncredited.includes(i)} />
      ))}
      {/* Кресты промахов: левый столбец — команда 1, правый — команда 2.
          В «Игре наоборот» промахов нет — счётчики скрыты. */}
      {mode !== 'vice-versa' &&
        [0, 1, 2].map((i) => {
          const top = 190 + i * 162
          return [
            <div
              key={`l${i}`}
              className={`absolute left-[68px] h-[66px] w-[66px] rounded-[14px] ${misses[0] > i ? 'bg-gold' : 'bg-ink'}`}
              style={{ top }}
            >
              <Cross used={misses[0] > i} />
            </div>,
            <div
              key={`r${i}`}
              className={`absolute left-[1146px] h-[66px] w-[66px] rounded-[14px] ${misses[1] > i ? 'bg-gold' : 'bg-ink'}`}
              style={{ top }}
            >
              <Cross used={misses[1] > i} />
            </div>,
          ]
        })}
      <div className="absolute left-[548px] top-[645px] h-[50px] w-[185px] rounded-[10px] bg-gold text-center text-[24px] leading-[50px] text-ink">
        ТАБЛО
      </div>
      <div className="absolute left-0 top-[72px] w-full text-center text-[16px] text-white/50">
        {faceoff ? FACEOFF_HINT(teams) : PHASE_HINTS[phase]}
        {phase !== 'ScoreUpdate' && canEnd ? END_HINT : ''}
      </div>
      {menuShown && (
        <div className="absolute inset-0 z-10">
          <Menu asOverlay />
          <div className="absolute bottom-[16px] left-0 w-full text-center text-[18px] text-white/70">
            T — вернуться к игре
          </div>
        </div>
      )}
    </div>
  )
}
