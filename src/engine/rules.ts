import type { Mode, RoundSetup, Row } from './types'

export const MULTIPLIER: Record<Mode, number> = {
  simple: 1,
  double: 2,
  triple: 3,
  'vice-versa': 1,
  big: 1,
}

/** цифра в бейдже-иконке команды: «1»/«2»/«3», у «Игры наоборот» — «?» */
export const GAME_LABEL: Record<Mode, string> = {
  simple: '1',
  double: '2',
  triple: '3',
  'vice-versa': '?',
  big: '★',
}

export const MAX_MISSES = 3

/** Большая игра: 15 секунд первому игроку, 20 секунд второму на те же 5 вопросов. */
export const BIG_SECONDS: [number, number] = [15, 20]
export const BIG_QUESTIONS = 5

export const idleBig = () => ({ player: 0 as const, running: false, endsAt: null })

export function rowsForRound(round: RoundSetup): Row[] {
  return round.rows.map((r) => ({ ...r, isOpen: false }))
}

export function closedIndices(rows: Row[]): number[] {
  const out: number[] = []
  rows.forEach((r, i) => {
    if (!r.isOpen) out.push(i)
  })
  return out
}
