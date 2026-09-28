export type Trigger =
  | 'showIntro'
  | 'simpleGame'
  | 'doubleGame'
  | 'tripleGame'
  | 'viceVersa'
  | 'bigGame'
  | 'round'
  | 'button'
  | 'correct'
  | 'wrong'
  | 'bigGameTimer'
  | 'bigGameSame'
  | 'alarmClock'
  | 'closing'

const FILES: Record<Trigger, string> = {
  showIntro: '/audio/intro-program.mp3',
  simpleGame: '/audio/simple-game.mp3',
  doubleGame: '/audio/double-game.mp3',
  tripleGame: '/audio/triple-game.mp3',
  viceVersa: '/audio/vice-versa-game.mp3',
  bigGame: '/audio/big-game.mp3',
  round: '/audio/round.mp3',
  button: '/audio/button.mp3',
  correct: '/audio/answer-correct.mp3',
  wrong: '/audio/answer-wrong.mp3',
  bigGameTimer: '/audio/big-game-timer.mp3',
  bigGameSame: '/audio/big-game-same-answer.mp3',
  alarmClock: '/audio/alarm-clock.mp3',
  closing: '/audio/closing.mp3',
}

class AudioManager {
  private elements = new Map<Trigger, HTMLAudioElement>()
  unlocked = false

  private el(trigger: Trigger): HTMLAudioElement {
    let a = this.elements.get(trigger)
    if (!a) {
      a = new Audio(FILES[trigger])
      a.preload = 'auto'
      this.elements.set(trigger, a)
    }
    return a
  }

  unlock() {
    if (this.unlocked) return
    this.unlocked = true
    // Play+pause синхронно внутри жеста: разблокирует автоплей,
    // но не ставит отложенный pause, который глушит последующее воспроизведение.
    for (const trigger of Object.keys(FILES) as Trigger[]) {
      const a = this.el(trigger)
      a.muted = true
      a.play()?.catch(() => {})
      a.pause()
      a.currentTime = 0
      a.muted = false
    }
  }

  play(trigger: Trigger) {
    const a = this.el(trigger)
    a.currentTime = 0
    void a.play().catch(() => {})
  }

  /** Обрезка по факту: длинный таймерный трек глушится, когда отсчёт остановили или он истёк. */
  stop(trigger: Trigger) {
    const a = this.elements.get(trigger)
    if (!a) return
    a.pause()
    a.currentTime = 0
  }

  stopAll() {
    for (const a of this.elements.values()) {
      a.pause()
      a.currentTime = 0
    }
  }
}

export const audio = new AudioManager()
