import { useGame } from '../store'
import { audio } from './manager'
import type { GameState, Mode } from '../engine/types'
import type { Trigger } from './manager'

const MODE_INTRO: Record<Mode, Trigger> = {
  simple: 'simpleGame',
  double: 'doubleGame',
  triple: 'tripleGame',
  'vice-versa': 'viceVersa',
  big: 'bigGame',
}

let lastSeq = 0
let started = false

export function startAudioTriggers() {
  if (started) return
  started = true
  useGame.subscribe((state: GameState, prev: GameState) => {
    const last = useGame.getState().lastEvent
    if (!last || last.seq === lastSeq) return
    lastSeq = last.seq
    const { event } = last

    switch (event.type) {
      case 'OPEN_ROW':
      case 'HIT':
        // в «Игре наоборот» открытие строки очков не даёт — и не звучит
        if (state.scores !== prev.scores) audio.play('correct')
        break
      case 'MISS':
        audio.play('wrong')
        break
      case 'BIG_SAME':
        audio.play('bigGameSame')
        break
      case 'BIG_ENTER':
        if (!prev.big.running && state.big.running) audio.play('bigGameTimer')
        else if (prev.big.running && !state.big.running) audio.stop('bigGameTimer')
        break
      case 'BIG_TIMEUP':
        audio.stop('bigGameTimer')
        audio.play('alarmClock')
        break
      case 'CLOSING':
        audio.play('closing')
        break
      case 'RESET':
        audio.stopAll()
        break
      default:
        break
    }

    const phaseChanged = state.phase !== prev.phase
    // Ушли с большой игры — таймерный трек не должен тянуться за экраном.
    if (prev.phase === 'BigPlay' && state.phase !== 'BigPlay') audio.stop('bigGameTimer')
    if (!phaseChanged) return

    switch (state.phase) {
      case 'Intro':
        audio.play(MODE_INTRO[state.mode])
        break
      // button.mp3 — вход на табло: розыгрыш хода ещё впереди
      case 'TeamPlay':
        audio.play('button')
        break
      case 'VicePlay':
        audio.play('bigGameTimer')
        break
      case 'ScoreUpdate':
        audio.play('round')
        break
      default:
        break
    }
  })
}
