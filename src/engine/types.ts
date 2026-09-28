export type Mode = 'simple' | 'double' | 'triple' | 'vice-versa' | 'big'

export type Phase =
  | 'Menu'
  | 'Intro'
  | 'TeamPlay'
  | 'Chance'
  | 'VicePlay'
  | 'BigPlay'
  | 'ScoreUpdate'
  | 'Final'
  | 'Closed'

export type TeamId = 0 | 1

export interface Row {
  text: string
  points: number
  isOpen: boolean
}

export interface RoundSetup {
  mode: Mode
  /** вопрос раунда; читает ведущий вслух, на экран не выводится */
  question?: string
  rows: { text: string; points: number }[]
}

/** Состояние большого таймера: счёт идёт от абсолютных миллисекунд, движок чистый. */
export interface BigState {
  /** 0 — ещё никто не запускал таймер, 1 — первый игрок, 2 — второй */
  player: 0 | 1 | 2
  running: boolean
  endsAt: number | null
}

export type GameEvent =
  | { type: 'START_ROUND' }
  /** Enter с заставки раунда: табло открыто, но ход ещё не разыгран */
  | { type: 'TO_BOARD' }
  /** A/B на табло: команда забирает право первого ответа, без звука */
  | { type: 'CLAIM'; team: TeamId }
  | { type: 'START_DISCUSSION' }
  | { type: 'OPEN_ROW'; index: number }
  | { type: 'HIT'; team: TeamId }
  | { type: 'MISS' }
  | { type: 'END_ROUND' }
  | { type: 'NEXT_ROUND' }
  | { type: 'BIG_START' }
  | { type: 'BIG_ENTER'; now: number }
  | { type: 'BIG_TIMEUP' }
  | { type: 'BIG_SAME' }
  | { type: 'CLOSING' }
  | { type: 'RESET' }
  | { type: 'TO_MENU' }
  | { type: 'TOGGLE_MENU' }

export interface GameState {
  phase: Phase
  mode: Mode
  roundIndex: number
  /** следующий раунд — большая игра: она стартует из меню, где виден счёт */
  bigGameQueued: boolean
  rounds: RoundSetup[]
  teams: [string, string]
  rows: Row[]
  scores: [number, number]
  /** очки, заработанные каждой командой в текущем раунде */
  roundCredit: [number, number]
  /** банк раунда команды, потерявшей ход; переходит соперникам при верном ответе-шансе */
  atRisk: number
  misses: [number, number]
  /** открытые, но ещё не разыгранные строки «Игры наоборот» (LIFO) */
  uncredited: number[]
  /** «Игра наоборот»: команде уже засчитан её единственный ответ за раунд */
  viceClaimed: [boolean, boolean]
  big: BigState
  /** null — ход ещё не разыгран на табло */
  currentTeam: TeamId | null
  menuShown: boolean
}
