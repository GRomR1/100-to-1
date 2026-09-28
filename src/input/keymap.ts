import type { GameEvent, Mode, Phase } from '../engine/types'
import { useGame } from '../store'

const FIELD_PHASES: Phase[] = ['Intro', 'TeamPlay', 'Chance', 'VicePlay', 'ScoreUpdate']

function eventFor(phase: Phase, mode: Mode, key: string, now: number): GameEvent | null {
  const rowKey = /^[1-6]$/.test(key) ? Number(key) - 1 : null
  if (key === 't' && FIELD_PHASES.includes(phase)) return { type: 'TOGGLE_MENU' }
  switch (phase) {
    case 'Menu':
      if (key === 'Enter') return { type: 'START_ROUND' }
      if (key === 'r') return { type: 'RESET' }
      return null
    case 'Intro':
      if (mode === 'big') {
        if (key === 'Enter') return { type: 'BIG_START' }
      } else if (mode === 'vice-versa') {
        if (key === 'Enter') return { type: 'START_DISCUSSION' }
      } else if (key === 'Enter') {
        return { type: 'TO_BOARD' }
      }
      if (key === 'Escape' || key === 'm') return { type: 'TO_MENU' }
      return null
    case 'TeamPlay':
      // Розыгрыш хода на табло: A/B дают право отвечать первой, без звука.
      if (key === 'a') return { type: 'CLAIM', team: 0 }
      if (key === 'b') return { type: 'CLAIM', team: 1 }
      if (key === 'x') return { type: 'MISS' }
      if (key === 'Enter') return { type: 'END_ROUND' }
      if (rowKey !== null) return { type: 'OPEN_ROW', index: rowKey }
      return null
    case 'Chance':
      if (key === 'x') return { type: 'MISS' }
      if (key === 'Enter') return { type: 'END_ROUND' }
      if (rowKey !== null) return { type: 'OPEN_ROW', index: rowKey }
      return null
    case 'VicePlay':
      // Строки открываются без очков; попадание фиксируется отдельной клавишей A/B.
      // X — только звук промаха; последней карточкой команда может воспользоваться один раз.
      if (key === 'a') return { type: 'HIT', team: 0 }
      if (key === 'b') return { type: 'HIT', team: 1 }
      if (key === 'x') return { type: 'MISS' }
      if (key === 'Enter') return { type: 'END_ROUND' }
      if (rowKey !== null) return { type: 'OPEN_ROW', index: rowKey }
      return null
    case 'BigPlay':
      // Enter: запустить таймер / остановить его / перейти ко второму игроку / завершить игру.
      if (key === 'Enter') return { type: 'BIG_ENTER', now }
      if (key === 'x') return { type: 'BIG_SAME' }
      return null
    case 'ScoreUpdate':
      if (key === 'Enter') return { type: 'NEXT_ROUND' }
      if (key === 'm' || key === 'Escape') return { type: 'TO_MENU' }
      return null
    case 'Final':
      if (key === 'Enter') return { type: 'CLOSING' }
      if (key === 'r') return { type: 'RESET' }
      return null
    case 'Closed':
      if (key === 'r') return { type: 'RESET' }
      return null
  }
}

export function attachKeymap(): () => void {
  const handler = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    // Автоповтор при зажатой клавише проглатывается: одно нажатие — одно событие.
    if (e.repeat) return
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    if (key === 'f') {
      e.preventDefault()
      if (document.fullscreenElement) void document.exitFullscreen()
      else void document.documentElement.requestFullscreen()
      return
    }
    // Space and arrows scroll the page — always swallow them.
    if (key === ' ' || key.startsWith('Arrow')) e.preventDefault()
    const { phase, mode } = useGame.getState()
    const event = eventFor(phase, mode, key, Date.now())
    if (event) {
      e.preventDefault()
      useGame.getState().dispatch(event)
    }
  }
  window.addEventListener('keydown', handler, { capture: true })
  return () => window.removeEventListener('keydown', handler, { capture: true })
}
