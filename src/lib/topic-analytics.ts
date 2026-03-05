import type { TopicStats } from './types'

interface AttemptWithTopic {
  is_correct: boolean
  question?: {
    specialty_id?: string
    specialty?: {
      name: string
    } | null
    topic_id?: string | null
    topic?: {
      id: string
      name: string
    } | null
  } | null
}

export function buildTopicStats(attempts: AttemptWithTopic[]): TopicStats[] {
  const statsByTopic = new Map<string, TopicStats>()

  attempts.forEach((attempt) => {
    const topic = attempt.question?.topic
    const specialty = attempt.question?.specialty
    const specialtyId = attempt.question?.specialty_id

    if (!topic || !specialty || !specialtyId) {
      return
    }

    const existing = statsByTopic.get(topic.id) || {
      topic_id: topic.id,
      topic_name: topic.name,
      specialty_id: specialtyId,
      specialty_name: specialty.name,
      total_attempts: 0,
      correct_attempts: 0,
      accuracy: 0,
    }

    existing.total_attempts += 1
    if (attempt.is_correct) {
      existing.correct_attempts += 1
    }
    existing.accuracy = Number(
      ((existing.correct_attempts / existing.total_attempts) * 100).toFixed(1)
    )

    statsByTopic.set(topic.id, existing)
  })

  return [...statsByTopic.values()].sort((a, b) => {
    if (a.accuracy === b.accuracy) {
      return b.total_attempts - a.total_attempts
    }

    return a.accuracy - b.accuracy
  })
}
