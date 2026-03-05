import test from 'node:test'
import assert from 'node:assert/strict'

import { buildDashboardInsights, formatAverageQuestionTime, formatStudyTime } from './dashboard-insights.ts'

const neutralLearningAnalytics = {
  windows: [
    { days: 7 as const, attempts: 8, correct_attempts: 5, accuracy: 62.5, average_time_seconds: 48, delta_vs_previous_window: null },
    { days: 14 as const, attempts: 16, correct_attempts: 10, accuracy: 62.5, average_time_seconds: 50, delta_vs_previous_window: null },
    { days: 30 as const, attempts: 32, correct_attempts: 21, accuracy: 65.6, average_time_seconds: 51, delta_vs_previous_window: null },
  ],
  curve: {
    first_attempt_count: 10,
    first_attempt_accuracy: 60,
    repeat_attempt_count: 4,
    repeat_attempt_accuracy: 75,
    questions_with_repeats: 3,
    recoverable_questions: 3,
    recovered_questions: 2,
    recovery_rate: 66.7,
    improvement_delta: 15,
  },
}

test('formatStudyTime handles zero and hour-based values', () => {
  assert.equal(formatStudyTime(0), '0min')
  assert.equal(formatStudyTime(3660), '1h 1min')
})

test('formatAverageQuestionTime returns readable durations', () => {
  assert.equal(formatAverageQuestionTime(0, 0), '0s')
  assert.equal(formatAverageQuestionTime(245, 5), '49s')
  assert.equal(formatAverageQuestionTime(720, 6), '2min 0s')
})

test('buildDashboardInsights prioritizes weakest specialty and review action', () => {
  const insights = buildDashboardInsights(
    {
      total_answered: 82,
      total_correct: 49,
      accuracy: 59.8,
      total_time_seconds: 6400,
      study_streak: 6,
      total_sessions: 1,
    },
    [
      {
        specialty_id: 'ped',
        specialty_name: 'Pediatria',
        specialty_color: '#00A6A6',
        total_attempts: 20,
        correct_attempts: 16,
        accuracy: 80,
      },
      {
        specialty_id: 'cm',
        specialty_name: 'Clinica Medica',
        specialty_color: '#F97316',
        total_attempts: 18,
        correct_attempts: 9,
        accuracy: 50,
      },
    ],
    [
      { week: '10/02', total: 10, correct: 7, accuracy: 70 },
      { week: '17/02', total: 15, correct: 8, accuracy: 53.3 },
    ],
    [
      {
        topic_id: 'cardio',
        topic_name: 'Cardiologia',
        specialty_id: 'cm',
        specialty_name: 'Clinica Medica',
        total_attempts: 8,
        correct_attempts: 3,
        accuracy: 37.5,
      },
      {
        topic_id: 'neo',
        topic_name: 'Neonatologia',
        specialty_id: 'ped',
        specialty_name: 'Pediatria',
        total_attempts: 6,
        correct_attempts: 5,
        accuracy: 83.3,
      },
    ],
    neutralLearningAnalytics
  )

  assert.equal(insights.focusSpecialty?.specialty_name, 'Clinica Medica')
  assert.equal(insights.focusTopic?.topic_name, 'Cardiologia')
  assert.equal(insights.strongestTopic?.topic_name, 'Neonatologia')
  assert.equal(insights.strongestSpecialty?.specialty_name, 'Pediatria')
  assert.equal(insights.recommendedAction.href, '/questoes?specialty=cm&topic=cardio&sort=most_wrong')
  assert.equal(insights.trendDirection, 'down')
  assert.match(insights.consistencySummary, /6 dias seguidos/i)
})

test('buildDashboardInsights recommends starting when there is no study history', () => {
  const insights = buildDashboardInsights(
    {
      total_answered: 0,
      total_correct: 0,
      accuracy: 0,
      total_time_seconds: 0,
      study_streak: 0,
      total_sessions: 0,
    },
    [],
    [],
    [],
    neutralLearningAnalytics
  )

  assert.equal(insights.recommendedAction.href, '/questoes')
  assert.equal(insights.studyRhythm, 'Sem ritmo definido')
  assert.equal(insights.averageTimePerQuestion, '0s')
  assert.equal(insights.trendDirection, 'steady')
})

test('buildDashboardInsights prioritizes critical review when recent window drops and repetition is weak', () => {
  const insights = buildDashboardInsights(
    {
      total_answered: 140,
      total_correct: 82,
      accuracy: 58.6,
      total_time_seconds: 9800,
      study_streak: 4,
      total_sessions: 2,
    },
    [
      {
        specialty_id: 'cm',
        specialty_name: 'Clinica Medica',
        specialty_color: '#F472B6',
        total_attempts: 30,
        correct_attempts: 17,
        accuracy: 56.7,
      },
    ],
    [
      { week: '17/02', total: 20, correct: 14, accuracy: 70 },
      { week: '24/02', total: 22, correct: 10, accuracy: 45.5 },
    ],
    [
      {
        topic_id: 'cardio',
        topic_name: 'Cardiologia',
        specialty_id: 'cm',
        specialty_name: 'Clinica Medica',
        total_attempts: 12,
        correct_attempts: 6,
        accuracy: 50,
      },
    ],
    {
      windows: [
        { days: 7, attempts: 14, correct_attempts: 6, accuracy: 42.9, average_time_seconds: 55, delta_vs_previous_window: -12.1 },
        { days: 14, attempts: 30, correct_attempts: 17, accuracy: 56.7, average_time_seconds: 53, delta_vs_previous_window: -8.4 },
        { days: 30, attempts: 58, correct_attempts: 35, accuracy: 60.3, average_time_seconds: 52, delta_vs_previous_window: null },
      ],
      curve: {
        first_attempt_count: 30,
        first_attempt_accuracy: 57,
        repeat_attempt_count: 12,
        repeat_attempt_accuracy: 58,
        questions_with_repeats: 8,
        recoverable_questions: 10,
        recovered_questions: 3,
        recovery_rate: 30,
        improvement_delta: 1,
      },
    }
  )

  assert.equal(insights.recommendedAction.href, '/revisao?tab=erradas')
  assert.equal(insights.recommendedAction.cta, 'Atacar revisao critica')
  assert.match(insights.recommendedAction.title, /queda recente/i)
})
