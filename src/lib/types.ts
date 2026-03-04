export interface Exam {
  id: string
  name: string
  year: number
  type: 'ENARE' | 'ENAMED'
  created_at: string
}

export interface Specialty {
  id: string
  name: string
  color: string
}

export interface Topic {
  id: string
  specialty_id: string
  name: string
  specialty?: Specialty
}

export interface Question {
  id: string
  exam_id: string
  number: number
  statement: string
  alternative_a: string
  alternative_b: string
  alternative_c: string
  alternative_d: string
  alternative_e: string
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation: string | null
  specialty_id: string
  topic_id: string | null
  difficulty: 'facil' | 'medio' | 'dificil'
  created_at: string
  exam?: Exam
  specialty?: Specialty
  topic?: Topic
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export interface QuestionAttempt {
  id: string
  user_id: string
  question_id: string
  session_id: string | null
  selected_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  is_correct: boolean
  time_spent_seconds: number
  flagged: boolean
  created_at: string
  question?: Question
}

export interface SimulationSession {
  id: string
  user_id: string
  mode: 'prova' | 'estudo'
  status: 'in_progress' | 'completed' | 'abandoned'
  total_questions: number
  correct_answers: number
  time_limit_minutes: number | null
  time_spent_seconds: number
  filters: Record<string, unknown>
  started_at: string
  finished_at: string | null
}

export interface SessionQuestion {
  id: string
  session_id: string
  question_id: string
  position: number
  selected_answer: 'A' | 'B' | 'C' | 'D' | 'E' | null
  is_correct: boolean | null
  time_spent_seconds: number
  flagged: boolean
  question?: Question
}

export interface Bookmark {
  id: string
  user_id: string
  question_id: string
  created_at: string
  question?: Question
}

export interface SpecialtyStats {
  specialty_id: string
  specialty_name: string
  specialty_color: string
  total_attempts: number
  correct_attempts: number
  accuracy: number
}

export interface WeeklyAccuracy {
  week: string
  total: number
  correct: number
  accuracy: number
}
