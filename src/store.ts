import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameEvent, GameState } from './engine/types'
import { step } from './engine/reducer'
import { idleBig } from './engine/rules'
import { loadGameData } from './data/schema'

const loaded = loadGameData()

export const gameDataError = 'error' in loaded ? loaded.error : null

function emptyState(): GameState {
  return {
    phase: 'Menu',
    mode: 'simple',
    roundIndex: 0,
    bigGameQueued: false,
    rounds: [],
    teams: ['', ''],
    rows: [],
    scores: [0, 0],
    roundCredit: [0, 0],
    atRisk: 0,
    misses: [0, 0],
    uncredited: [],
    viceClaimed: [false, false],
    big: idleBig(),
    currentTeam: null,
    menuShown: false,
  }
}

const initial: GameState =
  'data' in loaded
    ? {
        ...emptyState(),
        rounds: loaded.rounds,
        mode: loaded.rounds[0]?.mode ?? 'simple',
        teams: [loaded.data.teams[0], loaded.data.teams[1]],
      }
    : emptyState()

interface GameStore extends GameState {
  lastEvent: { event: GameEvent; seq: number } | null
  dispatch: (event: GameEvent) => void
}

let eventSeq = 0

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initial,
      lastEvent: null,
      dispatch: (event) => {
        const prev = get()
        const next = step(prev, event)
        set({ ...next, lastEvent: { event, seq: ++eventSeq } })
      },
    }),
    {
      name: '100k1-game',
      partialize: (s) => ({
        phase: s.phase,
        mode: s.mode,
        roundIndex: s.roundIndex,
        bigGameQueued: s.bigGameQueued,
        teams: s.teams,
        rows: s.rows,
        scores: s.scores,
        roundCredit: s.roundCredit,
        atRisk: s.atRisk,
        misses: s.misses,
        uncredited: s.uncredited,
        viceClaimed: s.viceClaimed,
        big: s.big,
        currentTeam: s.currentTeam,
      }),
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<GameState>) }),
    },
  ),
)
