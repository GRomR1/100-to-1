import { useGame } from '../store'
import type { Mode } from '../engine/types'

const TITLES: Record<Mode, string> = {
  simple: 'ПРОСТАЯ ИГРА',
  double: 'ДВОЙНАЯ ИГРА',
  triple: 'ТРОЙНАЯ ИГРА',
  'vice-versa': 'ИГРА НАОБОРОТ',
  big: 'БОЛЬШАЯ ИГРА',
}

const DESCRIPTIONS: Record<Mode, string> = {
  simple:
    'В розыгрыше — капитаны: кто первый нажал кнопку, тот и отвечает. Верный ответ открывает строку, очки идут в фонд команды. Отвечают по кругу; три промаха — один ответ соперников, который забирает весь банк раунда. Множитель ×1.',
  double:
    'В розыгрыше — вторые номера команд. Дальше команда отвечает по кругу, верные ответы открывают строки и пополняют фонд. Три промаха — один ответ соперников на весь банк раунда. Очки умножаются на ×2.',
  triple:
    'В розыгрыше — третьи номера команд. Команда отвечает по кругу, очки копятся в фонд. Три промаха — один ответ соперников на весь банк раунда. Очки умножаются на ×3.',
  'vice-versa':
    '20 секунд на обсуждение, затем капитаны называют по одному несовпадающему ответу. Начинает команда с меньшим счётом. Строки открывает ведущий; очки записываются только после попадания — клавишей A или B. Открытые без попадания строки остаются неразыгранными.',
  big: 'К игре допускаются победители по сумме четырёх раундов: два игрока команды-победителя. Первый игрок отвечает на 5 вопросов за 15 секунд. Второй — на те же вопросы за 20 секунд. Совпавший ответ не засчитывается: по сигналу ведущего (X) игрок предлагает другой вариант. Очки ведущий считает вручную.',
}

export function Intro() {
  const { mode } = useGame()
  const vice = mode === 'vice-versa'
  const isBig = mode === 'big'
  return (
    <div className="absolute inset-0">
      <img src="/img/waves.png" alt="" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[#1e2647a6]" />
      <div className="absolute left-[60px] top-[50px] h-[50px] w-[185px] rounded-[10px] border border-gold bg-slate text-center text-[20px] leading-[48px] text-white">
        ← В МЕНЮ
      </div>
      <div className="absolute left-0 top-[90px] w-full text-center text-[64px] tracking-wide text-gold">
        {TITLES[mode]}
      </div>
      {/* Вопрос ведущий читает вслух — на экран он не выводится. */}
      <div
        className={`absolute top-[190px] text-center text-[#DCE5F0] ${
          isBig ? 'left-[150px] w-[980px] text-[22px] leading-[28px]' : 'left-[260px] w-[760px] text-[24px] leading-[30px]'
        }`}
      >
        {DESCRIPTIONS[mode]}
      </div>
      <div className="absolute left-[497px] top-[430px] h-[75px] w-[285px] rounded-[14px] bg-gold text-center text-[30px] leading-[75px] text-ink">
        {isBig ? 'К ТАЙМЕРУ' : 'НАЧАТЬ ИГРУ'}
      </div>
      <div className="absolute left-0 top-[540px] w-full text-center text-[22px] text-white/80">
        {vice
          ? 'Enter — 20 секунд на обсуждение'
          : isBig
            ? 'Enter — первый игрок, 15 секунд · X — совпавший ответ'
            : 'Enter — на табло, там розыгрыш хода: A/B'}
      </div>
    </div>
  )
}
