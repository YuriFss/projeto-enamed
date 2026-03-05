export interface QuestionFlowContext {
  currentIndex: number
  totalCount: number
  answeredCount: number
  unansweredCount: number
  previousQuestionId: string | null
  nextQuestionId: string | null
  nextUnansweredQuestionId: string | null
}

export function buildQuestionFlowState(args: {
  orderedCandidates: Array<{ id: string }>
  latestAttemptByQuestion: Map<string, string>
  currentQuestionId: string
}): QuestionFlowContext | null {
  const { orderedCandidates, latestAttemptByQuestion, currentQuestionId } = args
  const currentIndex = orderedCandidates.findIndex((candidate) => candidate.id === currentQuestionId)

  if (currentIndex === -1) {
    return null
  }

  const totalCount = orderedCandidates.length
  const answeredCount = orderedCandidates.filter((candidate) =>
    latestAttemptByQuestion.has(candidate.id)
  ).length
  const unansweredCount = totalCount - answeredCount
  const previousQuestionId = currentIndex > 0 ? orderedCandidates[currentIndex - 1].id : null
  const nextQuestionId =
    currentIndex < orderedCandidates.length - 1 ? orderedCandidates[currentIndex + 1].id : null
  let nextUnansweredQuestionId: string | null = null

  for (let index = currentIndex + 1; index < orderedCandidates.length; index += 1) {
    const candidate = orderedCandidates[index]
    if (!latestAttemptByQuestion.has(candidate.id)) {
      nextUnansweredQuestionId = candidate.id
      break
    }
  }

  return {
    currentIndex,
    totalCount,
    answeredCount,
    unansweredCount,
    previousQuestionId,
    nextQuestionId,
    nextUnansweredQuestionId,
  }
}
