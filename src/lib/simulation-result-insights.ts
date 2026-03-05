import type { SessionQuestion } from './types'

export interface SimulationInsightModel {
  accuracy: number
  correctCount: number
  totalCount: number
  averageTimePerQuestion: string
  recommendedAction: {
    title: string
    description: string
    href: string
    cta: string
  }
  weakestSpecialty: {
    id: string
    name: string
    accuracy: number
    total: number
    correct: number
  } | null
  weakestTopic: {
    id: string
    name: string
    specialtyId: string
    specialtyName: string
    accuracy: number
    total: number
    correct: number
  } | null
  pacingSummary: string
}

function formatAverageTime(seconds: number, totalCount: number) {
  if (seconds <= 0 || totalCount <= 0) {
    return '0s'
  }

  const averageSeconds = Math.round(seconds / totalCount)
  const minutes = Math.floor(averageSeconds / 60)
  const remainingSeconds = averageSeconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  return `${minutes}min ${remainingSeconds}s`
}

export function buildSimulationResultInsights(
  sessionQuestions: SessionQuestion[],
  totalTimeSeconds: number
): SimulationInsightModel {
  const correctCount = sessionQuestions.filter((question) => question.is_correct).length
  const totalCount = sessionQuestions.length
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
  const specialtyStats = new Map<
    string,
    { id: string; name: string; total: number; correct: number; accuracy: number }
  >()
  const topicStats = new Map<
    string,
    {
      id: string
      name: string
      specialtyId: string
      specialtyName: string
      total: number
      correct: number
      accuracy: number
    }
  >()

  sessionQuestions.forEach((sessionQuestion) => {
    const specialty = sessionQuestion.question?.specialty
    if (specialty) {
      const specialtyEntry = specialtyStats.get(specialty.id) || {
        id: specialty.id,
        name: specialty.name,
        total: 0,
        correct: 0,
        accuracy: 0,
      }
      specialtyEntry.total += 1
      if (sessionQuestion.is_correct) {
        specialtyEntry.correct += 1
      }
      specialtyEntry.accuracy = Math.round((specialtyEntry.correct / specialtyEntry.total) * 100)
      specialtyStats.set(specialty.id, specialtyEntry)
    }

    const topic = sessionQuestion.question?.topic
    if (topic && specialty) {
      const topicEntry = topicStats.get(topic.id) || {
        id: topic.id,
        name: topic.name,
        specialtyId: specialty.id,
        specialtyName: specialty.name,
        total: 0,
        correct: 0,
        accuracy: 0,
      }
      topicEntry.total += 1
      if (sessionQuestion.is_correct) {
        topicEntry.correct += 1
      }
      topicEntry.accuracy = Math.round((topicEntry.correct / topicEntry.total) * 100)
      topicStats.set(topic.id, topicEntry)
    }
  })

  const weakestSpecialty =
    [...specialtyStats.values()].sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0] ||
    null
  const weakestTopic =
    [...topicStats.values()].sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0] || null
  const averageTimePerQuestion = formatAverageTime(totalTimeSeconds, totalCount)

  const recommendedAction =
    weakestTopic && weakestTopic.accuracy < 70
      ? {
          title: `Revisar ${weakestTopic.name}`,
          description: `Esse topico ficou em ${weakestTopic.accuracy}% no simulado. Vale voltar a ele antes do proximo bloco.`,
          href: `/questoes?specialty=${weakestTopic.specialtyId}&topic=${weakestTopic.id}&sort=most_wrong`,
          cta: 'Abrir topico',
        }
      : weakestSpecialty && weakestSpecialty.accuracy < 75
        ? {
            title: `Corrigir ${weakestSpecialty.name}`,
            description: `Sua menor acuracia ficou nessa especialidade. Revise os erros enquanto o simulado ainda esta fresco.`,
            href: `/revisao?tab=erradas&specialty=${weakestSpecialty.id}`,
            cta: 'Ir para revisao',
          }
        : {
            title: 'Consolidar com novo bloco',
            description: 'O desempenho ficou consistente. Agora vale revisar rapidamente e partir para um novo simulado.',
            href: '/simulado',
            cta: 'Novo simulado',
          }

  const pacingSummary =
    totalCount === 0
      ? 'Sem dados suficientes para ler o ritmo.'
      : accuracy >= 75
        ? `Bom ritmo: ${averageTimePerQuestion} por questao com boa taxa de acerto.`
        : `Ritmo de ${averageTimePerQuestion} por questao. O ajuste agora vem de revisar os erros mais caros.`

  return {
    accuracy,
    correctCount,
    totalCount,
    averageTimePerQuestion,
    recommendedAction,
    weakestSpecialty,
    weakestTopic,
    pacingSummary,
  }
}
