import { z } from 'zod'
import yaml from 'js-yaml'
import raw from './questions.yaml?raw'
import type { RoundSetup } from '../engine/types'

const GameDataSchema = z.object({
  teams: z
    .array(z.string().min(1))
    .length(2, 'Нужно ровно две команды')
    .refine((t) => t[0] !== t[1], 'Имена команд должны различаться'),
  rounds: z
    .array(
      z
        .object({
          mode: z.enum(['simple', 'double', 'triple', 'vice-versa', 'big']),
          question: z.string().min(1).optional(),
          // В большой игре карточек нет — табло не используется.
          rows: z
            .array(
              z.object({
                text: z.string().min(1),
                points: z.number().int().positive(),
              }),
            )
            .length(6, 'В раунде должно быть ровно 6 строк')
            .refine(
              (rows) => new Set(rows.map((r) => r.text)).size === rows.length,
              'Тексты ответов в раунде должны быть уникальны',
            )
            .optional(),
        })
        .superRefine((round, ctx) => {
          if (round.mode === 'vice-versa' && !round.question)
            ctx.addIssue({
              code: 'custom',
              message: 'В раунде «vice-versa» обязателен вопрос',
              path: ['question'],
            })
          if (round.mode !== 'big' && !round.rows)
            ctx.addIssue({
              code: 'custom',
              message: `В раунде «${round.mode}» нужно табло из 6 строк`,
              path: ['rows'],
            })
        }),
    )
    .min(1, 'Нужен хотя бы один раунд'),
})

export type GameData = z.infer<typeof GameDataSchema>

export function loadGameData(): { data: GameData; rounds: RoundSetup[] } | { error: string } {
  let parsed: unknown
  try {
    parsed = yaml.load(raw)
  } catch (e) {
    return { error: `Не удалось разобрать YAML: ${e instanceof Error ? e.message : String(e)}` }
  }
  const result = GameDataSchema.safeParse(parsed)
  if (!result.success) {
    const lines = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    return { error: `Ошибка в questions.yaml:\n${lines.join('\n')}` }
  }
  return {
    data: result.data,
    rounds: result.data.rounds.map((r) => ({ ...r, rows: r.rows ?? [] })),
  }
}
