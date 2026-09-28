import type { GameEvent, GameState, TeamId } from './types'
import { BIG_SECONDS, MAX_MISSES, MULTIPLIER, closedIndices, idleBig, rowsForRound } from './rules'

const other = (t: TeamId): TeamId => (t === 0 ? 1 : 0)

function freshRound(state: GameState, roundIndex: number): GameState {
  const round = state.rounds[roundIndex]
  return {
    ...state,
    roundIndex,
    mode: round.mode,
    rows: rowsForRound(round),
    misses: [0, 0],
    roundCredit: [0, 0],
    atRisk: 0,
    uncredited: [],
    viceClaimed: [false, false],
    big: idleBig(),
    menuShown: false,
    currentTeam: null,
  }
}

/** Полный перезапуск выпуска: то же, что после загрузки страницы без сохранённого состояния. */
function cleared(state: GameState): GameState {
  return {
    ...state,
    phase: 'Menu',
    mode: state.rounds[0]?.mode ?? 'simple',
    roundIndex: 0,
    bigGameQueued: false,
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

function openRow(state: GameState, index: number): GameState {
  const row = state.rows[index]
  if (!row || row.isOpen) return state
  const rows = state.rows.map((r, i) => (i === index ? { ...r, isOpen: true } : r))

  // «Игра наоборот»: строка открывается без очков — начисление только по клавише A/B.
  if (state.mode === 'vice-versa')
    return { ...state, rows, uncredited: [...state.uncredited, index] }

  // Ход ещё не разыгран — начислять очки некому.
  if (state.currentTeam === null) return state

  const scores: [number, number] = [...state.scores]
  const roundCredit: [number, number] = [...state.roundCredit]
  const gained = row.points * MULTIPLIER[state.mode]
  scores[state.currentTeam] += gained
  roundCredit[state.currentTeam] += gained
  return { ...state, rows, scores, roundCredit }
}

export function step(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'START_ROUND': {
      if (state.phase !== 'Menu') return state
      // Большая игра стартует из меню, где виден счёт: очки не обнуляем.
      if (state.bigGameQueued) return { ...state, bigGameQueued: false, phase: 'Intro' }
      if (!state.rounds[0]) return state
      return { ...freshRound({ ...state, scores: [0, 0] }, 0), phase: 'Intro' }
    }

    case 'TO_BOARD': {
      // Простая/двойная/тройная: табло открывается сразу по Enter, а розыгрыш хода идёт на нём.
      if (state.phase !== 'Intro' || state.mode === 'vice-versa' || state.mode === 'big') return state
      return { ...state, phase: 'TeamPlay', currentTeam: null }
    }

    case 'CLAIM': {
      if (state.phase !== 'TeamPlay' || state.currentTeam !== null) return state
      return { ...state, currentTeam: event.team }
    }

    case 'START_DISCUSSION': {
      if (state.phase !== 'Intro' || state.mode !== 'vice-versa') return state
      // Первой отвечает команда с меньшим счётом.
      const currentTeam: TeamId = state.scores[1] < state.scores[0] ? 1 : 0
      return { ...state, phase: 'VicePlay', currentTeam }
    }

    case 'HIT': {
      // Один ответ на команду за раунд: повторные A/B уже не засчитывают строку.
      if (
        state.phase !== 'VicePlay' ||
        state.uncredited.length === 0 ||
        state.viceClaimed[event.team]
      )
        return state
      const index = state.uncredited[state.uncredited.length - 1]
      const gained = state.rows[index].points * MULTIPLIER[state.mode]
      const scores: [number, number] = [...state.scores]
      const roundCredit: [number, number] = [...state.roundCredit]
      const viceClaimed: [boolean, boolean] = [...state.viceClaimed]
      scores[event.team] += gained
      roundCredit[event.team] += gained
      viceClaimed[event.team] = true
      return {
        ...state,
        scores,
        roundCredit,
        viceClaimed,
        uncredited: state.uncredited.slice(0, -1),
        currentTeam: event.team,
      }
    }

    case 'OPEN_ROW': {
      if (state.phase === 'TeamPlay' || state.phase === 'VicePlay') return openRow(state, event.index)
      if (state.phase === 'Chance') return takeChance(state, event.index)
      return state
    }

    case 'MISS': {
      // До выбора команды кресты не загораются — X остаётся только звуком.
      if (state.currentTeam === null) return state
      if (state.phase === 'TeamPlay') {
        const misses: [number, number] = [...state.misses]
        misses[state.currentTeam] += 1
        if (misses[state.currentTeam] < MAX_MISSES) return { ...state, misses }
        // Три промаха — соперникам даётся один ответ-шанс на весь банк раунда.
        return {
          ...state,
          misses,
          currentTeam: other(state.currentTeam),
          atRisk: state.roundCredit[state.currentTeam],
          phase: 'Chance',
        }
      }
      if (state.phase === 'Chance') {
        // Шанс использован неверно: банк остаётся первой команде. Раунд закрывает ведущий.
        const misses: [number, number] = [...state.misses]
        misses[state.currentTeam] += 1
        return { ...state, misses }
      }
      // «Игра наоборот» без промахов: X нужен ведущему только как звук.
      return state
    }

    case 'END_ROUND': {
      if (state.phase !== 'TeamPlay' && state.phase !== 'Chance' && state.phase !== 'VicePlay')
        return state
      // Раунд сыгран, только когда открыто всё табло или разыгран последний шанс.
      // До этого Enter ничего не делает — иначе он проваливает экран до меню.
      if (state.phase !== 'Chance' && closedIndices(state.rows).length > 0) return state
      return { ...state, phase: 'ScoreUpdate' }
    }

    case 'NEXT_ROUND': {
      if (state.phase !== 'ScoreUpdate') return state
      const next = state.roundIndex + 1
      if (next >= state.rounds.length) return { ...state, phase: 'Menu' }
      const fresh = freshRound(state, next)
      // Перед большой игрой показываем меню с очками: кто победил по сумме четырёх раундов.
      return fresh.mode === 'big'
        ? { ...fresh, phase: 'Menu', bigGameQueued: true }
        : { ...fresh, phase: 'Intro' }
    }

    case 'BIG_START':
      if (state.phase !== 'Intro' || state.mode !== 'big') return state
      return { ...state, phase: 'BigPlay', big: idleBig() }

    case 'BIG_ENTER': {
      if (state.phase !== 'BigPlay') return state
      const big = state.big
      // Идёт отсчёт — Enter останавливает его.
      if (big.running) return { ...state, big: { ...big, running: false, endsAt: null } }
      if (big.player === 0)
        return {
          ...state,
          big: { player: 1, running: true, endsAt: event.now + BIG_SECONDS[0] * 1000 },
        }
      if (big.player === 1)
        return {
          ...state,
          big: { player: 2, running: true, endsAt: event.now + BIG_SECONDS[1] * 1000 },
        }
      // Второй таймер остановлен или истёк: большая игра сыграна, очки считает ведущий.
      return { ...state, phase: 'Final', big: { ...big, running: false, endsAt: null } }
    }

    case 'BIG_TIMEUP':
      if (state.phase !== 'BigPlay' || !state.big.running) return state
      return { ...state, big: { ...state.big, running: false, endsAt: null } }

    // X в большой игре — только сигнал о совпавшем ответе, табло не меняет.
    case 'BIG_SAME':
      return state

    case 'CLOSING':
      if (state.phase !== 'Final') return state
      return { ...state, phase: 'Closed' }

    case 'RESET':
      if (state.phase !== 'Menu' && state.phase !== 'Final' && state.phase !== 'Closed')
        return state
      return cleared(state)

    case 'TOGGLE_MENU': {
      if (state.phase === 'Menu') return state
      return { ...state, menuShown: !state.menuShown }
    }

    case 'TO_MENU':
      // Возврат из правил большой игры оставляет её в очереди: Enter вернёт к ней, а не к нулю.
      return {
        ...state,
        phase: 'Menu',
        menuShown: false,
        bigGameQueued: state.mode === 'big',
      }

    default:
      return state
  }
}

// Один ответ второй команды: верно — банк раунда и открытая строка ей.
function takeChance(state: GameState, index: number): GameState {
  const row = state.rows[index]
  if (!row || row.isOpen || state.currentTeam === null) return state
  const lost = other(state.currentTeam)
  const rows = state.rows.map((r, i) => (i === index ? { ...r, isOpen: true } : r))
  const scores: [number, number] = [...state.scores]
  const roundCredit: [number, number] = [...state.roundCredit]
  const gained = state.atRisk + row.points * MULTIPLIER[state.mode]
  scores[lost] -= state.atRisk
  scores[state.currentTeam] += gained
  roundCredit[lost] -= state.atRisk
  roundCredit[state.currentTeam] += gained
  return { ...state, rows, scores, roundCredit, atRisk: 0 }
}
