import type { Question } from './types.ts'

export const QUESTION_ALTERNATIVE_KEYS = ['A', 'B', 'C', 'D', 'E'] as const

export type QuestionAlternativeKey = (typeof QUESTION_ALTERNATIVE_KEYS)[number]

type QuestionAlternativeSource = Pick<
  Question,
  'alternative_a' | 'alternative_b' | 'alternative_c' | 'alternative_d' | 'alternative_e'
>

export function getQuestionAlternatives(question: QuestionAlternativeSource) {
  const alternativesByKey: Record<QuestionAlternativeKey, string> = {
    A: question.alternative_a,
    B: question.alternative_b,
    C: question.alternative_c,
    D: question.alternative_d,
    E: question.alternative_e,
  }

  return QUESTION_ALTERNATIVE_KEYS.flatMap((key) => {
    const text = alternativesByKey[key]

    if (!text?.trim()) {
      return []
    }

    return [{ key, text }]
  })
}
